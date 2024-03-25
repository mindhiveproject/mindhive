import { useState } from "react";

import {
  MessageHeader,
  MessageContent,
  Message,
  Icon,
} from "semantic-ui-react";

import Render from "./Render";
import CodeEditor from "./Controller/CodeEditor";

const defaultCode = `import js_workspace as data
data = data.to_py()
df = pd.DataFrame(data)
df.head()`;

export default function StateManager({
  content,
  handleChange,
  pyodide,
  data,
  variables,
}) {
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState("");
  // state of the python code
  const code = content?.code || defaultCode;
  // variables
  const variableNames = variables
    .filter((column) => !column?.hide)
    .map((column) => column?.field);

  const addToOutput = (s) => {
    setOutput(output + ">>>" + "\n" + s + "\n");
    setIsRunning(false);
  };

  const runCode = async ({ code }) => {
    if (pyodide) {
      try {
        setIsRunning(true);
        const res = await pyodide.runPythonAsync(code);
        addToOutput(res);
      } catch (err) {
        addToOutput(err);
      }
    }
  };

  return (
    <div className="statistics">
      <CodeEditor code={code} handleChange={handleChange} runCode={runCode} />
      {isRunning && (
        <Message icon>
          <Icon name="circle notched" loading />
          <MessageContent>
            <MessageHeader>Just one second</MessageHeader>
            The code is running.
          </MessageContent>
        </Message>
      )}
      {code && pyodide && (
        <Render data={data} code={code} pyodide={pyodide} runCode={runCode} />
      )}
      <div>Output:</div>
      <textarea
        className="outputArea"
        id="output"
        value={output}
        rows={12}
        disabled
      />
      <div>
        <button
          onClick={() => {
            setOutput("");
          }}
        >
          Clean output
        </button>
      </div>
    </div>
  );
}
