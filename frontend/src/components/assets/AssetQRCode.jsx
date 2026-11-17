import { QRCodeSVG } from "qrcode.react";
import { normalizeAssetCode } from "../../utils/assets";

export default function AssetQRCode({ assetId, size = 320, className = "" }) {
  const code = normalizeAssetCode(assetId);
  if (import.meta.env.DEV) console.log("QR PAYLOAD", code);

  return (
    <div className={`inline-flex rounded-2xl bg-white p-4 shadow-sm ${className}`}>
      {code ? (
        <QRCodeSVG
          value={code}
          size={size}
          level="Q"
          marginSize={4}
          fgColor="#0f172a"
          bgColor="#ffffff"
        />
      ) : (
        <p className="px-4 py-8 text-sm text-slate-500">
          No asset identifier available.
        </p>
      )}
    </div>
  );
}
