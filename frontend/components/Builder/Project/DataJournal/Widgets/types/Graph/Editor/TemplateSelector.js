const scatterPlotCode = `
import plotly.express as px
import plotly.graph_objects as go
import pandas as pd
import numpy as np
import json

# Load df from js_workspace if available (OLD behavior), otherwise assume global df
try:
    import js_workspace as jsdata
    data = jsdata.to_py()
    df = pd.DataFrame(data)
except (ModuleNotFoundError, AttributeError, NameError):
    pass  # df already defined in environment (NEW behavior)


def get_or_default(var_value, default=""):
    return var_value if var_value else default


def _load_graph_colors(graph_colors_json):
    try:
        return json.loads(graph_colors_json) if graph_colors_json else {}
    except Exception:
        return {}


def _apply_scatter_graph_colors(fig, brand_palette, has_group, graph_colors_json, legacy_color, use_trendline):
    gc = _load_graph_colors(graph_colors_json)
    sc = gc.get("scatter") if isinstance(gc.get("scatter"), dict) else {}
    by_group = sc.get("byGroup") if isinstance(sc.get("byGroup"), dict) else {}
    marker_default = str(sc.get("markerDefault") or "").strip()
    trend_hex = str(sc.get("trendline") or "").strip()
    leg = legacy_color if legacy_color else ""
    if leg == "pink":
        leg = ""
    if not marker_default.startswith("#") and isinstance(leg, str) and leg.startswith("#"):
        marker_default = leg
    scatter_names = []
    for tr in fig.data:
        if getattr(tr, "type", None) != "scatter":
            continue
        nm = str(tr.name or "")
        if "ols" in nm.lower():
            continue
        scatter_names.append(nm)
    seen = set()
    ordered_names = []
    for nm in scatter_names:
        if nm not in seen:
            seen.add(nm)
            ordered_names.append(nm)
    idx = 0
    for tr in fig.data:
        if getattr(tr, "type", None) != "scatter":
            continue
        nm = str(tr.name or "")
        low = nm.lower()
        if "ols" in low:
            if use_trendline and trend_hex.startswith("#"):
                tr.update(line=dict(color=trend_hex))
            continue
        if has_group:
            nm_stripped = str(nm or "").strip()
            low_nm = nm_stripped.lower()
            if (
                not nm_stripped
                or low_nm == "nan"
                or low_nm == "null"
                or nm_stripped == "None"
            ):
                lookup_key = "__no_label__"
            else:
                lookup_key = nm_stripped
            c = by_group.get(lookup_key)
            if not (isinstance(c, str) and c.startswith("#")) and lookup_key != nm_stripped:
                c = by_group.get(nm)
            if not (isinstance(c, str) and c.startswith("#")):
                try:
                    ix = ordered_names.index(nm)
                except Exception:
                    ix = idx
                c = brand_palette[ix % len(brand_palette)]
            tr.update(marker=dict(color=c))
            idx += 1
        else:
            c = marker_default if marker_default.startswith("#") else None
            if not c and isinstance(leg, str) and leg.startswith("#"):
                c = leg
            if not c:
                c = brand_palette[0]
            tr.update(marker=dict(color=c))


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
    brand_palette = ["#7D70AD", "#69BBC4", "#CF6D6A", "#F2BE42"]
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

    if not userDefWide and 'participant' in df.columns and 'participant' not in cols_to_use: cols_to_use.append('participant')

    cols_to_use = normalize_column_list(cols_to_use)
    df_plot = safe_subset(df, cols_to_use)
    df_plot.replace('NaN', np.nan, inplace=True)
    df_plot[X] = to_numeric_1d(df_plot, X)
    df_plot[Y] = to_numeric_1d(df_plot, Y)

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
    user_color = get_or_default(color)
    if user_color == "pink":
        user_color = ""
    color_seq_param = (
        brand_palette if has_group else [user_color or brand_palette[0]]
    )
    showlegend = has_group

    common_kwargs = {
        "data_frame": grouped_df,
        "x": X,
        "y": Y,
        "color": color_param,
        "color_discrete_sequence": color_seq_param,
        "title": title,
        "template": "plotly_white",
        **optional_params
    }

    fig_kwargs = common_kwargs.copy()
    if use_trendline:
        fig_kwargs["trendline"] = "ols"

    fig = px.scatter(**fig_kwargs)

    # Bring trendline to front (common issue)
    if use_trendline:
        for trace in reversed(fig.data):
            if 'ols' in trace.name.lower():
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

    _apply_scatter_graph_colors(fig, brand_palette, has_group, graph_colors_json, color, use_trendline)

fig_json_output = fig.to_json()
`;

const barGraphCode = `
import plotly.express as px
import plotly.graph_objects as go
import pandas as pd
import numpy as np
import json

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

        if not valid_columns:
            fig.add_annotation(
                text="None of the selected columns exist in the data",
                xref="paper", yref="paper", x=0.5, y=0.5,
                showarrow=False, font_size=16
            )
        else:
            # Convert columns to numeric
            for col in valid_columns:
                df[col] = to_numeric_1d(df, col)
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
        df[quantCol] = to_numeric_1d(df, quantCol)
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
    brand_palette = ["#7D70AD", "#69BBC4", "#CF6D6A", "#F2BE42"]
    
    show_error = any(e > 0 for e in error_values) and errBar != ""
    
    user_color = get_or_default(color)
    if user_color == "pink":
        user_color = ""
    try:
        _gc = json.loads(graph_colors_json) if graph_colors_json else {}
    except Exception:
        _gc = {}
    bar_gc = _gc.get("bar") if isinstance(_gc.get("bar"), dict) else {}
    by_cat = bar_gc.get("byCategory") if isinstance(bar_gc.get("byCategory"), dict) else {}
    colors = []
    for i, cat in enumerate(categories):
        key = str(cat)
        c = by_cat.get(key)
        if not (isinstance(c, str) and c.startswith("#")):
            c = brand_palette[i % len(brand_palette)]
        colors.append(c)
    if (not by_cat) and user_color and user_color.startswith("#"):
        colors = [user_color] * len(categories)
    
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
        template="plotly_white"
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
import json

# =============================================================================
# Histogram — platform injects X as one string:
#   - single column name, or
#   - several names joined with commas (multi-select in the editor).
# Parse X into a list, then branch: one column vs overlay of several.
# "Group by" and marginal plots apply only when exactly one column is selected.
# =============================================================================

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

brand_palette = ["#7D70AD", "#69BBC4", "#CF6D6A", "#F2BE42"]

# ── Parse column name(s) from injected X (same idea as wide bar chart colToPlot) ─
columns = [c.strip() for c in str(X).split(",") if c.strip()]
valid_columns = [c for c in columns if c in df.columns]

fig = go.Figure()

if not valid_columns:
    empty_msg = (
        "Please select a valid column for the histogram"
        if not columns
        else "None of the selected columns exist in the data"
    )
    fig.add_annotation(
        text=empty_msg,
        xref="paper", yref="paper", x=0.5, y=0.5,
        showarrow=False, font_size=18
    )

# ── Single column: original behavior (Group, marginal, optional color) ───────
elif len(valid_columns) == 1:
    col = valid_columns[0]
    df[col] = to_numeric_1d(df, col)
    df.replace('NaN', np.nan, inplace=True)

    color_param = Group if Group and Group in df.columns else None
    showlegend = bool(color_param)
    user_color = get_or_default(color)
    if user_color == "pink":
        user_color = ""
    try:
        _hroot = json.loads(graph_colors_json) if graph_colors_json else {}
    except Exception:
        _hroot = {}
    hist_gc = _hroot.get("histogram") if isinstance(_hroot.get("histogram"), dict) else {}
    by_series = hist_gc.get("bySeries") if isinstance(hist_gc.get("bySeries"), dict) else {}
    group_order_ids = None
    if color_param:
        raw_ids = list(df[Group].dropna().unique())
        try:
            group_order_ids = sorted(raw_ids, key=lambda v: str(v))
        except TypeError:
            group_order_ids = raw_ids
        color_sequence = []
        for i, gk in enumerate(group_order_ids):
            gk_str = str(gk)
            c = by_series.get(gk_str)
            if c is None:
                c = by_series.get(gk)
            if not (isinstance(c, str) and c.startswith("#")):
                c = brand_palette[i % len(brand_palette)]
            color_sequence.append(c)
    else:
        dfc = by_series.get("__default__")
        if not (isinstance(dfc, str) and dfc.startswith("#")):
            dfc = user_color if isinstance(user_color, str) and user_color.startswith("#") else None
        if not dfc:
            dfc = brand_palette[0]
        color_sequence = [dfc]

    marginal = "rug" if marginalPlot == "rug" else "box" if marginalPlot == "box" else None

    title = get_or_default(graphTitle, f"Distribution of {col}")
    x_title = get_or_default(xLabel, col)
    y_title = get_or_default(yLabel, "Count")

    _hist_kw = dict(
        data_frame=df,
        x=col,
        color=color_param,
        marginal=marginal,
        title=title,
        labels={col: x_title, "count": y_title},
        template="plotly_white",
        opacity=0.75,
        color_discrete_sequence=color_sequence,
    )
    if color_param and group_order_ids is not None:
        _hist_kw["category_orders"] = {Group: group_order_ids}
    fig = px.histogram(**_hist_kw)

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
    fig.update_yaxes(rangemode="tozero")

# ── Multiple columns: overlay histograms (Group / marginal not used here) ────
else:
    # When comparing several variables, color encodes which column each value came from.
    # Group-by category would require a different chart design; keep this path simple.
    for c in valid_columns:
        df[c] = to_numeric_1d(df, c)
    df.replace('NaN', np.nan, inplace=True)

    # Long-form: one row per observation, "series" = source column name
    df_long = pd.DataFrame({
        "series": np.concatenate([[name for _ in range(len(df[name]))] for name in valid_columns]),
        "data": np.concatenate([df[name].values for name in valid_columns]),
    })

    cols_label = ", ".join(valid_columns)
    title = get_or_default(graphTitle, f"Distribution of {cols_label}")
    x_title = get_or_default(xLabel, cols_label)
    y_title = get_or_default(yLabel, "Count")

    try:
        _hroot2 = json.loads(graph_colors_json) if graph_colors_json else {}
    except Exception:
        _hroot2 = {}
    hist_gc2 = _hroot2.get("histogram") if isinstance(_hroot2.get("histogram"), dict) else {}
    by_series2 = hist_gc2.get("bySeries") if isinstance(hist_gc2.get("bySeries"), dict) else {}
    multi_colors = []
    for i, name in enumerate(valid_columns):
        c = by_series2.get(str(name))
        if not (isinstance(c, str) and c.startswith("#")):
            c = brand_palette[i % len(brand_palette)]
        multi_colors.append(c)

    # Marginals are ambiguous with overlaid series; omit for multi-column mode.
    fig = px.histogram(
        df_long,
        x="data",
        color="series",
        barmode="overlay",
        marginal=None,
        title=title,
        labels={"data": x_title, "count": y_title, "series": "Column"},
        template="plotly_white",
        opacity=0.75,
        color_discrete_sequence=multi_colors
    )

    fig.update_layout(
        showlegend=True,
        legend_title_text=get_or_default(legend_title_text, "Column"),
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

// export default function TemplateSelector({ sectionId, onChange }) {
//   const selectGraphType = ({ type, title }) => {
//     const code = templates[type];
//     onChange({
//       componentId: sectionId,
//       newContent: {
//         type,
//         code,
//       },
//     });
//   };

//   return (
//     <div className="templates">
//       <div
//         className="template"
//         onClick={() =>
//           selectGraphType({ type: "scatterPlot", title: "Scatter Plot" })
//         }
//       >
//         <div>
//           <img src="/assets/icons/visualize/scatterPlot.svg" />
//         </div>
//         <div className="text">
//           <div className="title">Scatter Plot</div>
//           <div className="description">Shows variables relationship</div>
//         </div>
//       </div>
//       <div
//         className="template"
//         onClick={() =>
//           selectGraphType({ type: "histogram", title: "Histogram" })
//         }
//       >
//         <div>
//           <img src="/assets/icons/visualize/histogram.svg" />
//         </div>
//         <div className="text">
//           <div className="title">Histogram</div>
//           <div className="description">Compare distributions</div>
//         </div>
//       </div>
//       <div
//         className="template"
//         onClick={() =>
//           selectGraphType({ type: "barGraph", title: "Bar Graph" })
//         }
//       >
//         <div>
//           <img src="/assets/icons/visualize/barGraph.svg" />
//         </div>
//         <div className="text">
//           <div className="title">Bar graph</div>
//           <div className="description">Compare quantities</div>
//         </div>
//       </div>
//     </div>
//   );
// }
