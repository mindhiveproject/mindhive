export default function TemplateSelector({
  handleContentChange,
  runCode,
  sectionId,
}) {
  const sectionHypVisCodeStart = `
import numpy as np
import pandas as pd
await micropip.install("matplotlib") 
import matplotlib.pyplot as plt
plt.xkcd()
`; 

  const ABDesignCode = `
# AXES #######################################################################

#difference_type = significanceDecision
group_nb = group_nb if group_nb is not None else 2
base_mean = base_mean if base_mean is not None else 10  
effect_size = effect_size if effect_size is not None else 10
n_samples = n_samples if n_samples is not None else 50
difference_type = significanceDecision if significanceDecision is not None else 'non-significant'

group_vars = [globals().get(f'group{i+1}') for i in range(group_nb)]
group_vars = [group for group in group_vars if group is not None]
print(group_vars)

# OPTIONS ####################################################################

custom_title = custom_title if 'custom_title' in globals() and custom_title is not None else ''
yaxis = yLabel if yLabel is not None else ''

# Generate data for the bar plot
def generate_ab_data(difference_type='non-significant', group_nb=2, n_samples=50, base_mean=10, effect_size=10, noise=1):
    np.random.seed(42)  # For reproducibility
    groups = []
    
    for i in range(group_nb):
        if i == 0:
            group = np.random.normal(loc=base_mean, scale=noise, size=n_samples)
        else:
            if difference_type == 'significant':
                group = np.random.normal(loc=base_mean + effect_size * i, scale=noise, size=n_samples)
            else:
                group = np.random.normal(loc=base_mean, scale=noise, size=n_samples)
        groups.append(group)
    
    return groups

groups = generate_ab_data(difference_type=difference_type, group_nb=group_nb, n_samples=n_samples, base_mean=base_mean, effect_size=effect_size)

# Calculate means and standard errors
means = [group.mean() for group in groups]
errors = [group.std() / np.sqrt(n_samples) for group in groups]

# Create the bar plot with adjusted figure size 
fig, ax = plt.subplots(figsize=(4, 2.5))  

bars = ax.bar([f'{group_vars[i]}' for i in range(group_nb)], means, 
              # yerr=errors, 
              capsize=5, color=['skyblue', 'lightcoral', 'lightgreen', 'gray', 'lightpink'][:group_nb], width=0.5)

# Set y-axis limit to ensure 5 points above the highest bar
max_mean = max(means)
ax.set_ylim(0, max_mean + 3)

# labels and title
ax.set_title(f"{custom_title}\\nDifference: {difference_type.capitalize()}")
ax.set_ylabel(yaxis)

ax.yaxis.set_ticks([])  # Remove y-axis ticks
ax.set_yticklabels([])  # Remove y-axis labels

# Annotate bars
for bar, mean in zip(bars, means):
    height = bar.get_height()
    ax.text(bar.get_x() + bar.get_width() / 2.0, height, f"{mean:.2f}", ha='center', va='bottom')

# Convert the plot to HTML and render it
from io import BytesIO
import base64

img_buffer = BytesIO()
plt.savefig(img_buffer, format='png', bbox_inches='tight', dpi=200)
img_buffer.seek(0)
img_base64 = base64.b64encode(img_buffer.read()).decode('utf-8')
fig_html = f'<img src="data:image/png;base64,{img_base64}" />'
`;

const CorrAnalysisCode = `

# AXES #######################################################################
xaxis = xaxis
#xaxis = 'memory'
yaxis = yaxis
#yaxis = 'air pollution'
n_points = n_points
#n_points = 60
noise_level = noise_level
#noise_level = 0.99

correlation_type = correlationHyp #['positive', 'negative', 'No correlation']

# OPTIONS ####################################################################
graphTitle = graphTitle 

# generate data
def generate_data(correlation='positive', n_points=100, noise=0.1):
    np.random.seed(42)  # For reproducibility
    x = np.linspace(0, 10, n_points)
    
    if correlation == 'positive':
        y = x + noise * np.random.normal(size=n_points)
    elif correlation == 'negative':
        y = -x + 10 + noise * np.random.normal(size=n_points)
    else:  # No correlation
        y = np.random.uniform(0, 10, n_points)
    
    return pd.DataFrame({xaxis: x, yaxis: y})

df = generate_data(correlation=correlation_type, n_points=n_points, noise=noise_level)

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
ax.set_title(f"{graphTitle}\\n[{correlation_type.capitalize()}{' correlation' if correlation_type != 'No correlation' else ''}]")
ax.set_xlabel(xaxis)
ax.set_ylabel(yaxis)

# Add legend
handles, labels = ax.get_legend_handles_labels()
trendline_handle = handles[1] if len(handles) > 1 else None
if trendline_handle:
    ax.legend([trendline_handle], ['Trendline'])

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
    ABDesign: sectionHypVisCodeStart + "\n" + ABDesignCode + "\n" + sectionCodeEnd,
    CorrAnalysis: sectionHypVisCodeStart + "\n" + CorrAnalysisCode + "\n" + sectionCodeEnd,
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
          selectGraphType({ type: "ABDesign", title: "AB Design" })
        }
        >
        <div>
          <img src={`/assets/icons/visualize/hypVisABdesign.svg`} />
        </div>
        <div className="text">
          <div className="title">AB DESIGN</div>
          <div className="description">Create graphical representation of hypothesis for an experimental (A-B) design where two groups or more are compared.</div>
        </div>
      </div>
      
      {/* Correlations */}
      <div
        className="template"
        onClick={() =>
          selectGraphType({ type: "CorrAnalysis", title: "Correlational analysis" })
        }
      >
        <div>
          <img src={`/assets/icons/visualize/hypVisCorrelation.svg`} />
        </div>
        <div className="text">
          <div className="title">Correlational analysis</div>
          <div className="description">Create graphical representation of hypothesis where two quantities are expected to vary together.</div>
        </div>
      </div>
    </div>
  );
}