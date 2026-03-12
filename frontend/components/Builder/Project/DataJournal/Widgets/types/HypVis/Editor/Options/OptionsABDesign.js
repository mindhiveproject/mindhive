import { Dropdown } from "semantic-ui-react";

const marginalPlotsOptions = [
  { value: "", text: "" },
  { value: "box", text: "Boxplot" },
  { value: "rug", text: "Rug" },
];

export default function Options({
  type,
  variables,
  code,
  pyodide,
  runCode,
  sectionId,
  selectors,
  handleContentChange,
}) {
  const connectDashboardCode = `# get relevant html elements
custom_title = None if js.document.getElementById("custom_title-${sectionId}") == None else js.document.getElementById("custom_title-${sectionId}").value
yLabel = js.document.getElementById('yLabel-${sectionId}').value
`;
  const updateCode = async ({ code }) => {
    await pyodide.runPythonAsync(connectDashboardCode);
    runCode({ code });
  };

  return (
    <div className="graphDashboard">
      <div className="subsection">
        <div className="header">
          <img src={`/assets/icons/visualize/chat_add_on.svg`} />
          <div>Options (A-B Design)</div>
        </div>
        <label htmlFor="custom_title">Title</label>
        <input
          id={`custom_title-${sectionId}`}
          type="text"
          name="custom_title"
          value={selectors.custom_title}
          onChange={({ target }) =>
            handleContentChange({
              newContent: {
                selectors: { ...selectors, custom_title: target.value },
              },
            })
          }
          onBlur={() => updateCode({ code })}
        />
      </div>

      <div className="subsection">
        <label htmlFor="yLabel" className="title">
          Y Label
        </label>
        <input
          id={`yLabel-${sectionId}`}
          type="text"
          name="yLabel"
          value={selectors["yLabel"]}
          onChange={({ target }) =>
            handleContentChange({
              newContent: {
                selectors: { ...selectors, yLabel: target.value },
              },
            })
          }
          onBlur={() => updateCode({ code })}
        />
      </div>
    </div>
  );
}
