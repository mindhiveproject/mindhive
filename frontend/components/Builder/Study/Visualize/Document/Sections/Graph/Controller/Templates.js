export default function TemplateSelector({ handleChange, runCode, sectionId }) {
  const sectionCodeStart = `import js_workspace as data
data = data.to_py()
df = pd.DataFrame(data)

# convert string to numbers
df[X] = pd.to_numeric(df[X])
df[Y] = pd.to_numeric(df[Y])`;

  const sectionCodeEnd = `fig_html = fig.to_html()
js.render_plot(plot_output, fig_html)`;

  const linePlotCode = `fig = px.line(df, x=X, y=Y, color=Group)`;
  const scatterPlotCode = `fig = px.scatter(df, x=X, y=Y, color=Group)`;
  const histogramCode = `fig = px.histogram(df, x=X)`;
  const barGraphCode = `fig = px.bar(df, x=X, y=Y, color=Group)`;

  const templates = {
    // linePlot: sectionCodeStart + "\n" + linePlotCode + "\n" + sectionCodeEnd,
    scatterPlot:
      sectionCodeStart + "\n" + scatterPlotCode + "\n" + sectionCodeEnd,
    histogram: sectionCodeStart + "\n" + histogramCode + "\n" + sectionCodeEnd,
    barGraph: sectionCodeStart + "\n" + barGraphCode + "\n" + sectionCodeEnd,
  };

  const selectGraphType = ({ type, title }) => {
    const code = templates[type];
    handleChange({ name: "code", content: code });
    runCode({ code });
  };

  return (
    <div className="templates">
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
      {/* <div
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
      </div> */}
    </div>
  );
}

// const defaultCode = `import matplotlib
// import matplotlib.pyplot as plt
// import pandas as pd
// import micropip

// # install plotly from pypi
// await micropip.install('plotly==5.0.0')

// import js_workspace as data
// data = data.to_py()

// df = pd.DataFrame(data)

// # clean the canvas
// plt.clf()

// X = document.getElementById("X-variable").value
// Y = document.getElementById("Y-variable").value
// Group = document.getElementById("Group-variable").value

// # create a scatter plot
// plt.scatter(df[X], df[Y])

// # customize the graph
// plt.title('Sample Line Graph')
// plt.xlabel('X-axis Label')
// plt.ylabel('Y-axis Label')
// plt.legend()
// plt.grid(True)

// plt.show()`;
