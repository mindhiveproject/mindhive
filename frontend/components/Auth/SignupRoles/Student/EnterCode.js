import { useState } from "react";
import Link from "next/link";

export default function EnterCode({}) {
  const [code, setCode] = useState("");
  return (
    <div className="enterCodeScreen">
      <h1>Enter your class code</h1>
      <div>
        <label htmlFor="classCode">
          <p>Class code</p>
          <input
            type="text"
            id="classCode"
            name="classCode"
            placeholder="e.g. test-class"
            onChange={({ target }) => setCode(target?.value)}
            value={code}
          />
          <div className="helpMessage">
            This code is provided by your teacher and is how you will join your
            class.
          </div>
        </label>
      </div>
      <Link
        href={{
          pathname: `/signup/student`,
          query: {
            code: code,
          },
        }}
      >
        <button>Next</button>
      </Link>
    </div>
  );
}
