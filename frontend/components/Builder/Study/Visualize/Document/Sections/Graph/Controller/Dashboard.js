export default function Dashboard({
  variables,
  code,
  pyodide,
  runCode,
  sectionId,
  selectors,
  handleChange,
}) {
  const connectDashboardCode = `# get relevant html elements
graphTitle = js.document.getElementById('graphTitle-${sectionId}').value
xLabel = js.document.getElementById('xLabel-${sectionId}').value
xRangeMin = js.document.getElementById('xRangeMin-${sectionId}').value
xRangeMax = js.document.getElementById('xRangeMax-${sectionId}').value
yLabel = js.document.getElementById('yLabel-${sectionId}').value
yRangeMin = js.document.getElementById('yRangeMin-${sectionId}').value
yRangeMax = js.document.getElementById('yRangeMax-${sectionId}').value`;

  const updateCode = async ({ code }) => {
    await pyodide.runPythonAsync(connectDashboardCode);
    runCode({ code });
  };

  return (
    <div className="graphDashboard">
      <div className="subsection">
        <div className="header">
          <img src={`/assets/icons/visualize/chat_add_on.svg`} />
          <div>Dashboard</div>
        </div>
        <label htmlFor="graphTitle">Graph Title</label>
        <input
          id={`graphTitle-${sectionId}`}
          type="text"
          name="graphTitle"
          value={selectors.graphTitle}
          onChange={({ target }) =>
            handleChange({
              name: "selectors",
              content: { ...selectors, graphTitle: target.value },
            })
          }
          onBlur={() => updateCode({ code })}
        />
      </div>

      <div className="subheader">Horizontal axis</div>

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
            handleChange({
              name: "selectors",
              content: { ...selectors, xLabel: target.value },
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
              handleChange({
                name: "selectors",
                content: { ...selectors, xRangeMin: target.value },
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
              handleChange({
                name: "selectors",
                content: { ...selectors, xRangeMax: target.value },
              })
            }
            onBlur={() => updateCode({ code })}
          />
        </div>
      </div>

      <div className="subheader">Vertical axis</div>

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
            handleChange({
              name: "selectors",
              content: { ...selectors, yLabel: target.value },
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
              handleChange({
                name: "selectors",
                content: { ...selectors, yRangeMin: target.value },
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
              handleChange({
                name: "selectors",
                content: { ...selectors, yRangeMax: target.value },
              })
            }
            onBlur={() => updateCode({ code })}
          />
        </div>
      </div>
    </div>
  );
}
