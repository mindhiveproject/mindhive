// https://uiwjs.github.io/react-codemirror/#/theme/home

import { useState, useEffect, useCallback } from "react";

import { python } from "@codemirror/lang-python";
import CodeMirror from '@uiw/react-codemirror';

export default function SpecEditor({ spec, setSpec }) {
  // local string version of the spec
  const [localSpec, setLocalSpec] = useState('');

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

  const onChange = useCallback((val, viewUpdate) => {
    setLocalSpec(val);
  }, []);

  return (
    <div>
      <p>
        <button onClick={(e) => evaluate()}>Update</button>
      </p>
      <CodeMirror value={localSpec} height="300px" extensions={python()} onChange={onChange} theme='light'/>
    </div>
  );
}