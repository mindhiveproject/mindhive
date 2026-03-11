const summaryCode = `
import pandas as pd
import numpy as np
import json

def to_native(obj):
    if isinstance(obj, (np.bool_, np.integer, np.floating)):
        return obj.item()
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    if isinstance(obj, dict):
        return {k: to_native(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [to_native(i) for i in obj]
    return obj

# ── Load data ───────────────────────────────────────────────────────────────
try:
    import js_workspace as data_module
    raw_data = data_module.to_py()
    df = pd.DataFrame(raw_data)
except Exception:
    return json.dumps({
        "success": False,
        "message": "Failed to load dataset"
    })

# ── Injected selectors ──────────────────────────────────────────────────────
# quantCols: comma-separated string of quantitative columns (or single)
# groupVariable: optional grouping column
# dataType: "quant" or "cat" (for mixed columns)

quantCols_str = quantCols          
group_var     = groupVariable     
is_quant_only = (dataType == "quant")

if not quantCols_str:
    return json.dumps({
        "success": False,
        "message": "No columns selected for summary"
    })

columns = [c.strip() for c in quantCols_str.split(",") if c.strip()]
if not columns:
    return json.dumps({
        "success": False,
        "message": "No valid columns provided"
    })

# ── Prepare summary ─────────────────────────────────────────────────────────
summary = {
    "success": True,
    "title": "Dataset Summary",
    "grouped": bool(group_var),
    "group_var": group_var if group_var else None,
    "columns": [],
    "overall": {}
}

# ── Overall (ungrouped) summary ─────────────────────────────────────────────
for col in columns:
    if col not in df.columns:
        continue
    
    series = pd.to_numeric(df[col], errors='coerce') if is_quant_only else df[col]
    series_clean = series.dropna()
    
    if len(series_clean) == 0:
        continue
    
    col_summary = {
        "name": col,
        "type": "quantitative" if pd.api.types.is_numeric_dtype(series) else "categorical",
        "n_valid": int(len(series_clean)),
        "n_missing": int(len(series) - len(series_clean)),
        "unique": int(series_clean.nunique())
    }
    
    if col_summary["type"] == "quantitative":
        desc = series_clean.describe()
        col_summary.update({
            "mean": float(desc['mean']),
            "std": float(desc['std']),
            "min": float(desc['min']),
            "25%": float(desc['25%']),
            "50%": float(desc['50%']),
            "75%": float(desc['75%']),
            "max": float(desc['max'])
        })
    else:
        value_counts = series_clean.value_counts().head(10)  # top 10 categories
        col_summary["top_categories"] = [
            {"category": str(k), "count": int(v), "percent": float(v / len(series_clean) * 100)}
            for k, v in value_counts.items()
        ]
    
    summary["columns"].append(col_summary)

# ── Grouped summary (if group_var provided) ────────────────────────────────
if group_var and group_var in df.columns:
    for col in columns:
        if col not in df.columns:
            continue
        
        grouped = df.groupby(group_var)[col]
        group_summaries = []
        
        for name, series in grouped:
            series_clean = pd.to_numeric(series, errors='coerce').dropna() if is_quant_only else series.dropna()
            if len(series_clean) == 0:
                continue
            
            g_sum = {
                "group": str(name),
                "n": int(len(series_clean)),
                "mean": float(series_clean.mean()) if pd.api.types.is_numeric_dtype(series_clean) else None,
                "std": float(series_clean.std()) if pd.api.types.is_numeric_dtype(series_clean) else None
            }
            group_summaries.append(g_sum)
        
        if group_summaries:
            summary["columns"][-1]["grouped"] = group_summaries  # attach to last column (simplified)

# ── Overall dataset stats ──────────────────────────────────────────────────
summary["overall"] = {
    "n_rows": int(len(df)),
    "n_columns": int(len(df.columns)),
    "n_selected_columns": len(columns)
}

return json.dumps(to_native(summary))
`.trim();

const sectionCodeStart = ``;

const sectionCodeEnd = ``;

export const summaryTemplates = {
  summary: sectionCodeStart + "\n" + summaryCode + "\n" + sectionCodeEnd,
};
