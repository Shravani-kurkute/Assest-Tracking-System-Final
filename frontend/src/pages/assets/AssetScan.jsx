import { useCallback, useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Link } from "react-router-dom";
import { Camera, QrCode, RefreshCw, Search } from "lucide-react";
import toast from "react-hot-toast";

import { lookupAssetByCode } from "../../api/assets";
import { ASSET_CODE_PATTERN, normalizeAssetCode } from "../../utils/assets";

const READER_ID = "asset-qr-reader";

function qrboxForViewfinder(width, height) {
  const edge = Math.min(width, height);
  const size = Math.max(50, Math.min(edge - 8, Math.floor(edge * 0.78)));
  return { width: size, height: size };
}

function cameraErrorMessage(error) {
  const message = String(error?.message || error || "").toLowerCase();
  if (message.includes("permission") || message.includes("notallowed")) {
    return "Camera permission was denied. Allow camera access in your browser settings, then try again.";
  }
  if (message.includes("notfound") || message.includes("no cameras") || message.includes("device")) {
    return "No camera was found on this device. You can enter the asset ID manually.";
  }
  if (message.includes("https") || message.includes("secure")) {
    return "Camera scanning requires HTTPS or localhost. You can enter the asset ID manually.";
  }
  return "The camera scanner could not be started. You can enter the asset ID manually.";
}

function lookupErrorMessage(error, code) {
  if (error.response?.status === 404) {
    return `Asset not found: ${code}`;
  }
  if (error.response?.status === 400) {
    return `This QR code does not contain a valid asset identifier: ${code}`;
  }
  if (error.response?.status === 401 || error.response?.status === 403) {
    return `Authentication or authorization problem (${error.response.status}). Please sign in again.`;
  }
  return "We could not load asset details right now. Please try again.";
}

function formatDate(value) {
  if (!value) return "N/A";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function statusBadgeClass(status) {
  if (status === "Available") return "status-badge status-available";
  if (status === "Assigned") return "status-badge status-assigned";
  if (status === "Maintenance") return "status-badge status-maintenance";
  return "status-badge status-returned";
}

export default function AssetScan() {
  const scannerRef = useRef(null);
  const sessionRef = useRef(0);
  const decodedLockRef = useRef(null);
  const processingRef = useRef(false);
  const frameCountRef = useRef(0);
  const [status, setStatus] = useState("starting");
  const [error, setError] = useState("");
  const [asset, setAsset] = useState(null);
  const [manualCode, setManualCode] = useState("");
  const [decodedCode, setDecodedCode] = useState("");
  const [frameCount, setFrameCount] = useState(0);

  const stopScanner = useCallback(async (target) => {
    const scanner = target || scannerRef.current;
    if (!scanner) return;

    if (scannerRef.current === scanner) scannerRef.current = null;
    try {
      await scanner.stop();
    } catch (error) {
      void error;
    }
    try {
      scanner.clear();
    } catch (error) {
      void error;
    }
  }, []);

  const handleScanFailure = useCallback(() => {
    frameCountRef.current += 1;
    if (frameCountRef.current === 1 || frameCountRef.current % 20 === 0) {
      setFrameCount(frameCountRef.current);
      if (import.meta.env.DEV) {
        console.log("QR FRAME PROCESSING", "No QR decoded", `frames: ${frameCountRef.current}`);
      }
    }
  }, []);

  const resolveAsset = useCallback(async (rawCode, session) => {
    const code = normalizeAssetCode(rawCode);
    if (!ASSET_CODE_PATTERN.test(code)) {
      setAsset(null);
      setError("Enter a valid asset identifier, for example AST-0001.");
      setStatus("error");
      return;
    }

    setError("");
    setStatus("loading");
    try {
      const result = await lookupAssetByCode(code);
      if (session !== sessionRef.current) return;
      setAsset(result);
      setStatus("done");
    } catch (requestError) {
      if (session !== sessionRef.current) return;
      setAsset(null);
      setError(lookupErrorMessage(requestError, code));
      setStatus("error");
    }
  }, []);

  const startScanner = useCallback(async (options = {}) => {
    if (options.resetLock) decodedLockRef.current = null;

    const session = ++sessionRef.current;
    await stopScanner();
    if (session !== sessionRef.current) return;

    setAsset(null);
    setError("");
    setManualCode("");
    setDecodedCode("");
    setFrameCount(0);
    frameCountRef.current = 0;
    processingRef.current = false;
    setStatus("starting");

    if (import.meta.env.DEV) {
      console.log("QR SCANNER START", { facingMode: "environment", fps: 20, formatsToSupport: [0], useBarCodeDetectorIfSupported: true });
    }

    if (!window.isSecureContext) {
      if (import.meta.env.DEV) console.error("QR SCANNER ERROR", "Insecure context");
      setError("Camera scanning requires HTTPS or localhost. You can enter the asset ID manually.");
      setStatus("error");
      return;
    }

    let scanner;
    try {
      scanner = new Html5Qrcode(READER_ID, {
        verbose: false,
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        useBarCodeDetectorIfSupported: true,
      });
    } catch (initError) {
      if (import.meta.env.DEV) console.error("QR SCANNER ERROR", initError);
      setError("The QR scanner could not be initialized. You can enter the asset ID manually.");
      setStatus("error");
      return;
    }
    scannerRef.current = scanner;

    const handleScanSuccess = async (decodedText) => {
      if (session !== sessionRef.current) return;

      const code = normalizeAssetCode(decodedText);
      setDecodedCode(code);
      if (import.meta.env.DEV) {
        console.log("QR DECODE SUCCESS");
        console.log("Decoded value:", decodedText);
        console.log("Normalized value:", code);
      }
      if (processingRef.current || decodedLockRef.current === code) return;
      processingRef.current = true;
      decodedLockRef.current = code;

      try {
        await stopScanner(scanner);
        if (session !== sessionRef.current) return;

        if (!ASSET_CODE_PATTERN.test(code)) {
          setAsset(null);
          setError(`Asset not found: ${code}`);
          setStatus("error");
          return;
        }

        await resolveAsset(code, session);
      } finally {
        processingRef.current = false;
      }
    };

    try {
      await scanner.start(
        { facingMode: "environment" },
        { fps: 20, qrbox: qrboxForViewfinder },
        handleScanSuccess,
        handleScanFailure
      );
      if (session !== sessionRef.current) {
        await stopScanner(scanner);
        return;
      }
      setStatus("scanning");
    } catch (startError) {
      if (import.meta.env.DEV) console.error("QR SCANNER ERROR", startError);
      if (session !== sessionRef.current) return;
      setError(cameraErrorMessage(startError));
      setStatus("error");
    }
  }, [handleScanFailure, resolveAsset, stopScanner]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) startScanner();
    });

    return () => {
      active = false;
      sessionRef.current += 1;
      stopScanner();
    };
  }, [startScanner, stopScanner]);

  const handleManualSubmit = async (event) => {
    event.preventDefault();
    if (!manualCode.trim()) {
      toast.error("Enter an asset identifier to look up.");
      return;
    }

    const session = ++sessionRef.current;
    await stopScanner();
    decodedLockRef.current = normalizeAssetCode(manualCode);
    setDecodedCode("");
    processingRef.current = true;
    try {
      await resolveAsset(manualCode, session);
    } finally {
      processingRef.current = false;
    }
  };

  const statusLabel = {
    starting: "Starting camera...",
    scanning: "Scanning for a QR code...",
    loading: "Looking up asset...",
    done: "Asset found",
    error: "Scanner paused",
  }[status];

  return (
    <div className="space-y-6">
      <section className="card overflow-hidden p-0">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="section-title">Scan Asset QR</h2>
            <p className="mt-1 text-sm text-slate-500">
              Point your camera at an asset QR code to retrieve its details.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="badge badge-blue">{statusLabel}</span>
            <button
              type="button"
              onClick={() => startScanner({ resetLock: true })}
              className="btn-secondary inline-flex items-center gap-2 rounded-xl px-4 py-3"
            >
              <RefreshCw className="h-4 w-4" />
              Scan Another
            </button>
          </div>
        </div>

        <div className="px-6 py-6">
          <div
            id={READER_ID}
            className="mx-auto w-full max-w-xl overflow-hidden rounded-2xl bg-slate-900"
          />

          {import.meta.env.DEV ? (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Decoded QR Value
              </p>
              <p className="mt-1 font-mono text-sm text-slate-900">
                {decodedCode || "[waiting...]"}
              </p>
              <p className="mt-1 text-xs text-slate-500">Frames processed: {frameCount}</p>
            </div>
          ) : null}

          {error ? <div className="feedback-error mt-5">{error}</div> : null}
          {error && decodedCode ? (
            <p className="mt-2 text-xs text-slate-500">
              QR detected: <span className="font-semibold text-slate-700">{decodedCode}</span>
            </p>
          ) : null}

          <form onSubmit={handleManualSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={manualCode}
              onChange={(event) => setManualCode(event.target.value)}
              placeholder="Or enter asset ID (AST-0001)"
              className="input-field"
              aria-label="Asset identifier"
            />
            <button type="submit" className="btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-3">
              <Search className="h-4 w-4" />
              Look up
            </button>
          </form>
        </div>
      </section>

      {asset ? (
        <section className="card">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100">
              <QrCode className="h-5 w-5 text-emerald-700" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                QR Code Detected
              </p>
              <h2 className="section-title">{asset.name || "Unnamed asset"}</h2>
              <p className="mt-1 text-sm font-medium text-sky-700">Asset ID: {asset.asset_id}</p>
              {decodedCode ? (
                <p className="mt-2 text-xs text-slate-500">
                  QR detected: <span className="font-semibold text-slate-700">{decodedCode}</span>
                </p>
              ) : null}
            </div>
          </div>

          <dl className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">Category</dt>
              <dd className="mt-1 text-sm text-slate-900">{asset.category}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">Status</dt>
              <dd className="mt-1">
                <span className={statusBadgeClass(asset.status)}>{asset.status}</span>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">Assigned To</dt>
              <dd className="mt-1 text-sm text-slate-900">
                {asset.assigned_user?.full_name || asset.assigned_to || "Unassigned"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">Purchase Date</dt>
              <dd className="mt-1 text-sm text-slate-900">{formatDate(asset.purchase_date)}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">Description</dt>
              <dd className="mt-1 text-sm text-slate-900">{asset.description || "No description"}</dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => startScanner({ resetLock: true })}
              className="btn-secondary inline-flex items-center gap-2 rounded-xl px-4 py-3"
            >
              <RefreshCw className="h-4 w-4" />
              Scan Another
            </button>
            <Link
              to="/assets"
              className="btn-secondary inline-flex items-center gap-2 rounded-xl px-4 py-3"
            >
              View Asset Details
            </Link>
          </div>
        </section>
      ) : null}

      {!asset && status === "error" ? (
        <div className="card flex items-center gap-3 text-sm text-slate-500">
          <Camera className="h-5 w-5 text-slate-400" />
          You can use manual entry above or press &quot;Scan Another&quot; to retry.
        </div>
      ) : null}
    </div>
  );
}
