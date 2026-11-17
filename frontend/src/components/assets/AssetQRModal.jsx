import { useRef } from "react";
import { Download, Printer, X } from "lucide-react";

import AssetQRCode from "./AssetQRCode";
import { normalizeAssetCode } from "../../utils/assets";

export default function AssetQRModal({ asset, onClose }) {
  const qrRef = useRef(null);

  if (!asset) return null;

  const code = normalizeAssetCode(asset.asset_id);

  const handleDownload = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg || !code) return;

    if (!svg.getAttribute("xmlns")) {
      svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    }
    const markup = new XMLSerializer().serializeToString(svg);
    const url = URL.createObjectURL(
      new Blob([markup], { type: "image/svg+xml;charset=utf-8" })
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `${code}-qr.svg`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 qr-no-print">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Asset QR Code</h2>
            <p className="mt-1 text-sm text-slate-500">
              Scan this code to identify the asset.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close QR view"
            className="rounded-2xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col items-center px-6 py-7 text-center qr-print-area">
          <h3 className="text-lg font-semibold text-slate-900">
            {asset.name || "Unnamed asset"}
          </h3>
          <p className="mt-1 text-sm font-medium text-sky-700">{code}</p>

          <div ref={qrRef} className="mt-6">
            <AssetQRCode assetId={code} />
          </div>

          <p className="mt-6 text-sm text-slate-500">
            Scan this QR code to view asset details.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 border-t border-slate-100 px-6 py-5 qr-no-print">
          <button
            type="button"
            onClick={() => window.print()}
            className="btn-secondary inline-flex items-center gap-2 rounded-xl px-4 py-3"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={!code}
            className="btn-secondary inline-flex items-center gap-2 rounded-xl px-4 py-3"
          >
            <Download className="h-4 w-4" />
            Download SVG
          </button>
          <button type="button" onClick={onClose} className="btn-primary rounded-xl px-4 py-3">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
