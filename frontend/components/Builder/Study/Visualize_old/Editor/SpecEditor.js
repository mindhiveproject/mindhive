import { useState, useEffect } from "react";

import JSONInput from "react-json-editor-ajrm";
import locale from "react-json-editor-ajrm/locale/en";

export default function SpecEditor({ spec, setSpec }) {
  // local string version of the spec
  const [localSpec, setLocalSpec] = useState(JSON.stringify({}));
  useEffect(() => {
    setLocalSpec(spec);
  }, [spec]);

  const evaluate = () => {
    try {
      setSpec(localSpec);
    } catch (error) {
      console.log("error", error);
    }
  };

  return (
    <div>
      <p>
        <button onClick={(e) => evaluate()}>Update</button>
      </p>
      <JSONInput
        width={600}
        placeholder={spec}
        onBlur={(value) => {
          setLocalSpec(value.jsObject);
        }}
        locale={locale}
        theme="light_mitsuketa_tribute"
        style={{
          body: {
            fontSize: "18px",
          },
        }}
      />
    </div>
  );
}