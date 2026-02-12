// components/DataJournal/Workspace/Grid/ComponentPanel/Main.js
import { StyledComponentPanel } from "../../../styles/StyledDataJournal"; // Adjust path

import { templates } from "../../../Widgets/types/Graph/Editor/TemplateSelector"; // Adjust path to Templates

export default function ComponentPanel({ handleAddComponent }) {
  return (
    <StyledComponentPanel>
      <div className="title">Component Panel</div>
      <div>
        <div className="subtitle">Graphs & Visuals</div>

        <div className="cards">
          <div
            className="card"
            onClick={async () =>
              await handleAddComponent({
                title: "Bar Graph",
                type: "GRAPH",
                content: { type: "barGraph", code: templates?.barGraph },
              })
            }
          >
            <div>
              <img
                src="/assets/dataviz/componentPanel/barChart.png"
                alt="Bar Chart"
              />
            </div>
            <div>Bar Chart</div>
          </div>

          <div
            className="card"
            onClick={async () =>
              await handleAddComponent({
                title: "Scatter Plot",
                type: "GRAPH",
                content: {
                  type: "scatterPlot",
                  code: templates?.scatterPlot,
                },
              })
            }
          >
            <div>
              <img
                src="/assets/dataviz/componentPanel/scatterPlot.png"
                alt="Scatter Plot"
              />
            </div>
            <div>Scatter Plot</div>
          </div>

          <div
            className="card"
            onClick={async () =>
              await handleAddComponent({
                title: "Histogram",
                type: "GRAPH",
                content: { type: "histogram", code: templates?.histogram },
              })
            }
          >
            <div>
              <img
                src="/assets/dataviz/componentPanel/histogram.png"
                alt="Histogram"
              />
            </div>
            <div>Histogram</div>
          </div>

          <div className="card">
            <div>
              <img
                src="/assets/dataviz/componentPanel/code.png"
                alt="Code from Scratch"
              />
            </div>
            <div>Code from Scratch</div>
          </div>

          <div
            className="card"
            onClick={async () =>
              await handleAddComponent({
                title: "Text Block",
                type: "PARAGRAPH",
                content: { text: "" },
              })
            }
          >
            <div>
              <img
                src="/assets/dataviz/componentPanel/textBlock.png"
                alt="Text Block"
              />
            </div>
            <div>Text Block</div>
          </div>
        </div>

        <div className="subtitle">Statistics</div>

        <div className="cards">
          <div
            className="card"
            onClick={async () =>
              await handleAddComponent({
                title: "T-Test",
                type: "GRAPH",
                content: { type: "tTest", code: templates?.tTest },
              })
            }
          >
            <div>
              <img
                src="/assets/dataviz/componentPanel/tTest.png"
                alt="T-Test"
              />
            </div>
            <div>T-Test</div>
          </div>

          <div
            className="card"
            onClick={async () =>
              await handleAddComponent({
                title: "One Way Anova",
                type: "GRAPH",
                content: {
                  type: "oneWayAnova",
                  code: templates?.oneWayAnova,
                },
              })
            }
          >
            <div>
              <img
                src="/assets/dataviz/componentPanel/oneWayAnova.png"
                alt="One Way Anova"
              />
            </div>
            <div>One Way Anova</div>
          </div>
        </div>

        <div className="subtitle">Study Assets</div>

        <div className="cards">
          <div
            className="card"
            onClick={async () =>
              await handleAddComponent({
                title: "Table",
                type: "TABLE",
                content: {
                  /* Add default table config if needed */
                },
              })
            }
          >
            <div>
              <img src="/assets/dataviz/componentPanel/table.png" alt="Table" />
            </div>
            <div>Table</div>
          </div>

          <div
            className="card"
            onClick={async () =>
              await handleAddComponent({
                title: "Summary",
                type: "SUMMARY",
                content: {
                  /* Add default summary config if needed */
                },
              })
            }
          >
            <div>
              <img
                src="/assets/dataviz/componentPanel/summary.png"
                alt="Summary"
              />
            </div>
            <div>Summary</div>
          </div>

          <div
            className="card"
            onClick={async () =>
              await handleAddComponent({
                title: "Media",
                type: "MEDIA",
                content: {
                  /* Add default media config if needed */
                },
              })
            }
          >
            <div>
              <img src="/assets/dataviz/componentPanel/media.png" alt="Media" />
            </div>
            <div>Media</div>
          </div>
        </div>
      </div>
    </StyledComponentPanel>
  );
}
