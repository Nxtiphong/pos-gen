import { create } from "qrcode";

export function BillQr({ url, label }: { url: string; label: string }) {
  const { modules } = create(url, { errorCorrectionLevel: "M" });
  let d = "";
  for (let y = 0; y < modules.size; y++) {
    for (let x = 0; x < modules.size; x++) {
      if (modules.get(y, x)) d += `M${x} ${y}h1v1h-1z`;
    }
  }
  return (
    <svg
      role="img"
      aria-label={label}
      width="300"
      height="300"
      viewBox={`0 0 ${modules.size} ${modules.size}`}
      shapeRendering="crispEdges"
      className="block"
    >
      <path d={d} fill="#1c1d1a" />
    </svg>
  );
}
