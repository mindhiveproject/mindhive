// const defaultSpec = {
//   width: "500",
//   height: "400",
//   title: { text: "My graph", fontSize: 20 },
//   mark: "point",
//   transform: [],
//   encoding: {
//     x: {
//       field: "",
//       type: "quantitative",
//     },
//     y: {
//       field: "",
//       type: "quantitative",
//     },
//     color: { field: "", type: "nominal" },
//   },
//   data: { name: "values" },
// };

export default function TemplateSelector({ updateSpec }) {
  const selectGraphType = ({ type, title }) => {
    updateSpec({
      width: "500",
      height: "400",
      title: { text: title, fontSize: 20 },
      mark: "point",
      transform: [],
      encoding: {
        x: {
          field: "reaction_time_match",
          type: "quantitative",
        },
        y: {
          field: "reaction_time_mismatch",
          type: "quantitative",
        },
        color: { field: "testVersion", type: "nominal" },
      },
      data: { name: "values" },
    });
  };

  return (
    <div className="templates">
      <div
        className="template"
        onClick={() =>
          selectGraphType({ type: "linePlot", title: "Line Plot" })
        }
      >
        <div>
          <img src={`/assets/icons/visualize/linePlot.svg`} />
        </div>
        <div className="text">
          <div className="title">Line Plot</div>
          <div className="description">Observe a variable across time</div>
        </div>
      </div>
      <div
        className="template"
        onClick={() =>
          selectGraphType({ type: "scatterPlot", title: "Scatter Plot" })
        }
      >
        <div>
          <img src={`/assets/icons/visualize/scatterPlot.svg`} />
        </div>
        <div className="text">
          <div className="title">Scatter Plot</div>
          <div className="description">Shows variables relationship</div>
        </div>
      </div>
      <div
        className="template"
        onClick={() =>
          selectGraphType({ type: "histogram", title: "Histogram" })
        }
      >
        <div>
          <img src={`/assets/icons/visualize/histogram.svg`} />
        </div>
        <div className="text">
          <div className="title">Histogram</div>
          <div className="description">Compare distributions</div>
        </div>
      </div>
      <div
        className="template"
        onClick={() =>
          selectGraphType({ type: "barGraph", title: "Bar Graph" })
        }
      >
        <div>
          <img src={`/assets/icons/visualize/barGraph.svg`} />
        </div>
        <div className="text">
          <div className="title">Bar graph</div>
          <div className="description">Compare quantities</div>
        </div>
      </div>
    </div>
  );
}
