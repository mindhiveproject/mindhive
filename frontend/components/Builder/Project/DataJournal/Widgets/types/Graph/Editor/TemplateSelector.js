const scatterPlotCode = `
import plotly.express as px
import plotly.graph_objects as go
import pandas as pd
import numpy as np

# Load df from js_workspace if available (OLD behavior), otherwise assume global df
try:
    import js_workspace as jsdata
    data = jsdata.to_py()
    df = pd.DataFrame(data)
except (ModuleNotFoundError, AttributeError, NameError):
    pass  # df already defined in environment (NEW behavior)


def get_or_default(var_value, default=""):
    return var_value if var_value else default


if not X or not Y:
    fig = go.Figure()
    fig.add_annotation(
        text="Please select X and Y variables",
        xref="paper", yref="paper", x=0.5, y=0.5,
        showarrow=False, font_size=18
    )
elif X not in df.columns or Y not in df.columns:
    fig = go.Figure()
    fig.add_annotation(
        text=f"Column '{X}' or '{Y}' not found",
        xref="paper", yref="paper", x=0.5, y=0.5,
        showarrow=False, font_size=16
    )
else:
    print(f"DEBUG: Using X='{X}', Y='{Y}', Group='{Group}', trendline={trendline}")
    
    # OLD logic: participant grouping/aggregation
    if 'participant' not in df.columns and 'id' not in df.columns:
        userDefWide = True
    else:
        if 'id' in df.columns and 'participant' not in df.columns:
            df = df.rename(columns={'id': 'participant'})
        userDefWide = False

    cols_to_use = [X, Y]
    if Group and Group in df.columns:
        cols_to_use.append(Group)

    df_plot = df[cols_to_use].copy()
    df_plot.replace('NaN', np.nan, inplace=True)
    df_plot[X] = pd.to_numeric(df_plot[X], errors='coerce')
    df_plot[Y] = pd.to_numeric(df_plot[Y], errors='coerce')

    def agg_func(x):
        non_nan_values = x.dropna()
        return non_nan_values.iloc[0] if not non_nan_values.empty else np.nan

    if userDefWide:
        grouped_df = df_plot
        has_group = bool(Group and Group in df_plot.columns)
    else:
        if Group and Group in df_plot.columns:
            grouped_df = df_plot.groupby('participant').agg({X: agg_func, Y: agg_func, Group: agg_func}).reset_index()
            has_group = True
        else:
            grouped_df = df_plot.groupby('participant').agg({X: agg_func, Y: agg_func}).reset_index()
            has_group = False

    print(f"DEBUG: grouped_df shape: {grouped_df.shape}, NaNs in X/Y: {grouped_df[X].isna().sum()}/{len(grouped_df)}, {grouped_df[Y].isna().sum()}/{len(grouped_df)}")
    print(f"DEBUG: has_group={has_group}, use_trendline={trendline}")

    # Configuration
    marginalPlot = get_or_default(marginalPlot)
    optional_params = {
        k: v for k, v in {
            "marginal_x": "rug" if marginalPlot == 'rug' else "box" if marginalPlot == 'box' else None,
            "marginal_y": "rug" if marginalPlot == 'rug' else "box" if marginalPlot == 'box' else None
        }.items() if v
    }
    legend_title_text = get_or_default(legend_title_text)
    title = get_or_default(graphTitle, f"{X} vs {Y}")
    use_trendline = bool(trendline) and str(trendline).lower() not in ("none", "false", "")
    color_param = Group if has_group else None
    color_seq_param = [get_or_default(color)] if get_or_default(color) and not has_group else None
    showlegend = has_group

    common_kwargs = {
        "data_frame": grouped_df,
        "x": X,
        "y": Y,
        "color": color_param,
        "color_discrete_sequence": color_seq_param,
        "title": title,
        "template": "seaborn",
        **optional_params
    }

    fig_kwargs = common_kwargs.copy()
    if use_trendline:
        fig_kwargs["trendline"] = "lowess"
        print("DEBUG: Adding lowess trendline")

    fig = px.scatter(**fig_kwargs)

    # Bring trendline to front (common issue)
    if use_trendline:
        for trace in reversed(fig.data):
            if 'lowess' in trace.name.lower():
                fig.data = fig.data[-1:] + fig.data[:-1]
                break

    fig.update_layout(
        showlegend=showlegend,
        xaxis_title=get_or_default(xLabel, X),
        yaxis_title=get_or_default(yLabel, Y),
        legend_title_text=None if legend_title_text == '' else legend_title_text
    )

    xRangeMin = get_or_default(xRangeMin)
    xRangeMax = get_or_default(xRangeMax)
    yRangeMin = get_or_default(yRangeMin)
    yRangeMax = get_or_default(yRangeMax)

    fig.update_xaxes(range=[
        None if xRangeMin == '' else xRangeMin,
        None if xRangeMax == '' else xRangeMax
    ])
    fig.update_yaxes(range=[
        None if yRangeMin == '' else yRangeMin,
        None if yRangeMax == '' else yRangeMax
    ])

fig_json_output = fig.to_json()
`;

const barGraphCode = `
import plotly.express as px
import plotly.graph_objects as go
import pandas as pd
import numpy as np
import matplotlib.colors as mcolors

if 'isWide' not in locals():
    isWide = False
elif isinstance(isWide, str):
    isWide = isWide.lower() in ('true', '1', 'yes')
    
# ── Load data ────────────────────────────────────────────────────────────────
try:
    import js_workspace as jsdata
    data = jsdata.to_py()
    df = pd.DataFrame(data)
except (ModuleNotFoundError, AttributeError, NameError):
    pass  # assume df is already in global scope

# ── Helper ───────────────────────────────────────────────────────────────────
def get_or_default(var_value, default=""):
    return var_value if var_value not in (None, "", "undefined") else default

# ── Debug input values ───────────────────────────────────────────────────────
print(f"DEBUG barGraph: isWide={isWide}, dataFormat='{dataFormat}'")
print(f"DEBUG barGraph: colToPlot='{colToPlot}', qualCol='{qualCol}', quantCol='{quantCol}'")
print(f"DEBUG barGraph: errBar='{errBar}', color='{color}'")

# ── Prepare figure ───────────────────────────────────────────────────────────
fig = go.Figure()

if isWide:
    # Wide format: compare multiple columns (means across entire dataset)
    if not colToPlot:
        fig.add_annotation(
            text="No columns selected (wide format)",
            xref="paper", yref="paper", x=0.5, y=0.5,
            showarrow=False, font_size=18
        )
    else:
        columns = [c.strip() for c in str(colToPlot).split(",") if c.strip()]
        valid_columns = [col for col in columns if col in df.columns]
        
        print(f"DEBUG wide: requested={columns}, valid={valid_columns}")
        
        if not valid_columns:
            fig.add_annotation(
                text="None of the selected columns exist in the data",
                xref="paper", yref="paper", x=0.5, y=0.5,
                showarrow=False, font_size=16
            )
        else:
            # Convert columns to numeric
            for col in valid_columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')
            df.replace('NaN', np.nan, inplace=True)
            
            # Compute stats
            stats = {}
            for col in valid_columns:
                non_nan = df[col].dropna()
                if len(non_nan) == 0:
                    stats[col] = {'mean': np.nan, 'error': 0}
                    continue
                mean = non_nan.mean()
                std = non_nan.std(ddof=0)  # population std
                n = len(non_nan)
                sem = std / np.sqrt(n) if n > 1 else 0
                
                error = 0
                if errBar == "stdErr":
                    error = sem
                elif errBar in ("95pi", "95% confidence interval"):
                    error = 1.96 * sem
                elif errBar in ("99pi", "99% confidence interval"):
                    error = 2.576 * sem
                
                stats[col] = {'mean': mean, 'error': error}
            
            categories = valid_columns
            y_values = [stats[col]['mean'] for col in valid_columns]
            error_values = [stats[col]['error'] for col in valid_columns]

else:
    # Long format: group by qualitative column
    if not qualCol or not quantCol:
        fig.add_annotation(
            text="Please select both qualitative and quantitative columns",
            xref="paper", yref="paper", x=0.5, y=0.5,
            showarrow=False, font_size=18
        )
    elif qualCol not in df.columns or quantCol not in df.columns:
        fig.add_annotation(
            text=f"Column '{qualCol}' or '{quantCol}' not found",
            xref="paper", yref="paper", x=0.5, y=0.5,
            showarrow=False, font_size=16
        )
    else:
        df[quantCol] = pd.to_numeric(df[quantCol], errors='coerce')
        df.replace('NaN', np.nan, inplace=True)
        
        groups = sorted(df[qualCol].dropna().unique())
        if len(groups) == 0:
            fig.add_annotation(text="No valid groups found", x=0.5, y=0.5, showarrow=False)
        else:
            stats = {}
            for group in groups:
                subset = df[df[qualCol] == group][quantCol]
                non_nan = subset.dropna()
                if len(non_nan) == 0:
                    stats[group] = {'mean': np.nan, 'error': 0}
                    continue
                mean = non_nan.mean()
                std = non_nan.std(ddof=0)
                n = len(non_nan)
                sem = std / np.sqrt(n) if n > 1 else 0
                
                error = 0
                if errBar == "stdErr":
                    error = sem
                elif errBar in ("95pi", "95% confidence interval"):
                    error = 1.96 * sem
                elif errBar in ("99pi", "99% confidence interval"):
                    error = 2.576 * sem
                
                stats[group] = {'mean': mean, 'error': error}
            
            categories = groups
            y_values = [stats[g]['mean'] for g in groups]
            error_values = [stats[g]['error'] for g in groups]

# ── Only create bar plot if we have data ─────────────────────────────────────
if 'categories' in locals() and len(categories) > 0:
    df_bar = pd.DataFrame({
        'Category': categories,
        'Mean': y_values,
        'Error': error_values
    })
    
    show_error = any(e > 0 for e in error_values) and errBar != ""
    
    # Color generation
    base_color = get_or_default(color, "#636EFA")  # default plotly blue-ish
    try:
        base_rgb = mcolors.to_rgb(base_color)
        base_hsv = mcolors.rgb_to_hsv(base_rgb)
        colors = []
        for i in range(len(categories)):
            h = (base_hsv[0] + i * 0.618) % 1.0   # golden angle for harmony
            colors.append(mcolors.to_hex(mcolors.hsv_to_rgb((h, base_hsv[1], base_hsv[2]))))
    except:
        colors = px.colors.qualitative.Plotly[:len(categories)]  # fallback
    
    fig = px.bar(
        df_bar,
        x='Category',
        y='Mean',
        error_y='Error' if show_error else None,
        color='Category',
        color_discrete_sequence=colors,
        title=get_or_default(graphTitle, "Bar Graph"),
        labels={
            'Category': get_or_default(xLabel, "Categories"),
            'Mean': get_or_default(yLabel, "Mean Value")
        },
        template="seaborn"
    )
    
    fig.update_layout(
        showlegend=True,
        legend_title_text=get_or_default(legend_title, "Categories"),
        yaxis_range=[
            float(yRangeMin) if yRangeMin and yRangeMin.strip() else None,
            float(yRangeMax) if yRangeMax and yRangeMax.strip() else None
        ],
        bargap=0.2,
        bargroupgap=0.1
    )

# ── Output ───────────────────────────────────────────────────────────────────
fig_json_output = fig.to_json()
`;
const histogramCode = `
import plotly.express as px
import plotly.graph_objects as go
import pandas as pd
import numpy as np

# ── Load data ────────────────────────────────────────────────────────────────
try:
    import js_workspace as jsdata
    data = jsdata.to_py()
    df = pd.DataFrame(data)
except (ModuleNotFoundError, AttributeError, NameError):
    pass  # assume df is already in global scope

# ── Helper ───────────────────────────────────────────────────────────────────
def get_or_default(var_value, default=""):
    if var_value in (None, "", "undefined", "None"):
        return default
    return var_value

# ── Debug inputs ─────────────────────────────────────────────────────────────
print(f"DEBUG histogram: X='{X}', Group='{Group}', marginalPlot='{marginalPlot}'")
print(f"DEBUG histogram: bargap={bargap}, color='{color}'")

# ── Initialize empty figure ─────────────────────────────────────────────────
fig = go.Figure()

if not X or X not in df.columns:
    fig.add_annotation(
        text="Please select a valid column for the histogram",
        xref="paper", yref="paper", x=0.5, y=0.5,
        showarrow=False, font_size=18
    )
else:
    # Prepare data
    df[X] = pd.to_numeric(df[X], errors='coerce')
    df.replace('NaN', np.nan, inplace=True)

    # Grouping / coloring
    color_param = Group if Group and Group in df.columns else None
    showlegend = bool(color_param)

    # Marginal plots
    marginal = "rug" if marginalPlot == "rug" else "box" if marginalPlot == "box" else None

    # Titles & labels
    title = get_or_default(graphTitle, f"Distribution of {X}")
    x_title = get_or_default(xLabel, X)
    y_title = get_or_default(yLabel, "Count")

    # Create histogram
    fig = px.histogram(
        df,
        x=X,
        color=color_param,
        marginal=marginal,
        title=title,
        labels={X: x_title, "count": y_title},
        template="seaborn",
        opacity=0.75,
        color_discrete_sequence=[color] if color and not color_param else None
    )

    # Apply layout settings (including bargap)
    fig.update_layout(
        showlegend=showlegend,
        legend_title_text=get_or_default(legend_title_text, color_param or "Groups"),
        bargap=float(bargap) if bargap else 0.1,
        bargroupgap=0.05,
        xaxis_range=[
            float(xRangeMin) if xRangeMin else None,
            float(xRangeMax) if xRangeMax else None
        ],
        yaxis_range=[
            float(yRangeMin) if yRangeMin else None,
            float(yRangeMax) if yRangeMax else None
        ],
    )

    # Common histogram preference: y starts at 0
    fig.update_yaxes(rangemode="tozero")

# ── Output ───────────────────────────────────────────────────────────────────
fig_json_output = fig.to_json()
`;

const sectionCodeStart = ``;

const sectionCodeEnd = ``;

export const templates = {
  scatterPlot:
    sectionCodeStart + "\n" + scatterPlotCode + "\n" + sectionCodeEnd,
  histogram: sectionCodeStart + "\n" + histogramCode + "\n" + sectionCodeEnd,
  barGraph: sectionCodeStart + "\n" + barGraphCode + "\n" + sectionCodeEnd,
};

export default function TemplateSelector({ sectionId, onChange }) {
  const selectGraphType = ({ type, title }) => {
    const code = templates[type];
    onChange({
      componentId: sectionId,
      newContent: {
        type,
        code,
      },
    });
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
    </div>
  );
}
