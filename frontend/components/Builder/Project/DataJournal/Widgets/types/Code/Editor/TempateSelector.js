// components/DataJournal/Widgets/types/Code/TemplateSelector.js

const plainCodeScript = `
import json
import pandas as pd

# Example: load DataFrame from js_workspace (if available),
# then return first 5 rows as JSON.

try:
    import js_workspace as data_module
    raw_data = data_module.to_py()
    df = pd.DataFrame(raw_data)
except Exception:
    df = None

# You can set \`result\` to any JSON-serializable object.
if df is not None:
    result = {
        "success": True,
        "message": "Showing first 5 rows",
        "head": df.head().to_dict(orient="records"),
    }
else:
    result = {
        "success": False,
        "message": "No dataset available; write your own code here.",
    }
`.trim();

const sectionCodeStart = ``;
const sectionCodeEnd = ``;

export const codeTemplates = {
  plainCode: sectionCodeStart + "\n" + plainCodeScript + "\n" + sectionCodeEnd,
};
