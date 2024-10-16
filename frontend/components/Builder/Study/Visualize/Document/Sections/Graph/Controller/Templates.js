export default function TemplateSelector({
  handleContentChange,
  runCode,
  sectionId,
}) {
  const sectionCodeStart = ``;

  // const linePlotCode = `fig = px.line(df, x=X, y=Y, color=Group)`;
  const scatterPlotCode = `
#############################################################################################
######################### Don't change anything below #######################################
#############################################################################################

# Currently takes the name of the parameter given in GUI input
axis_title = {
  X: X if xLabel == "" else xLabel, 
  Y: Y if yLabel == "" else yLabel
}

optional_params = {
  "marginal_x": "rug" if marginalPlot == 'rug' else "box" if marginalPlot=='box' else None,
  "marginal_y": "rug" if marginalPlot == 'rug' else "box" if marginalPlot=='box' else None,
}

import numpy as np
import pandas as pd
import js_workspace as data

data = data.to_py()
df = pd.DataFrame(data)

# indicate the name of the column where the participant id is defined
if 'participant' not in df.columns: #
  print("No 'participant' or 'id' column, treating X and Y inputs as wide-df cols.")
  userDefWide = True
else:
  df.rename(columns={"id":"participant"}, inplace=True)
  id_col = 'participant' # MH uses 'participant' but you uploaded data may use a different name!
  userDefWide = False

# convert string to numbers
columns = [X, Y]
df[columns] = df[columns].apply(pd.to_numeric, errors='coerce')

# Convert 'NaN' strings to actual NaN values
df.replace('NaN', np.nan, inplace=True)

# Define custom aggregation function to handle NaN values
def agg_func(x):
    non_nan_values = x.dropna()
    if non_nan_values.empty:
        return np.nan
    else:
        return non_nan_values.iloc[0]
# agg_func = lambda x: x.dropna().iloc[0]

# Group by participant ID and aggregate data
if userDefWide:
  grouped_df = df
else:
  if Group == '':
    grouped_df = df.groupby(id_col).agg({
        X: agg_func,  # Take the first non-NaN x value for each participant
        Y: agg_func   # Take the first non-NaN y value for each participant
    }).reset_index()
  else:
    grouped_df = df.groupby(id_col).agg({
        X: agg_func,  # Take the first non-NaN x value for each participant
        Y: agg_func,  # Take the first non-NaN y value for each participant
        Group: agg_func,  # Take the first non-NaN y value for each participant
    }).reset_index()

if Group=='':
  if trendline:
    
    print("dl statsmodels")
    await micropip.install("statsmodels")
    print("finish dl statsmodels")
    print('NOgroup-addtrendline')
    fig = px.scatter(grouped_df, x=X, y=Y, 
                      trendline="ols", 
                      title = graphTitle if graphTitle != '' else f"{X} vs {Y}",
                      labels=axis_title, 
                      template="seaborn",
                      **{k: v for k, v in optional_params.items() if v})
    fig.update_layout(showlegend=False)


  else:
    print('NOgroup-NOTaddtrendline')
    fig = px.scatter(grouped_df, x=X, y=Y,
                      title=graphTitle if graphTitle != '' else f"{X} vs {Y}",
                      labels=axis_title, 
                      template="seaborn",
                      **{k: v for k, v in optional_params.items() if v})
    fig.update_layout(showlegend=False)
else:
  if trendline:
    print('group-addtrendline')

    print("dl statsmodels")
    await micropip.install("statsmodels")
    print("finish dl statsmodels")
    
    fig = px.scatter(grouped_df, x=X, y=Y, 
                      trendline="ols", 
                      title=graphTitle if graphTitle != '' else f"{X} vs {Y}",
                      color=Group,
                      labels=axis_title, 
                      template="seaborn",
                      **{k: v for k, v in optional_params.items() if v})
    fig.update_layout(showlegend=True)
  else:
    print('group-NOTaddtrendline')
    fig = px.scatter(grouped_df, x=X, y=Y, 
                      color=Group, 
                      title=graphTitle if graphTitle != '' else f"{X} vs {Y}",
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
  const histogramCode = `
#~ OPTIONS ~#
bargap = 0.1
#nbins = ""

#############################################################################################
######################### Don't change anything below #######################################
#############################################################################################

optional_params = {
  "marginal": "rug" if marginalPlot == 'rug' else "box" if marginalPlot=='box' else None,
}

import numpy as np
import pandas as pd
import js_workspace as data

data = data.to_py()
df = pd.DataFrame(data)

df[columns] = df[columns].apply(pd.to_numeric, errors='coerce')

df_plot = pd.DataFrame(dict(
    series=np.concatenate([[i for j in range(len(df[i]))] for i in columns]), 
    data=np.concatenate([df[i] for i in columns])
))

fig = px.histogram(df_plot, 
                   x="data", 
#                   nbins=nbins, 
                   color="series", 
                   barmode="overlay",
                   **{k: v for k, v in optional_params.items() if v}
                  )

fig.update_layout(title=graphTitle if graphTitle != '' else f"Histogram of {columns}",
                  bargap=bargap,
                  xaxis_title_text=xLabel if xLabel != '' else f"{columns}",
                  yaxis_title_text=yLabel if yLabel != '' else "Count"
                  )

fig.update_layout(legend_title_text= None if legend_title_text == '' else legend_title_text)

fig.update_xaxes(range=[None if xRangeMin == '' else xRangeMin, 
                        None if xRangeMax == '' else xRangeMax])  

fig.update_yaxes(range=[None if yRangeMin == '' else yRangeMin, 
                        None if yRangeMax == '' else yRangeMax])
`;
  const barGraphCode = `
# You can define you labels bellow (add as many element in the python-formated
# list as there is element in your X-axis)

# labels = ['Label1', 'Label2', 'Label3']

#############################################################################################
######################### Don't change anything below #######################################
#############################################################################################

await micropip.install("matplotlib.colors")
from matplotlib import colors as mcolors

import numpy as np
import pandas as pd

import js_workspace as data
data = data.to_py()
df = pd.DataFrame(data)

base_color = 'pink' if color == '' else color
if isWide:
  title= graphTitle if graphTitle != "" else f"Barplot of {columns}"
else:
  title= graphTitle if graphTitle != "" else "Barplot"

yaxis_range = [
  None if yRangeMin == ''else yRangeMin,
  None if yRangeMax == ''else yRangeMax
]

if isWide:
  df[columns] = df[columns].apply(pd.to_numeric, errors='coerce')
else:
  df[quantCol] = df[quantCol].apply(pd.to_numeric, errors='coerce')

# Calculate mean, standard deviation, and confidence intervals for each group
statistics = {}

errBar = errBar

# Function to calculate error bars based on specified method
def calculate_error_bar(std, n, method):
    if method == "":
        return None
    elif method == "stdErr":
        return 1.0 * np.sqrt(std**2 / n)  # Standard error
    elif method == "95pi":
        return 1.96 * np.sqrt(std**2 / n)  # 95% confidence interval
    elif method == "99pi":
        return 2.576 * np.sqrt(std**2 / n)  # 99% confidence interval
    else:
        raise ValueError("Invalid error bar method")

if isWide:
    for column in columns:
        mean = np.mean(df[column])
        std = np.std(df[column])
        n = df[column].shape[0]
        conf_interval = calculate_error_bar(std, n, errBar)
        statistics[column] = {'mean': mean, 'std': std, 'conf_interval': conf_interval}
else:
    unique_labels = df[qualCol].unique()
    unique_labels = unique_labels[~pd.isnull(unique_labels) & (unique_labels != "")]
    for label in unique_labels:
        group_data = df[df[qualCol] == label][quantCol]
        mean = np.mean(group_data)
        std = np.std(group_data)
        n = group_data.shape[0]
        conf_interval = calculate_error_bar(std, n, errBar)
        statistics[label] = {'mean': mean, 'std': std, 'conf_interval': conf_interval}

# Extract the required statistics for plotting
if isWide:
    average_percentages = [statistics[column]['mean'] for column in columns]
    error_bars = [statistics[column]['conf_interval'] for column in columns]
    categories = x_labels if x_labels is not None else columns
else:
    average_percentages = [statistics[label]['mean'] for label in unique_labels]
    error_bars = [statistics[label]['conf_interval'] for label in unique_labels]
    categories = unique_labels

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

  const sectionCodeEnd = `  
fig_html = fig.to_html()
js.render_html(html_output, fig_html)`;

  const templates = {
    // linePlot: sectionCodeStart + "\n" + linePlotCode + "\n" + sectionCodeEnd,
    scatterPlot:
      sectionCodeStart + "\n" + scatterPlotCode + "\n" + sectionCodeEnd,
    histogram: sectionCodeStart + "\n" + histogramCode + "\n" + sectionCodeEnd,
    barGraph: sectionCodeStart + "\n" + barGraphCode + "\n" + sectionCodeEnd,
  };

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
