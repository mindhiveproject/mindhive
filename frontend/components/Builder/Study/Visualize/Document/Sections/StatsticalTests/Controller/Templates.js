export default function TemplateSelector({
  handleContentChange,
  runCode,
  sectionId,
}) {
  const sectionCodeStart = ``;

  const ttestCode = `
# T-TEST

# Calculate the T-test for the means of two independent samples of scores.
# This is a test for the null hypothesis that 2 independent samples have 
# identical average (expected) values. This test assumes that the populations 
# have identical variances by default.


if isWide:
  column_1 = col1  # example: 'GT_gamble_percentage_gain'
  column_2 = col2  # example: 'GT_gamble_percentage_lose'
else:
  column_1 = quantCol
  column_2 = groupcol

# the "col1", "col2", "quantCol", and "groupcol" variables are served by MH's datatool

alternative_hypothesis = "two-sided"

# 'two-sided': the means of the distributions underlying the samples are unequal.
# 'less': the mean of the distribution underlying the first sample is less than the mean of the distribution underlying the second sample.
# 'greater': the mean of the distribution underlying the first sample is greater than the mean of the distribution underlying the second sample.


#############################################################################################
######################### Don't change anything below #######################################
#############################################################################################

from scipy import stats
import js_workspace as data
data = data.to_py()
df = pd.DataFrame(data)

if isWide:
    df[column_1] = pd.to_numeric(df[column_1], errors='coerce')
    df[column_2] = pd.to_numeric(df[column_2], errors='coerce')
else:
    df[quantCol] = pd.to_numeric(df[quantCol], errors='coerce')

# Perform a two-sample t-test
if isWide:
    t_statistic, p_value = stats.ttest_ind(df[column_1], df[column_2], nan_policy="omit")
else:
    if len(df[groupcol].unique()) != 2:
        raise TypeError(f"Error: The number of unique labels in 'groupcol' must be 2 for a two-sample t-test. Got: {df[groupcol].unique()}")
    else:
        groups = [group_data for label, group_data in df.groupby(groupcol)[quantCol]]
        print(df.columns) 
        print(groups)  
        # Perform pairwise t-tests between all groups
        for i in range(len(groups)):
            for j in range(i+1, len(groups)):
                t_statistic, p_value = stats.ttest_ind(groups[i], groups[j], nan_policy="omit")
                print(f"T-Statistic for Group {i+1} vs. Group {j+1}: {t_statistic:.4f}")
                print(f"P-Value for Group {i+1} vs. Group {j+1}: {p_value:.4f}")

df_to_show = pd.DataFrame({'Values': [t_statistic, p_value]}, index=['T-Statistic', 'P-Value'])

  `;
  
  const anovaCode = `
# ONE-WAY ANOVA

# Perform a one-way ANOVA to compare the means of three or more independent samples.
# This is a test for the null hypothesis that two or more groups have the same population mean.

#The ANOVA test has important assumptions that must be satisfied in order for the associated p-value to be valid.
#   - The samples are independent.
#   - Each sample is from a normally distributed population.
#   - The population standard deviations of the groups are all equal. This property is known as homoscedasticity.

# See R. Lowry, “Concepts and Applications of Inferential Statistics”, Chapter 14, 2014, http://vassarstats.net/textbook/

if isWide:
  columns = columns 
else:
  column_1 = quantCol
  column_2 = groupcol

# the "columns", "quantCol", and "groupcol" variables are served by MH's datatool

#############################################################################################
######################### Don't change anything below #######################################
#############################################################################################

from scipy import stats
import js_workspace as data
data = data.to_py()
df = pd.DataFrame(data)

df.replace('NaN', np.nan, inplace=True)

# Convert columns to numeric
if isWide:
    for col in columns:
        df[col] = pd.to_numeric(df[col], errors='coerce')
else:
    df[quantCol] = pd.to_numeric(df[quantCol], errors='coerce')

# Perform a one-way ANOVA
if isWide:
    f_statistic, p_value = stats.f_oneway(*[df[col] for col in columns])
else:
    groups = [group_data for label, group_data in df.groupby(groupcol)[quantCol]]
    f_statistic, p_value = stats.f_oneway(*groups)

# Display the results
print(f"F-Statistic: {f_statistic:.4f}")
print(f"P-Value: {p_value:.4f}")

df_to_show = pd.DataFrame({'Values': [f_statistic, p_value]}, index=['F-Statistic', 'P-Value'])
`;

  const pearsoncorrCode = `
# PEARSON CORRELATION

# Calculate the Pearson correlation coefficient between two variables.
# This is a measure of the linear relationship between two variables.

column_1 = col1  # example: 'GT_gamble_percentage_gain'
column_2 = col2  # example: 'GT_gamble_percentage_lose'

# the "col1" and "col2" variables are served by MH's datatool

#############################################################################################
######################### Don't change anything below #######################################
#############################################################################################

from scipy import stats
import js_workspace as data
data = data.to_py()
df = pd.DataFrame(data)

df[column_1] = pd.to_numeric(df[column_1], errors='coerce')
df[column_2] = pd.to_numeric(df[column_2], errors='coerce')

result = stats.linregress(df[column_1], df[column_2])

# Display the results
print("Linear Regression Results:")
print(f"Slope: {result.slope:.4f}")
print(f"Intercept: {result.intercept:.4f}")
print(f"Pearson Correlation Coefficient: {result.rvalue:.4f}")
print(f"P-Value: {result.pvalue:.4f}")
print(f"Standard Error of the Slope: {result.stderr:.4f}")
print(f"Standard Error of the Intercept: {result.intercept_stderr:.4f}")

# Create DataFrame to display the results
df_to_show = pd.DataFrame({
    'Values': [result.rvalue, result.pvalue, result.slope, result.intercept, result.stderr, result.intercept_stderr]},
    index=['Pearson Correlation Coefficient','P-Value', 'Slope', 'Intercept', 'Standard Error of the Slope', 'Standard Error of the Intercept']
)
`;

  const sectionCodeEnd = `  
df_html = df_to_show.to_html()
js.render_html(html_output, df_html)`;

  const templates = {
    ttest: sectionCodeStart + "\n" + ttestCode + "\n" + sectionCodeEnd,
    anova: sectionCodeStart + "\n" + anovaCode + "\n" + sectionCodeEnd,
    pearsoncorr: sectionCodeStart + "\n" + pearsoncorrCode + "\n" + sectionCodeEnd,
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

      <div
        className="template"
        onClick={() =>
          selectGraphType({ type: "ttest", title: "T-Test" })
        }
      >
        <div>
          <img src={`/assets/icons/visualize/stattest_ttest.svg`} />
        </div>
        <div className="text">
          <div className="title">T-Test</div>
          <div className="description">Calculate the T-test for the means of two independent samples.<br/>This is a test for the null hypothesis that 2 independent samples have identical average (expected) values. This test assumes that the populations have identical variances by default.</div>
        </div>
      </div>
      <div
        className="template"
        onClick={() =>
          selectGraphType({ type: "anova", title: "ANOVA" })
        }
      >
        <div>
          <img src={`/assets/icons/visualize/stattest_anova.svg`} />
        </div>
        <div className="text">
          <div className="title">One-Way Anova</div>
          <div className="description">Perform a one-way ANOVA to compare the means of three or more independent samples.<br/>This is a test for the null hypothesis that two or more groups have the same population mean.</div>
        </div>
      </div>
      <div
        className="template"
        onClick={() =>
          selectGraphType({ type: "pearsoncorr", title: "Descriptive Stats (Category & Quantitative)" })
        }
      >
        <div>
          <img src={`/assets/icons/visualize/stattest_pearson.svg`} />
        </div>
        <div className="text">
          <div className="title">Pearson Product Correlation</div>
          <div className="description">Calculate the Pearson correlation coefficient between two variables.<br/>This is a measure of the linear relationship between two variables.</div>
        </div>
      </div>
    </div>

);
}