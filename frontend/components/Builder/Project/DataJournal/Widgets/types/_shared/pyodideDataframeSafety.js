export const DATAFRAME_SAFETY_PYTHON = `
def normalize_column_list(columns):
    normalized = []
    seen = set()
    for col in columns or []:
        if col is None:
            continue
        name = str(col).strip()
        if not name or name in seen:
            continue
        seen.add(name)
        normalized.append(name)
    return normalized

def series_from_df(df, col):
    selected = df[col]
    if isinstance(selected, pd.DataFrame):
        if selected.shape[1] == 0:
            return pd.Series(dtype="float64")
        return selected.iloc[:, 0]
    return selected

def to_numeric_1d(df, col):
    return pd.to_numeric(series_from_df(df, col), errors='coerce')

def safe_subset(df, columns):
    cols = [c for c in normalize_column_list(columns) if c in df.columns]
    if not cols:
        return df.iloc[:, 0:0].copy()
    return df[cols].copy()
`.trim();
