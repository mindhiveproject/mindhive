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
group_a_label = groupA
group_b_label = groupB

n_samples = 50
n_samples = n_samples

# Define whether the difference is significant or not
difference_type = None # 'non-significant' 'significant'
difference_type = significanceDecision

base_mean = base_mean
effect_size = effect_size

# OPTIONS ####################################################################

custom_title = customTitle
yaxis = yLabel

# Generate data for the bar plot
def generate_ab_data(difference_type='non-significant', n_samples=50, base_mean=10, effect_size=2, noise=1):
    np.random.seed(42)  # For reproducibility
    group_a = np.random.normal(loc=base_mean, scale=noise, size=n_samples)
    
    if difference_type == 'significant':
        group_b = np.random.normal(loc=base_mean + effect_size, scale=noise, size=n_samples)
    else:
        group_b = np.random.normal(loc=base_mean, scale=noise, size=n_samples)
    
    return group_a, group_b

group_a, group_b = generate_ab_data(difference_type=difference_type, n_samples=n_samples, base_mean=base_mean, effect_size=effect_size)

# Calculate means and standard errors
means = [group_a.mean(), group_b.mean()]
errors = [group_a.std() / np.sqrt(n_samples), group_b.std() / np.sqrt(n_samples)]

# Create the bar plot with adjusted figure size 
fig, ax = plt.subplots(figsize=(4, 2.5))  

bars = ax.bar([group_a_label, group_b_label], means, 
              # yerr=errors, 
              capsize=5, color=['skyblue', 'lightcoral'], width=0.5)

# Set y-axis limit to ensure 5 points above the highest bar
max_mean = max(means)
ax.set_ylim(0, max_mean + 3)

# Add labels and title
# ax.set_title(f"{custom_title}")
ax.set_title(f"{custom_title}\\nDifference: {difference_type.capitalize()}")
ax.set_ylabel(yaxis)

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