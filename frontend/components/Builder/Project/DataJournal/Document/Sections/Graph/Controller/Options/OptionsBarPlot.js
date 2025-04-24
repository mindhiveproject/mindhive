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
xLabel = js.document.getElementById('xLabel-${sectionId}').value

#x_labels = columns #js.document.getElementById('x_labels-${sectionId}').value
legend_title = js.document.getElementById('legend_title-${sectionId}').value

yLabel = js.document.getElementById('yLabel-${sectionId}').value
yRangeMin = js.document.getElementById('yRangeMin-${sectionId}').value
yRangeMax = js.document.getElementById('yRangeMax-${sectionId}').value

color = 'pink' if js.document.getElementById('color-${sectionId}') == None else js.document.getElementById('color-${sectionId}').value`
;

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
      
      <div className="subheader">X-axis labels and Legend title</div>

      {/* <div className="subsection">
        <label htmlFor="x_labels" className="title">
          Label for x axis
        </label>
        <input
          id={`x_labels-${sectionId}`}
          type="text"
          name="x_labels"
          value={selectors["x_labels"]}
          onChange={({ target }) =>
            handleContentChange({
              newContent: {
                selectors: { ...selectors, x_labels: target.value },
              },
            })
          }
          onBlur={() => updateCode({ code })}
        />
      </div> */}

      <div className="subsection">
        <label htmlFor="legend_title" className="title">
          Legend title
        </label>
        <input
          id={`legend_title-${sectionId}`}
          type="text"
          name="legend_title"
          value={selectors["legend_title"]}
          onChange={({ target }) =>
            handleContentChange({
              newContent: {
                selectors: { ...selectors, legend_title: target.value },
              },
            })
          }
          onBlur={() => updateCode({ code })}
        />
      </div>

      <div className="subheader">Color</div>
      <div className="subsection">
        <label htmlFor="color" className="title">Give a base color for the bar (remove squary brackets to use the examples bellow)</label>
        <label htmlFor="color" className="title">- Color names: [red], [pink]</label>
        <label htmlFor="color" className="title">- RGB value [100,255,0], [0,120,80]</label>
        <label htmlFor="color" className="title">- HEX format [#28619E], [#D53533]</label>
        <input
          id={`color-${sectionId}`}
          type="text"
          name="color"
          value={selectors["color"]}
          onChange={({ target }) =>
            handleContentChange({
              newContent: {
                selectors: { ...selectors, color: target.value },
              },
            })
          }
          onBlur={() => updateCode({ code })}
        />
      </div>
    </div>
  );
}
