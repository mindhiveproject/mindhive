export default function OptionsHistogram({ sectionId, selectors, onChange }) {
  return (
    <div className="graphDashboard">
      <div className="subsection">
        <div className="header">
          <img src={`/assets/icons/visualize/chat_add_on.svg`} alt="Options" />
          <div>Options</div>
        </div>

        <label htmlFor={`graphTitle-${sectionId}`}>Graph Title</label>
        <input
          id={`graphTitle-${sectionId}`}
          type="text"
          name="graphTitle"
          value={selectors.graphTitle || ""}
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
        <label htmlFor={`xLabel-${sectionId}`}>Label</label>
        <input
          id={`xLabel-${sectionId}`}
          type="text"
          name="xLabel"
          value={selectors.xLabel || ""}
          onChange={({ target }) =>
            onChange({
              componentId: sectionId,
              newContent: {
                selectors: { ...selectors, xLabel: target.value },
              },
            })
          }
        />

        <label htmlFor={`xRange-${sectionId}`}>Range</label>
        <div className="ranges">
          <input
            id={`xRangeMin-${sectionId}`}
            type="number"
            name="xRangeMin"
            value={selectors.xRangeMin || ""}
            onChange={({ target }) =>
              onChange({
                componentId: sectionId,
                newContent: {
                  selectors: { ...selectors, xRangeMin: target.value },
                },
              })
            }
            placeholder="Min"
          />
          <input
            id={`xRangeMax-${sectionId}`}
            type="number"
            name="xRangeMax"
            value={selectors.xRangeMax || ""}
            onChange={({ target }) =>
              onChange({
                componentId: sectionId,
                newContent: {
                  selectors: { ...selectors, xRangeMax: target.value },
                },
              })
            }
            placeholder="Max"
          />
        </div>
      </div>

      <div className="subheader">Y-Axis</div>
      <div className="subsection">
        <label htmlFor={`yLabel-${sectionId}`}>Label</label>
        <input
          id={`yLabel-${sectionId}`}
          type="text"
          name="yLabel"
          value={selectors.yLabel || ""}
          onChange={({ target }) =>
            onChange({
              componentId: sectionId,
              newContent: {
                selectors: { ...selectors, yLabel: target.value },
              },
            })
          }
        />

        <label htmlFor={`yRange-${sectionId}`}>Range</label>
        <div className="ranges">
          <input
            id={`yRangeMin-${sectionId}`}
            type="number"
            name="yRangeMin"
            value={selectors.yRangeMin || ""}
            onChange={({ target }) =>
              onChange({
                componentId: sectionId,
                newContent: {
                  selectors: { ...selectors, yRangeMin: target.value },
                },
              })
            }
            placeholder="Min"
          />
          <input
            id={`yRangeMax-${sectionId}`}
            type="number"
            name="yRangeMax"
            value={selectors.yRangeMax || ""}
            onChange={({ target }) =>
              onChange({
                componentId: sectionId,
                newContent: {
                  selectors: { ...selectors, yRangeMax: target.value },
                },
              })
            }
            placeholder="Max"
          />
        </div>
      </div>

      <div className="subheader">Legend</div>
      <div className="subsection">
        <label htmlFor={`legend_title_text-${sectionId}`}>
          Legend title (leave empty if not needed)
        </label>
        <input
          id={`legend_title_text-${sectionId}`}
          type="text"
          name="legend_title_text"
          value={selectors.legend_title_text || ""}
          onChange={({ target }) =>
            onChange({
              componentId: sectionId,
              newContent: {
                selectors: { ...selectors, legend_title_text: target.value },
              },
            })
          }
        />
      </div>
    </div>
  );
}
