import { useState } from 'react';

const IdentIcon = ({ size, value }) => {
  const [base64, setBase64] = useState(undefined);

  // using dynamic import to save some loading
  import('jdenticon').then(({ toSvg }) => {
    const svgString = toSvg(value, size);
    const b64 = Buffer.from(svgString).toString('base64');
    setBase64(b64);
  });

  return base64 ? (
    <img src={`data:image/svg+xml;base64,${base64}`} alt="User Avatar" />
  ) : (
    <div style={{ width: size, height: size, display: 'inline-block' }} />
  );
};

export default IdentIcon;
