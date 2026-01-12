const scatterPlotCode = `
import plotly.express as px
import plotly.graph_objects as go
import pandas as pd
import numpy as np

if not X or not Y:
    fig = go.Figure()
    fig.add_annotation(text="Please select X and Y variables", 
                       xref="paper", yref="paper", x=0.5, y=0.5, 
                       showarrow=False, font_size=18)
else:
    if X not in df.columns or Y not in df.columns:
        fig = go.Figure()
        fig.add_annotation(text=f"Column '{X}' or '{Y}' not found", 
                           xref="paper", yref="paper", x=0.5, y=0.5, 
                           showarrow=False, font_size=16)
    else:
        df_plot = df[[X, Y]].copy()
        df_plot[X] = pd.to_numeric(df_plot[X], errors='coerce')
        df_plot[Y] = pd.to_numeric(df_plot[Y], errors='coerce')

        fig = px.scatter(df_plot, x=X, y=Y,
                         color=Group if Group and Group in df.columns else None,
                         color_discrete_sequence=[color] if color else None,
                         trendline=trendline if trendline and trendline != "none" else None,
                         title=graphTitle or f"{Y} vs {X}")

        fig.update_layout(template="seaborn")

fig_json_output = fig.to_json()
`;

// const scatterPlotCode = `
// print("The value of X is: ", X)
// print("The value of Y is: ", Y)
// if X is None or Y is None or X == '' or Y == '':
//   fig = go.Figure()
// else:
//   if X not in df.columns or Y not in df.columns:
//     fig = go.Figure()
//   else:
//     # convert string to numbers
//     columns = [X, Y]
//     df[columns] = df[columns].apply(pd.to_numeric, errors='coerce')

//     # Convert 'NaN' strings to actual NaN values
//     df.replace('NaN', np.nan, inplace=True)

//     fig = px.scatter(df, x=X, y=Y,
//                       title=graphTitle if graphTitle != '' else f"{X} vs {Y}",
//                       labels={X: X, Y: Y},
//                       template="seaborn")

// fig_json = fig.to_json()
// `;

const histogramCode = `
#~ OPTIONS ~#
bargap = 0.1
#nbins = ""

#############################################################################################
######################### Don't change anything below #######################################
#############################################################################################

if not X:
  fig = go.Figure()
else:
  # Currently takes the name of the parameter given in GUI input
  axis_title = {
    X: X if xLabel == "" else xLabel, 
    "count": yLabel if yLabel == "" else yLabel
  }

  optional_params = {
    "marginal": "rug" if marginalPlot == 'rug' else "box" if marginalPlot=='box' else None,
    "color": Group,
    "barmode": "overlay",
    "bargap": bargap,
    "hover_data": ["count"],
    "opacity": 0.7,
  }

  import numpy as np
  import pandas as pd
  import js_workspace as data

  data = data.to_py()
  df = pd.DataFrame(data)

  # convert string to numbers
  df[X] = df[X].apply(pd.to_numeric, errors='coerce')

  # Convert 'NaN' strings to actual NaN values
  df.replace('NaN', np.nan, inplace=True)

  # Group by participant ID and aggregate data
  if Group == '':
    fig = px.histogram(df, x=X,
                        title=graphTitle if graphTitle != '' else f"{X}",
                        labels=axis_title, 
                        template="seaborn",
                        **{k: v for k, v in optional_params.items() if v})
    fig.update_layout(showlegend=False)
  else:
    fig = px.histogram(df, x=X,
                        title=graphTitle if graphTitle != '' else f"{X}",
                        labels=axis_title, 
                        template="seaborn",
                        **{k: v for k, v in optional_params.items() if v})
    fig.update_layout(showlegend=True)

  fig.update_layout(legend_title_text= None if legend_title_text == '' else legend_title_text)
    
  fig.update_xaxes(range=[None if xRangeMin == '' else xRangeMin, 
                          None if xRangeMax == '' else xRangeMax])  

  fig.update_yaxes(range=[None if yRangeMin == '' else yRangeMin, 
                          None if yRangeMax == '' else yRangeMax])
`;

const barGraphCode = `
#############################################################################################
######################### Don't change anything below #######################################
#############################################################################################

if not (quantCol if not isWide else columns):
  fig = go.Figure()
else:
  import numpy as np
  import pandas as pd
  import js_workspace as data
  import matplotlib.colors as mcolors

  data = data.to_py()
  df = pd.DataFrame(data)

  # convert string to numbers
  if not isWide:
      df[quantCol] = df[quantCol].apply(pd.to_numeric, errors='coerce')
  else:
      for col in columns:
        df[col] = df[col].apply(pd.to_numeric, errors='coerce')

  # Convert 'NaN' strings to actual NaN values
  df.replace('NaN', np.nan, inplace=True)

  def calculate_statistics(df, column):
      mean = df[column].mean()
      std = df[column].std()
      n = len(df[column].dropna())
      sem = std / np.sqrt(n)
      conf_interval = 1.96 * sem  # 95% confidence interval
      return {'mean': mean, 'conf_interval': conf_interval}

  if not isWide:
      unique_labels = df[qualCol].unique()
      statistics = {}
      for label in unique_labels:
          subset = df[df[qualCol] == label]
          statistics[label] = calculate_statistics(subset, quantCol)
      average_percentages = [statistics[label]['mean'] for label in unique_labels]
      error_bars = [statistics[label]['conf_interval'] for label in unique_labels]
      categories = unique_labels
  else:
      statistics = {column: calculate_statistics(df, column) for column in columns}
      average_percentages = [statistics[column]['mean'] for column in columns]
      error_bars = [statistics[column]['conf_interval'] for column in columns}
      categories = x_labels if x_labels is not None else columns

  def parse_color(color):
      if color.startswith("#"):
          # HEX color string
          return mcolors.to_rgb(color)
      elif "," in color:
          # RGB color string
          rgb_values = tuple(map(int, color.split(",")))
          return tuple([val / 255.0 for val in rgb_values])
      else:
          # Assume color name string
          return mcolors.to_rgb(color)

  def generate_complementary_colors(base_color, n):
      base_rgb = parse_color(base_color)
      complementary_rgb = mcolors.rgb_to_hsv(base_rgb)
      complementary_rgb[0] = (complementary_rgb[0] + 0.5) % 1  # Shift hue by 180 degrees (complementary color)
      
      # Generate n harmonious colors
      harmonious_colors = []
      for _ in range(n):
          complementary_rgb[0] = (complementary_rgb[0] + 0.2) % 1  # Shift hue by 72 degrees (for example)
          harmonious_colors.append(mcolors.to_hex(mcolors.hsv_to_rgb(complementary_rgb)))
      
      return harmonious_colors
    
  n = len(categories)
  colors = generate_complementary_colors(base_color, n)

  df_bar = pd.DataFrame({
      'Categories': categories,
      'Y': average_percentages,
      'Error Bars': error_bars
  })

  # If errBar is empty, do not include error bars
  error_y_param = None if errBar == "" else 'Error Bars'

  fig = px.bar(df_bar, 
                x='Categories', 
                y='Y', 
                color='Categories',
                error_y=error_y_param,  # Include error bars based on the condition
                color_discrete_sequence=colors,
                labels={'Categories': xLabel if xLabel != "" else "Categories",
                        'Y': yLabel if yLabel != "" else 'Average value'
                        })

  fig.update_layout(
      title=title,
      legend_title=legend_title,
      yaxis_range=yaxis_range
  )
`;

const sectionCodeStart = ``;

const sectionCodeEnd = ``;

export const templates = {
  scatterPlot:
    sectionCodeStart + "\n" + scatterPlotCode + "\n" + sectionCodeEnd,
  histogram: sectionCodeStart + "\n" + histogramCode + "\n" + sectionCodeEnd,
  barGraph: sectionCodeStart + "\n" + barGraphCode + "\n" + sectionCodeEnd,
};

export default function TemplateSelector({
  handleContentChange,
  runCode,
  sectionId,
}) {
  const selectGraphType = ({ type, title }) => {
    const code = templates[type];
    handleContentChange({
      newContent: {
        type,
        code,
      },
    });
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
          <img src="/assets/icons/visualize/scatterPlot.svg" />
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
          <img src="/assets/icons/visualize/histogram.svg" />
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
          <img src="/assets/icons/visualize/barGraph.svg" />
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
          <img src="/assets/icons/visualize/linePlot.svg" />
        </div>
        <div className="text">
          <div className="title">Line Plot</div>
          <div className="description">Observe a variable across time</div>
        </div>
      </div> */}
    </div>
  );
}
