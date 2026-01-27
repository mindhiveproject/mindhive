export default function Options({ sectionId, selectors, onChange }) {
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
            onChange({
              componentId: sectionId,
              newContent: {
                selectors: { ...selectors, graphTitle: target.value },
              },
            })
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
            onChange({
              componentId: sectionId,
              newContent: {
                selectors: { ...selectors, xLabel: target.value },
              },
            })
          }
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
            onChange({
              componentId: sectionId,
              newContent: {
                selectors: { ...selectors, yLabel: target.value },
              },
            })
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
              onChange({
                componentId: sectionId,
                newContent: {
                  selectors: { ...selectors, yRangeMin: target.value },
                },
              })
            }
          />
          <input
            id={`yRangeMax-${sectionId}`}
            type="number"
            name="yRangeMax"
            value={selectors["yRangeMax"]}
            onChange={({ target }) =>
              onChange({
                componentId: sectionId,
                newContent: {
                  selectors: { ...selectors, yRangeMax: target.value },
                },
              })
            }
          />
        </div>
      </div>

      <div className="subheader">X-axis labels and Legend title</div>

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
            onChange({
              componentId: sectionId,
              newContent: {
                selectors: { ...selectors, legend_title: target.value },
              },
            })
          }
        />
      </div>

      <div className="subheader">Color</div>
      <div className="subsection">
        <label htmlFor="color" className="title">
          Give a base color for the bar (remove squary brackets to use the
          examples bellow)
        </label>
        <label htmlFor="color" className="title">
          - Color names: [red], [pink]
        </label>
        <label htmlFor="color" className="title">
          - RGB value [100,255,0], [0,120,80]
        </label>
        <label htmlFor="color" className="title">
          - HEX format [#28619E], [#D53533]
        </label>
        <input
          id={`color-${sectionId}`}
          type="text"
          name="color"
          value={selectors["color"]}
          onChange={({ target }) =>
            onChange({
              componentId: sectionId,
              newContent: {
                selectors: { ...selectors, color: target.value },
              },
            })
          }
        />
      </div>
    </div>
  );
}
