import { useEffect, useState } from "react";

const IdentIcon = ({ size, value }) => {
  const [base64, setBase64] = useState(undefined);

  useEffect(() => {
    let isMounted = true;

    async function generate() {
      const { toSvg } = await import("jdenticon"); // dynamic import
      const svgString = toSvg(value, size);

      // Convert SVG string to base64 using browser API
      const b64 = window.btoa(unescape(encodeURIComponent(svgString)));

      if (isMounted) {
        setBase64(b64);
      }
    }

    generate();

    return () => {
      isMounted = false;
    };
  }, [value, size]);

  return base64 ? (
    <img
      src={`data:image/svg+xml;base64,${base64}`}
      alt="User Avatar"
      width={size}
      height={size}
      style={{ display: "inline-block" }}
    />
  ) : (
    <div style={{ width: size, height: size, display: "inline-block" }} />
  );
};

export default IdentIcon;
