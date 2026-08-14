export default function DashboardAssetIcon({ src, size = 24 }) {
  if (!src) return null;
  return (
    <img
      src={src}
      alt=""
      aria-hidden
      width={size}
      height={size}
      style={{ display: "block", flexShrink: 0 }}
    />
  );
}
