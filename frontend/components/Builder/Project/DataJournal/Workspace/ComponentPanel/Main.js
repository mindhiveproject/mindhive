import { StyledComponentPanel } from "../../styles/StyledDataJournal";

import { templates } from "../../ComponentEditor/Graph/Controller/Templates";

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
              <img src="/assets/dataviz/componentPanel/barChart.png" />
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
              <img src="/assets/dataviz/componentPanel/scatterPlot.png" />
            </div>
            <div>Scatter plot</div>
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
              <img src="/assets/dataviz/componentPanel/histogram.png" />
            </div>
            <div>Histogram</div>
          </div>

          <div className="card">
            <div>
              <img src="/assets/dataviz/componentPanel/code.png" />
            </div>
            <div>Code from scratch</div>
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
              <img src="/assets/dataviz/componentPanel/textBlock.png" />
            </div>
            <div>Text Block</div>
          </div>
        </div>

        <div className="subtitle">Hypothesis Visualizer </div>

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
              <img src="/assets/dataviz/componentPanel/abDesign.png" />
            </div>
            <div>AB design</div>
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
              <img src="/assets/dataviz/componentPanel/correlationStudy.png" />
            </div>
            <div>Correlation study</div>
          </div>
        </div>

        <div className="subtitle">Statistical Tests</div>

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
              <img src="/assets/dataviz/componentPanel/scatterPlot.png" />
            </div>
            <div>Pearson Correlation</div>
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
              <img src="/assets/dataviz/componentPanel/tTest.png" />
            </div>
            <div>T-Test</div>
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
              <img src="/assets/dataviz/componentPanel/oneWayAnova.png" />
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
                title: "Bar Graph",
                type: "GRAPH",
                content: { type: "barGraph", code: templates?.barGraph },
              })
            }
          >
            <div>
              <img src="/assets/dataviz/componentPanel/table.png" />
            </div>
            <div>Table</div>
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
              <img src="/assets/dataviz/componentPanel/summary.png" />
            </div>
            <div>Summary</div>
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
              <img src="/assets/dataviz/componentPanel/media.png" />
            </div>
            <div>Media</div>
          </div>
        </div>
      </div>
    </StyledComponentPanel>
  );
}
