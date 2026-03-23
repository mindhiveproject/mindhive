// components/DataJournal/Workspace/Grid/ComponentPanel/Main.js
import { StyledComponentPanel } from "../../../styles/StyledDataJournal"; // Adjust path

import { templates } from "../../../Widgets/types/Graph/Editor/TemplateSelector"; // Adjust path to Templates
import { testTemplates } from "../../../Widgets/types/StatisticalTests/Editor/TempateSelector";
import { summaryTemplates } from "../../../Widgets/types/Statistics/Editor/TempateSelector";
import { codeTemplates } from "../../../Widgets/types/Code/Editor/TempateSelector";
import { hypvisTemplates } from "../../../Widgets/types/HypVis/Editor/TemplateSelector";

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

          <div
            className="card"
            onClick={async () =>
              await handleAddComponent({
                title: "Code from scratch",
                type: "CODE",
                content: { type: "code", code: codeTemplates?.plainCode },
              })
            }
          >
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

        <div className="subtitle">Hypothesis Visualizer</div>

        <div className="cards">
          <div
            className="card"
            onClick={async () =>
              await handleAddComponent({
                title: "Experimental Hypothesis",
                type: "HYPVIS",
                content: {
                  type: "abDesign",
                  code: hypvisTemplates?.abDesign,
                },
              })
            }
          >
            <div>
              <img
                src="/assets/dataviz/componentPanel/abDesign.png"
                alt="Experimental Hypothesis"
              />
            </div>
            <div>Experimental Hypothesis</div>
          </div>

          <div
            className="card"
            onClick={async () =>
              await handleAddComponent({
                title: "Correlational Hypothesis",
                type: "HYPVIS",
                content: { type: "corStudy", code: hypvisTemplates?.corStudy },
              })
            }
          >
            <div>
              <img
                src="/assets/dataviz/componentPanel/correlationStudy.png"
                alt="Correlational Hypothesis"
              />
            </div>
            <div>Correlational Hypothesis</div>
          </div>
        </div>

        <div className="subtitle">Statistical Tests</div>

        <div className="cards">
          <div
            className="card"
            onClick={async () =>
              await handleAddComponent({
                title: "Pearson Correlation",
                type: "STATTEST",
                content: {
                  type: "pearsonCorr",
                  code: testTemplates?.pearsonCorr,
                },
              })
            }
          >
            <div>
              <img
                src="/assets/dataviz/componentPanel/scatterPlot.png"
                alt="Pearson Correlation"
              />
            </div>
            <div>Pearson Correlation</div>
          </div>

          <div
            className="card"
            onClick={async () =>
              await handleAddComponent({
                title: "T-Test",
                type: "STATTEST",
                content: { type: "tTest", code: testTemplates?.tTest },
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
                type: "STATTEST",
                content: {
                  type: "oneWayAnova",
                  code: testTemplates?.oneWayAnova,
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
                type: "STATISTICS",
                content: {
                  type: "summary",
                  code: summaryTemplates?.summary,
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

          {false && (
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
                <img
                  src="/assets/dataviz/componentPanel/media.png"
                  alt="Media"
                />
              </div>
              <div>Media</div>
            </div>
          )}
        </div>
      </div>
    </StyledComponentPanel>
  );
}
