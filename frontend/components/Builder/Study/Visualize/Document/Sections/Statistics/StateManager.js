import { useState } from "react";

import {
  MessageHeader,
  MessageContent,
  Message,
  Icon,
  Accordion,
  AccordionTitle,
  AccordionContent,
} from "semantic-ui-react";

import Render from "./Render";
import CodeEditor from "./Controller/CodeEditor";

const defaultCode = `

column_input = ['GT_gamble_percentage_gain', 'GT_gamble_percentage_lose', 'GT_last_score']




#############################################################################################
######################### Don't change anything below #######################################
#############################################################################################

import js_workspace as data
import numpy as np
data = data.to_py()
df = pd.DataFrame(data)

df.replace('NaN', np.nan, inplace=True)
described_df = pd.DataFrame()

# Loop over the list of columns
for column in column_input:
    # Convert the column to numeric
    df[column] = pd.to_numeric(df[column], errors='coerce') 
    # Describe the column and add it to the described_df DataFrame
    described_df = pd.concat([described_df, df[column].describe()], axis=1)

# Put the ds in the correct orientation
described_df = described_df.transpose()

df_html = described_df.to_html()
js.render_html(html_output, df_html)`;

export default function StateManager({
  content,
  handleChange,
  pyodide,
  sectionId,
  data,
  variables,
}) {
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState("");

  const [activeIndex, setActiveIndex] = useState(-1);

  const handleClick = (e, titleProps) => {
    const { index } = titleProps;
    const newIndex = activeIndex === index ? -1 : index;
    setActiveIndex(newIndex);
  };

  // state of the python code
  const code = content?.code || defaultCode;
  // get variable names
  const variablesToDisplay = variables.filter((column) => !column?.hide);

  const addToOutput = (s) => {
    if (typeof s === "undefined") {
      setOutput("");
    } else {
      setOutput(s);
    }
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
      {code && pyodide && (
        <CodeEditor code={code} handleChange={handleChange} runCode={runCode} />
      )}

      {isRunning && (
        <Message icon>
          <Icon name="circle notched" loading />
          <MessageContent>
            <MessageHeader>Just one second</MessageHeader>
            The code is running.
          </MessageContent>
        </Message>
      )}
      <div className="htmlRenderContainer">
        {code && pyodide && (
          <Render
            data={data}
            code={code}
            pyodide={pyodide}
            runCode={runCode}
            sectionId={sectionId}
          />
        )}
      </div>

      <Accordion>
        <AccordionTitle
          active={activeIndex === 0}
          index={0}
          onClick={handleClick}
        >
          <Icon name="dropdown" />
          Console
        </AccordionTitle>
        <AccordionContent active={activeIndex === 0}>
          <textarea
            className="outputArea"
            id="output"
            value={output}
            rows={12}
            disabled
          />
        </AccordionContent>
      </Accordion>
    </div>
  );
}
