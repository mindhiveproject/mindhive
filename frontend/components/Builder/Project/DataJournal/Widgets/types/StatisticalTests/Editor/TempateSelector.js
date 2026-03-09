const tTestCode = `
import pandas as pd
from scipy import stats
import json
import numpy as np

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
        "message": "Data not available (failed to load from js_workspace)"
    })

# ── Safe numeric conversion ─────────────────────────────────────────────────
def to_numeric_safe(series):
    return pd.to_numeric(series, errors='coerce')

# ── Branch depending on data format ─────────────────────────────────────────
group_a = group_b = None
name_a = name_b = None

if isWide:
    if not col1 or not col2:
        return json.dumps({
            "success": False,
            "message": "Please select both columns (wide format)"
        })
    group_a = to_numeric_safe(df[col1]).dropna()
    group_b = to_numeric_safe(df[col2]).dropna()
    name_a = col1
    name_b = col2
else:
    if not quantCol or not groupcol:
        return json.dumps({
            "success": False,
            "message": "Please select quantitative column and grouping column (long format)"
        })
    df[quantCol] = to_numeric_safe(df[quantCol])
    grouped = df.dropna(subset=[groupcol]).groupby(groupcol)[quantCol]
    if len(grouped) != 2:
        names = list(grouped.groups.keys())
        return json.dumps({
            "success": False,
            "message": f"Grouping variable must have exactly 2 levels. Found: {names}"
        })
    (name_a, group_a), (name_b, group_b) = grouped
    group_a = group_a.dropna()
    group_b = group_b.dropna()

# ── Proceed only if we have valid groups ────────────────────────────────────
if group_a is not None and group_b is not None and len(group_a) >= 2 and len(group_b) >= 2:
    # ── Run the test ────────────────────────────────────────────────────────
    t_stat, p_val = stats.ttest_ind(group_a, group_b, equal_var=True, nan_policy='omit')

    # Cohen's d
    n1, n2 = len(group_a), len(group_b)
    pooled_var = ((n1-1)*group_a.var() + (n2-1)*group_b.var()) / (n1 + n2 - 2)
    cohens_d = abs(group_a.mean() - group_b.mean()) / (pooled_var ** 0.5) if pooled_var > 0 else 0

    # Significance notation
    sig = ""
    if p_val < 0.001: sig = "***"
    elif p_val < 0.01: sig = "**"
    elif p_val < 0.05: sig = "*"

    interpretation = (
        f"There is a <strong>statistically significant difference</strong> "
        f"between the groups (t({n1+n2-2:.0f}) = {t_stat:.3f}, p = {p_val:.4f}{sig})."
        if p_val < 0.05 else
        f"No statistically significant difference (t({n1+n2-2:.0f}) = {t_stat:.3f}, p = {p_val:.4f})."
    )

    # ── Structured result ───────────────────────────────────────────────────
    result = {
        "success": True,
        "type": "tTest",
        "title": "Independent Samples t-test",
        "groups": [
            {"name": str(name_a), "n": int(n1), "mean": float(group_a.mean()), "sd": float(group_a.std())},
            {"name": str(name_b), "n": int(n2), "mean": float(group_b.mean()), "sd": float(group_b.std())}
        ],
        "t_stat": float(t_stat),
        "df": int(n1 + n2 - 2),
        "p_value": float(p_val),
        "cohens_d": float(cohens_d),
        "significant": bool(p_val < 0.05),
        "interpretation": interpretation
    }
    return json.dumps(to_native(result))

# Fallback
return json.dumps({
    "success": False,
    "message": "Insufficient data or invalid groups for t-test"
})
`.trim();

const oneWayAnovaCode = `
import pandas as pd
from scipy import stats
import json
import numpy as np

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
        "message": "Data not available (failed to load from js_workspace)"
    })

def to_numeric_safe(series):
    return pd.to_numeric(series, errors='coerce')

# ── Prepare data based on format ────────────────────────────────────────────
group_data = []
groups_list = []

if isWide:
    if not colToAnalyse:
        return json.dumps({
            "success": False,
            "message": "Please select columns to analyse (wide format)"
        })
    
    columns = [c.strip() for c in colToAnalyse.split(",") if c.strip()]
    if len(columns) < 2:
        return json.dumps({
            "success": False,
            "message": "At least two columns required for ANOVA in wide format"
        })
    
    for col in columns:
        series = to_numeric_safe(df[col]).dropna()
        if len(series) < 2:
            return json.dumps({
                "success": False,
                "message": f"Column '{col}' has fewer than 2 valid observations"
            })
        group_data.append(series.values)
        groups_list.append({
            "name": str(col),
            "n": int(len(series)),
            "mean": float(series.mean()),
            "sd": float(series.std() if len(series) > 1 else 0)
        })
else:
    if not quantCol or not groupcol:
        return json.dumps({
            "success": False,
            "message": "Please select quantitative column and grouping column (long format)"
        })
    
    df[quantCol] = to_numeric_safe(df[quantCol])
    grouped = df.dropna(subset=[groupcol]).groupby(groupcol)[quantCol]
    
    if len(grouped) < 2:
        return json.dumps({
            "success": False,
            "message": f"Grouping variable must have at least 2 levels. Found: {len(grouped)}"
        })
    
    for name, series in grouped:
        clean_series = series.dropna()
        if len(clean_series) < 2:
            return json.dumps({
                "success": False,
                "message": f"Group '{name}' has fewer than 2 valid observations"
            })
        group_data.append(clean_series.values)
        groups_list.append({
            "name": str(name),
            "n": int(len(clean_series)),
            "mean": float(clean_series.mean()),
            "sd": float(clean_series.std() if len(clean_series) > 1 else 0)
        })

# ── Run ANOVA ───────────────────────────────────────────────────────────────
if len(group_data) < 2:
    return json.dumps({
        "success": False,
        "message": "Not enough valid groups for ANOVA"
    })

f_stat, p_val = stats.f_oneway(*group_data)

# ── Effect size: partial eta-squared ────────────────────────────────────────
all_values = np.concatenate(group_data)
grand_mean = np.mean(all_values)
ss_total = np.sum((all_values - grand_mean) ** 2)
ss_between = sum((np.mean(g) - grand_mean) ** 2 * len(g) for g in group_data)
eta_squared = ss_between / ss_total if ss_total > 0 else 0

# ── Interpretation ──────────────────────────────────────────────────────────
df_between = len(group_data) - 1
df_within = len(all_values) - len(group_data)
sig = ""
if p_val < 0.001: sig = "***"
elif p_val < 0.01: sig = "**"
elif p_val < 0.05: sig = "*"

interpretation = (
    f"There is a <strong>statistically significant difference</strong> "
    f"between group means (F({df_between}, {df_within}) = {f_stat:.2f}, p = {p_val:.4f}{sig})."
    if p_val < 0.05 else
    f"No statistically significant difference between group means (F({df_between}, {df_within}) = {f_stat:.2f}, p = {p_val:.4f})."
)

# ── Final result ────────────────────────────────────────────────────────────
result = {
    "success": True,
    "type": "anova",
    "title": "One-Way ANOVA",
    "groups": groups_list,
    "f_stat": float(f_stat),
    "df_between": int(df_between),
    "df_within": int(df_within),
    "p_value": float(p_val),
    "eta_squared": float(eta_squared),
    "significant": bool(p_val < 0.05),
    "interpretation": interpretation
}

return json.dumps(to_native(result))
`.trim();

const sectionCodeStart = ``;

const sectionCodeEnd = ``;

export const testTemplates = {
  tTest: sectionCodeStart + "\n" + tTestCode + "\n" + sectionCodeEnd,
  oneWayAnova:
    sectionCodeStart + "\n" + oneWayAnovaCode + "\n" + sectionCodeEnd,
};
