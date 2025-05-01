import { useState, useEffect, useCallback } from "react";

import {
  MessageHeader,
  MessageContent,
  Message,
  Icon,
  AccordionTitle,
  AccordionContent,
  Accordion,
} from "semantic-ui-react";

import Render from "./Render";
import CodeEditor from "./Controller/CodeEditor";
import AxesComponent from "./Controller/Axes/AxesDefault";

const allInOneCode = `
#column_input = columns # ['COLUMN_NAME', 'COLUMN_NAME', 'COLUMN_NAME']
print("parametersparametersparametersparametersparametersparametersparameters")
print(parameters)
colMultiple = parameters["colMultiple"] if "colMultiple" in parameters else None
print(colMultiple)
if colMultiple != None:
    #colMultiple_json = colMultiple.value.split(",")
    column_input = colMultiple
else:
    column_input = None
print(column_input)


groupVariable = parameters["groupVariable"] if "groupVariable" in parameters else ""
isQuant       = parameters["dataType"] == "quant" if "dataType" in parameters else True

print(groupVariable)
print(isQuant)
#############################################################################################
######################### Don't change anything below #######################################
#############################################################################################

import js_workspace as data
data = data.to_py()
df = pd.DataFrame(data)

df.replace('NaN', np.nan, inplace=True)
described_df = pd.DataFrame()

for column in column_input:
    if isQuant:
        df[column] = pd.to_numeric(df[column], errors='coerce') 
    
    if groupVariable != "":
        grouped = df[
            df[groupVariable].notna() & (df[groupVariable] != "") &
            df[column].notna() & (df[column] != "")
        ].groupby(groupVariable)[column].describe()
    
        grouped.columns = [f"{column}_{col}" for col in grouped.columns]
        described_df = pd.concat([described_df, grouped], axis=1)
    else:
        if isQuant:
            described_df = pd.concat([described_df, df[column].describe()], axis=1)
        else:
            filtered = df[column][df[column].notna() & (df[column] != "")]
            value_counts = filtered.value_counts()
            temp_counts = pd.DataFrame({
                "Variable": column,
                "Group Label": ['Count {}'.format(i if i != "" else "empty values") for i in value_counts.index],
                "Count": value_counts.values
            })
            total_row = pd.DataFrame({
                "Variable": [column],
                "Group Label": ["total non-empty values"],
                "Count": [filtered.count()]
            })
            described_df = pd.concat([described_df, temp_counts, total_row], ignore_index=True)

described_df = described_df.transpose() if isQuant else described_df
`;

const sectionCodeEnd = `  
df_html = described_df.to_html()
js.render_html(html_output, df_html)`;

export default function StateManager({
  content,
  handleContentChange,
  pyodide,
  sectionId,
  data,
  variables,
}) {
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [runCodeCallback, setRunCodeCallback] = useState(null);


  const handleClick = (e, titleProps) => {
    const { index } = titleProps;
    const newIndex = activeIndex === index ? -1 : index;
    setActiveIndex(newIndex);
  };

  // state of the python code
  const code = content?.code || allInOneCode + "\n" + sectionCodeEnd;
  // state of the selectors
  const selectors = content?.selectors || {};
  // state of the graph type
  const type = content?.type || undefined;
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

  const handleContentChangeWrapper = ({ newContent }) => {
    if (newContent.code !== undefined) {
      handleContentChange({ newContent });
    }
    if (newContent.selectors !== undefined) {
      handleContentChange({ newContent });
    }
    if (newContent.type !== undefined) {
      handleContentChange({ newContent });
    }
  };

  const registerRunCodeCallback = useCallback((callback) => {
    setRunCodeCallback(() => callback);
  }, []);

   // Run the default template code if no code is already set
   useEffect(() => {
    if (!code && pyodide) {
      handleContentChange((prevContent) => ({
        ...prevContent,
        code: allInOneCode,
      }));
      runCode({ code: allInOneCode });
    }
  }, [pyodide, code, handleContentChange]);

  return (
    <div className="graph">
      {/* {!code && pyodide && (
        <TemplateSelector
          handleContentChange={handleContentChange}
          runCode={runCode}
          sectionId={sectionId}
        />
      )} */}

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
        <>
          <div className="htmlRenderContainer">
            <Render
              type={type}
              data={data}
              code={code}
              pyodide={pyodide}
              runCode={runCode}
              sectionId={sectionId}
            />
          </div>
          <div className="tableRenderContainerDescStat">
            <AxesComponent
              type={type}
              variables={variablesToDisplay}
              code={code}
              pyodide={pyodide}
              runCode={runCode}
              sectionId={sectionId}
              selectors={selectors}
              handleContentChange={handleContentChangeWrapper}
            />
          </div>
          {code && pyodide && (
            <CodeEditor
              code={code}
              handleContentChange={handleContentChange}
              runCode={runCode}
            />
          )}
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
        </>
      )}
    </div>
  );
}
