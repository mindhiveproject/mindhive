export default function TemplateSelector({
  handleContentChange,
  runCode,
  sectionId,
}) {
  const sectionHypVisCodeStart = `
import numpy as np
import pandas as pd
import json as json
import textwrap
await micropip.install("matplotlib") 
import matplotlib.pyplot as plt
plt.xkcd()
  `;

  const ABDesignCode = String.raw`# Getting variable from dashboard ###########################################
independentVariable = parameters["independentVariable"] if "independentVariable" in parameters else "independent Variable"
independentVariable = "\n".join(textwrap.wrap(independentVariable, width=15))
dependentVariable   = parameters["dependentVariable"] if "dependentVariable" in parameters else "dependent variable"
dependentVariable   = "\n".join(textwrap.wrap(dependentVariable, width=15))
ivConditions =  int(parameters["ivConditions"]) if "ivConditions" in parameters else 2  

graphTitle          = parameters["graphTitle"] if "graphTitle" in parameters else "Effect of IV on DV"
graphTitle          = "\n".join(textwrap.wrap(graphTitle, width=30))

# AXES #######################################################################

# Extract condition names using the index in the key
condition_items = []
for key, value in parameters.items():
    if key.startswith("condition"):
        index = int(key.replace("condition", ""))
        condition_items.append((index, value))
condition_items.sort()
conditionNames = [value for _, value in condition_items]

# Extract group ranks using the index in the key
group_items = []
for key, value in parameters.items():
    if key.startswith("group"):
        index = int(key.replace("group", ""))
        group_items.append((index, int(value)))
group_items.sort()
conditionRanks = [value for _, value in group_items]

# OPTIONS ####################################################################

# Generate data for the bar plot
def generate_ranked_data(condition_ranks, available_ranks=ivConditions, max_value=100):
    print(max_value, available_ranks, condition_ranks)  # Debugging print statements
    # Ensure that condition_ranks are integers or floats
    scaled_values = [(max_value / available_ranks) * rank for rank in condition_ranks] 
    return scaled_values 

values = generate_ranked_data(conditionRanks)
print("Scaled values:", values)
max_y = max(values) * 1.2

# Create bar plot
fig, ax = plt.subplots(figsize=(4, 3))  
bars = ax.bar(conditionNames, values, capsize=5, 
                color=['skyblue', 'lightcoral', 'lightgreen', 'gray', 'lightpink'][:ivConditions], width=0.5)

ax.set_ylim(0, max_y)
ax.set_ylabel(dependentVariable)
plt.xticks(rotation=45)
ax.set_title("{}".format(graphTitle if graphTitle != "" else f"{independentVariable} vs {dependentVariable}"), fontsize=11)

# Annotate bars with ranks
for bar, rank in zip(bars, conditionRanks):
    height = bar.get_height()
    ax.text(bar.get_x() + bar.get_width() / 2.0, height, f"Rank {rank}", ha='center', va='bottom', fontsize=10)

plt.tight_layout()

ax.yaxis.set_ticks([])  # Remove y-axis ticks
ax.set_yticklabels([])  # Remove y-axis labels

# Convert the plot to HTML and render it
from io import BytesIO
import base64

img_buffer = BytesIO()
plt.savefig(img_buffer, format='png', bbox_inches='tight', dpi=200)
img_buffer.seek(0)
img_base64 = base64.b64encode(img_buffer.read()).decode('utf-8')
fig_html = f'<img src="data:image/png;base64,{img_base64}" />'
`;

  const CorrAnalysisCode = String.raw`# Getting variable from dashboard ###########################################
independentVariable = parameters["independentVariable"] if "independentVariable" in parameters else "Independent Variable"
dependentVariable = parameters["dependentVariable"] if "dependentVariable" in parameters else "Dependent Variable"
ivDirectionality = parameters["ivDirectionality"] if "ivDirectionality" in parameters else "more"
dvDirectionality = parameters["dvDirectionality"] if "dvDirectionality" in parameters else "more"
graphTitle = parameters["graphTitle"] if "graphTitle" in parameters else "Correlational Analysis"

# AXES #######################################################################
xaxis = independentVariable
yaxis = dependentVariable

# n_points = 100
# noise_level = 2

ivDirectionality = "increase" if ivDirectionality in ["higher", "more", "better"] else "decrease"
dvDirectionality = "increase" if dvDirectionality in ["higher", "more", "better"] else "decrease"

if ivDirectionality == dvDirectionality:
  correlationHyp = 'positive'
else:
  correlationHyp = 'negative'

# alternative implementation of above code if we decide to incorporate a 'no correlation' option
# if ivDirectionality == dvDirectionality:
#   correlationHyp = 'positive'
# elif (ivDirectionality == 'positive' and dvDirectionality == 'negative') or (ivDirectionality == 'negative' and dvDirectionality == 'positive'):
#    correlationHyp = 'negative'
# else:
#    correlationHyp = 'No correlation'

correlation_type = correlationHyp #['positive', 'negative', 'No correlation']

# OPTIONS ####################################################################
graphTitle = graphTitle 

# generate data
def generate_data(correlation='positive', n_points=50, noise=2):
    np.random.seed(42)  # For reproducibility
    x = np.linspace(0, 10, n_points)
    
    if correlation == 'positive':
        y = x + noise * np.random.normal(size=n_points)
    elif correlation == 'negative':
        y = -x + 10 + noise * np.random.normal(size=n_points)
    else:  # No correlation
        y = np.random.uniform(0, 10, n_points)
    
    return pd.DataFrame({xaxis: x, yaxis: y})

df = generate_data(correlation=correlation_type)

# Create the plot
fig, ax = plt.subplots(figsize=(6, 4)) 

# Scatter plot
ax.scatter(df[xaxis], df[yaxis], color='blue', label=f'{correlation_type.capitalize()} Correlation' if correlation_type != 'No correlation' else 'No Correlation')

# Add trendline if applicable
if correlation_type in ['positive', 'negative']:
    z = np.polyfit(df[xaxis], df[yaxis], 1)  # Linear fit
    p = np.poly1d(z)
    ax.plot(df[xaxis], p(df[xaxis]), linestyle='--', color='red', label='Trendline')

# Set title and labels
ax.set_title(f"{graphTitle}\n[{correlation_type.capitalize()}{' correlation' if correlation_type != 'No correlation' else ''}]", fontsize=12)
ax.set_xlabel(xaxis)
ax.set_ylabel(yaxis)

# Add legend
handles, labels = ax.get_legend_handles_labels()
trendline_handle = handles[1] if len(handles) > 1 else None
if trendline_handle:
    ax.legend([trendline_handle], ['Trendline'])

plt.tight_layout()

plt.xticks(rotation=45)

ax.xaxis.set_ticks([])  # Remove x-axis ticks
ax.set_xticklabels([])  # Remove x-axis labels
ax.yaxis.set_ticks([])  # Remove y-axis ticks
ax.set_yticklabels([])  # Remove y-axis labels

# Convert the plot to HTML and render it
from io import BytesIO
import base64

img_buffer = BytesIO()
plt.savefig(img_buffer, format='png', bbox_inches='tight')
img_buffer.seek(0)
img_base64 = base64.b64encode(img_buffer.read()).decode('utf-8')
fig_html = f'<img src="data:image/png;base64,{img_base64}" />'

  `;

  const sectionCodeEnd = `  
# Display the plot
js.render_html(html_output, fig_html)`;

  const templates = {
    ABDesign:
      sectionHypVisCodeStart + "\n" + ABDesignCode + "\n" + sectionCodeEnd,
    CorrAnalysis:
      sectionHypVisCodeStart + "\n" + CorrAnalysisCode + "\n" + sectionCodeEnd,
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
      {/* AB DESIGN */}
      <div
        className="template"
        onClick={() =>
          selectGraphType({ 
            type: "ABDesign", 
            title: "Experimental Hypothesis" })
        }
      >
        <div>
          <img src={`/assets/icons/visualize/hypVisABdesign.svg`} />
        </div>
        <div className="text">
          <div className="title">Experimental Hypothesis</div>
          <div className="description">
            Create graphical representation of hypothesis for an experimental
            (A-B) design where two groups or more are compared.
          </div>
        </div>
      </div>

      {/* Correlations */}
      <div
        className="template"
        onClick={() =>
          selectGraphType({
            type: "CorrAnalysis",
            title: "Correlational Hypothesis",
          })
        }
      >
        <div>
          <img src={`/assets/icons/visualize/hypVisCorrelation.svg`} />
        </div>
        <div className="text">
          <div className="title">Correlational Hypothesis</div>
          <div className="description">
            Create graphical representation of hypothesis where two quantities
            are expected to vary together.
          </div>
        </div>
      </div>
    </div>
  );
}
