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
graphTitle = js.document.getElementById('graphTitle-${sectionId}').value
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
          <div>Options</div>
        </div>
        <label htmlFor="graphTitle">Title</label>
        <input
          id={`graphTitle-${sectionId}`}
          type="text"
          name="graphTitle"
          value={selectors.graphTitle}
          onChange={({ target }) =>
            handleContentChange({
              newContent: {
                selectors: { ...selectors, graphTitle: target.value },
              },
            })
          }
          onBlur={() => updateCode({ code })}
        />
      </div>
    </div>
  );
}
