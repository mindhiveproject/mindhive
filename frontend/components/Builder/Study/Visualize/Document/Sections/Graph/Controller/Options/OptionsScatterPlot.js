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
xLabel = js.document.getElementById('xLabel-${sectionId}').value
xRangeMin = js.document.getElementById('xRangeMin-${sectionId}').value
xRangeMax = js.document.getElementById('xRangeMax-${sectionId}').value
yLabel = js.document.getElementById('yLabel-${sectionId}').value
yRangeMin = js.document.getElementById('yRangeMin-${sectionId}').value
yRangeMax = js.document.getElementById('yRangeMax-${sectionId}').value
marginalPlot = js.document.getElementById('marginalPlot-${sectionId}').value
legend_title_text = js.document.getElementById('legend_title_text-${sectionId}').value
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
        <label htmlFor="graphTitle">Graph Title</label>
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

      <div className="subheader">X-Axis</div>

      <div className="subsection">
        <label htmlFor="xLabel" className="title">
          Label
        </label>
        <input
          id={`xLabel-${sectionId}`}
          type="text"
          name="xLabel"
          value={selectors["xLabel"]}
          onChange={({ target }) =>
            handleContentChange({
              newContent: {
                selectors: { ...selectors, xLabel: target.value },
              },
            })
          }
          onBlur={() => updateCode({ code })}
        />

        <label htmlFor="xRange" className="title">
          Range
        </label>
        <div className="ranges">
          <input
            id={`xRangeMin-${sectionId}`}
            type="number"
            name="xRangeMin"
            value={selectors["xRangeMin"]}
            onChange={({ target }) =>
              handleContentChange({
                newContent: {
                  selectors: { ...selectors, xRangeMin: target.value },
                },
              })
            }
            onBlur={() => updateCode({ code })}
          />
          <input
            id={`xRangeMax-${sectionId}`}
            type="number"
            name="xRangeMax"
            value={selectors["xRangeMax"]}
            onChange={({ target }) =>
              handleContentChange({
                newContent: {
                  selectors: { ...selectors, xRangeMax: target.value },
                },
              })
            }
            onBlur={() => updateCode({ code })}
          />
        </div>
      </div>

      <div className="subheader">Y-Axis</div>

      <div className="subsection">
        <label htmlFor="yLabel" className="title">
          Label
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

        <label htmlFor="yRange" className="title">
          Range
        </label>
        <div className="ranges">
          <input
            id={`yRangeMin-${sectionId}`}
            type="number"
            name="yRangeMin"
            value={selectors["yRangeMin"]}
            onChange={({ target }) =>
              handleContentChange({
                newContent: {
                  selectors: { ...selectors, yRangeMin: target.value },
                },
              })
            }
            onBlur={() => updateCode({ code })}
          />
          <input
            id={`yRangeMax-${sectionId}`}
            type="number"
            name="yRangeMax"
            value={selectors["yRangeMax"]}
            onChange={({ target }) =>
              handleContentChange({
                newContent: {
                  selectors: { ...selectors, yRangeMax: target.value },
                },
              })
            }
            onBlur={() => updateCode({ code })}
          />
        </div>
      </div>

      <div className="subheader">Marginal plot</div>

      <div className="subsection">
        <select
          id={`marginalPlot-${sectionId}`}
          name="marginalPlot"
          value={selectors["marginalPlot"]}
          onChange={({ target }) =>
            handleContentChange({
              newContent: {
                selectors: { ...selectors, marginalPlot: target.value },
              },
            })
          }
          onBlur={() => updateCode({ code })}
        >
          {marginalPlotsOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.text}</option>
          ))}

        </select>
      </div>

      <div className="subheader">Legend title</div>

      <label htmlFor="legend_title_text" className="title">
      (leave empty if not needed)
      </label>
      <input
        id={`legend_title_text-${sectionId}`}
        type="text"
        name="legend_title_text"
        value={selectors["legend_title_text"]}
        onChange={({ target }) =>
          handleContentChange({
            newContent: {
              selectors: { ...selectors, legend_title_text: target.value },
            },
          })
        }
        onBlur={() => updateCode({ code })}
      />      
    </div>
  );
}
