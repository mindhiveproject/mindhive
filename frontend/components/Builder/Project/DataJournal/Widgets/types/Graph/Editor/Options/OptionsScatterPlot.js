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

  const onChange = ({ name, value }) => {
    handleContentChange({
      componentId: sectionId,
      newContent: {
        selectors: { ...selectors, [name]: value },
      },
    });
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
            onChange({ name: "graphTitle", value: target?.value })
          }
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
            onChange({ name: "xLabel", value: target?.value })
          }
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
              onChange({ name: "xRangeMin", value: target?.value })
            }
          />
          <input
            id={`xRangeMax-${sectionId}`}
            type="number"
            name="xRangeMax"
            value={selectors["xRangeMax"]}
            onChange={({ target }) =>
              onChange({ name: "xRangeMax", value: target?.value })
            }
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
            onChange({ name: "yLabel", value: target?.value })
          }
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
              onChange({ name: "yRangeMin", value: target?.value })
            }
          />
          <input
            id={`yRangeMax-${sectionId}`}
            type="number"
            name="yRangeMax"
            value={selectors["yRangeMax"]}
            onChange={({ target }) =>
              onChange({ name: "yRangeMax", value: target?.value })
            }
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
            onChange({ name: "marginalPlot", value: target?.value })
          }
        >
          {marginalPlotsOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.text}
            </option>
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
          onChange({ name: "legend_title_text", value: target?.value })
        }
      />
    </div>
  );
}
