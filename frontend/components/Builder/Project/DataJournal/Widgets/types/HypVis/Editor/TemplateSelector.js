// ── AB Design (bar plot with ranks) ─────────────────────────────────────────
const abDesignCode = `
# ── AB Design / Experimental Hypothesis Visualization ───────────────────────

import textwrap
import matplotlib.pyplot as plt
from io import BytesIO
import base64

# ── Already injected by Render.js ───────────────────────────────────────────
# independentVariable (str)
# dependentVariable   (str)
# graphTitle          (str)
# ivConditions        (int)
# conditionNames      (list of str)
# conditionRanks      (list of int/float)

# ── Sanitize / fallback values ──────────────────────────────────────────────
iv_label = textwrap.fill(str(independentVariable or "Independent Variable"), width=20)
dv_label = textwrap.fill(str(dependentVariable or "Dependent Variable"), width=20)

title_str = graphTitle.strip() if 'graphTitle' in locals() and graphTitle.strip() else \\
    f"Predicted effect of {iv_label} on {dv_label}"

n_conditions = int(ivConditions) if 'ivConditions' in locals() else 2

# Ensure lists are correct length
if not isinstance(conditionNames, list) or len(conditionNames) != n_conditions:
    conditionNames = [f"Condition {i+1}" for i in range(n_conditions)]

if not isinstance(conditionRanks, list) or len(conditionRanks) != n_conditions:
    conditionRanks = list(range(1, n_conditions + 1))

# Convert ranks to numbers (in case any came as strings)
try:
    conditionRanks = [float(r) for r in conditionRanks]
except:
    conditionRanks = list(range(1, n_conditions + 1))

# ── Scale ranks to bar heights (schematic visualization) ─────────────────────
max_height = 100
bar_values = [(max_height / max(1, n_conditions)) * rank for rank in conditionRanks]

# ── Create the plot ─────────────────────────────────────────────────────────
fig, ax = plt.subplots(figsize=(5.4, 3.9), dpi=150)

bars = ax.bar(
    conditionNames,
    bar_values,
    color=["#a6cee3", "#b2df8a", "#fb9a99", "#fdbf6f", "#cab2d6", "#ffff99", "#8dd3c7", "#bebada", "#fb8072", "#80b1d3"][:n_conditions],
    edgecolor="navy",
    linewidth=0.8,
    width=0.68
)

# Title and labels
ax.set_title(title_str, fontsize=12, pad=14, wrap=True)
ax.set_ylabel(dv_label, fontsize=11)
ax.set_ylim(0, max(bar_values) * 1.38 if bar_values else 140)

# Annotate each bar with its rank
for bar, rank in zip(bars, conditionRanks):
    height = bar.get_height()
    ax.text(
        bar.get_x() + bar.get_width() / 2,
        height + (max_height * 0.018),
        f"Rank {int(rank) if rank.is_integer() else rank:.1f}",
        ha="center",
        va="bottom",
        fontsize=10,
        fontweight="bold",
        color="#2c3e50"
    )

# Styling
ax.tick_params(axis="x", rotation=35, labelsize=9.5)
ax.yaxis.set_ticks([])
ax.grid(axis="y", linestyle="--", alpha=0.15)

plt.tight_layout(pad=1.1)

# ── Export to base64 image ──────────────────────────────────────────────────
buf = BytesIO()
plt.savefig(buf, format="png", bbox_inches="tight", dpi=160)
buf.seek(0)
img_base64 = base64.b64encode(buf.read()).decode("ascii")

fig_html = f'''
<img 
  src="data:image/png;base64,{img_base64}" 
  alt="AB design hypothesis visualization" 
  style="max-width:100%; height:auto; border-radius:6px; box-shadow:0 2px 10px rgba(0,0,0,0.1);"
/>
'''

plt.close(fig)
`.trim();

// ── Correlation (scatter + trendline) ──────────────────────────────────────
const corStudyCode = `
# ── Correlational Hypothesis Visualization ──────────────────────────────────

import textwrap

# Defaults / fallbacks
ivDir = ivDirectionality.lower() if 'ivDirectionality' in locals() else "more"
dvDir = dvDirectionality.lower() if 'dvDirectionality' in locals() else "more"

iv_inc = ivDir in ["higher", "more", "increase", "better", "greater", "stronger"]
dv_inc = dvDir in ["higher", "more", "increase", "better", "greater", "stronger"]

correlation_type = "positive" if iv_inc == dv_inc else "negative"

title_text = graphTitle.strip() if 'graphTitle' in locals() and graphTitle.strip() else \\
    f"Predictive {correlation_type.capitalize()} relationship"

iv_label = textwrap.fill(independentVariable or "Independent variable", width=22)
dv_label  = textwrap.fill(dependentVariable or "Dependent variable",   width=22)

# Generate schematic data
np.random.seed(42)
n = 65
x = np.linspace(0, 10, n)

if correlation_type == "positive":
    y = x * 0.9 + np.random.normal(0, 1.6, n)
else:
    y = -x * 0.9 + 9 + np.random.normal(0, 1.6, n)

# Plot
fig, ax = plt.subplots(figsize=(6.2, 4.4), dpi=140)

ax.scatter(x, y, s=45, color="#1f77b4", alpha=0.75, edgecolor="navy", linewidth=0.6)

# Trend line
z = np.polyfit(x, y, 1)
p = np.poly1d(z)
ax.plot(x, p(x), "--", color="#d62728", lw=1.8, label="Predicted trend")

ax.set_title(title_text, fontsize=13, pad=14, wrap=True)
ax.set_xlabel(iv_label, fontsize=11)
ax.set_ylabel(dv_label, fontsize=11)

ax.legend(loc="upper left", fontsize=10, framealpha=0.92)
ax.grid(True, linestyle="--", alpha=0.25)

# Hide ticks for schematic look
ax.set_xticks([])
ax.set_yticks([])

plt.tight_layout(pad=1.2)

# Export to base64
buf = BytesIO()
plt.savefig(buf, format="png", bbox_inches="tight", dpi=160)
buf.seek(0)
b64 = base64.b64encode(buf.read()).decode("ascii")
fig_html = f'<img src="data:image/png;base64,{b64}" alt="Correlation hypothesis plot" style="max-width:100%; height:auto; border-radius:6px; box-shadow:0 2px 8px rgba(0,0,0,0.12);"/>'

plt.close(fig)
`.trim();

export const hypvisTemplates = {
  abDesign: abDesignCode,
  corStudy: corStudyCode,
};
