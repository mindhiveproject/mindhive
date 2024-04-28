export default function TemplateSelector({
  handleContentChange,
  runCode,
  sectionId,
}) {
  const sectionCodeStart = ``;

  const allInOneCode = `
column_input = columns # ['COLUMN_NAME', 'COLUMN_NAME', 'COLUMN_NAME']

#############################################################################################
######################### Don't change anything below #######################################
#############################################################################################

import js_workspace as data
data = data.to_py()
df = pd.DataFrame(data)

df.replace('NaN', np.nan, inplace=True)
described_df = pd.DataFrame()

for column in column_input:
    if isQuant:
        # Convert the column to numeric
        df[column] = pd.to_numeric(df[column], errors='coerce') 
    
    if groupVariable != "":
        # Group by the specified column if groupVariable is not None
        grouped = df.groupby(groupVariable)[column].describe()
        # Rename the columns to include the groupVariable name
        grouped.columns = [f"{column}_{col}" for col in grouped.columns]
        # Add the grouped statistics to described_df
        described_df = pd.concat([described_df, grouped], axis=1)
    else:
        # Describe the column and add it to the described_df DataFrame
        described_df = pd.concat([described_df, df[column].describe()], axis=1)

# Put the ds in the correct orientation
described_df = described_df.transpose()
  `;

  const descStatNumCode = `

column_input = columns # ['COLUMN_NAME', 'COLUMN_NAME', 'COLUMN_NAME']

#############################################################################################
######################### Don't change anything below #######################################
#############################################################################################

import js_workspace as data
data = data.to_py()
df = pd.DataFrame(data)

df.replace('NaN', np.nan, inplace=True)
described_df = pd.DataFrame()

# Loop over the list of columns
for column in column_input:
    # Convert the column to numeric
    df[column] = pd.to_numeric(df[column], errors='coerce') 
    # Describe the column and add it to the described_df DataFrame
    described_df = pd.concat([described_df, df[column].describe()], axis=1)

# Put the ds in the correct orientation
described_df = described_df.transpose()
  `;
  const descStatStringsCode = `

column_input = columns # ['COLUMN_NAME', 'COLUMN_NAME', 'COLUMN_NAME']

#############################################################################################
######################### Don't change anything below #######################################
#############################################################################################

import js_workspace as data
data = data.to_py()
df = pd.DataFrame(data)

df.replace('NaN', np.nan, inplace=True)
described_df = pd.DataFrame()

# Loop over the list of columns
for column in column_input:
    # Describe the column and add it to the described_df DataFrame
    described_df = pd.concat([described_df, df[column].describe()], axis=1)

# Put the ds in the correct orientation
described_df = described_df.transpose()

  `;
  const descStatsStringsAndNumericalCode = `

column_input    = NumericalColumn # 'num_siblings'
column_category = LabelColumn # 'year'


#############################################################################################
######################### Don't change anything below #######################################
#############################################################################################

import js_workspace as data
data = data.to_py()
df = pd.DataFrame(data)

df.replace('NaN', np.nan, inplace=True)
# Get unique labels from the 'column_category'
unique_labels = df[column_category].unique()

unique_labels = list(unique_labels)
unique_labels = [i for i in unique_labels if i != '']
print(unique_labels)


# Create an empty DataFrame to store the descriptions
described_df = pd.DataFrame()

# Loop over each unique label
for label in unique_labels:
    # Filter the data based on the label
    filtered_data = df[df[column_category] == label]
    
    # Convert the 'column_input' to numeric
    filtered_data[column_input] = pd.to_numeric(filtered_data[column_input], errors='coerce')
    
    # Describe the 'column_input' and add it to the described_df DataFrame
    # Add the unique label to the column name
    column_name_with_label = f"{column_input}_{label}"
    described_df = pd.concat([described_df, filtered_data[column_input].describe()], axis=1)
    described_df.rename(columns={column_input: column_name_with_label}, inplace=True)

# Transpose the DataFrame to the correct orientation
described_df = described_df.transpose()
  `;
  const descStatsStringsAndStringsCode = `

column_input    = StringColumn # 'IsExtrovert'
column_category = LabelColumn # 'year'


#############################################################################################
######################### Don't change anything below #######################################
#############################################################################################

import js_workspace as data
data = data.to_py()
df = pd.DataFrame(data)

df.replace('NaN', np.nan, inplace=True)
# Get unique labels from the 'column_category'
unique_labels = df[column_category].unique()

unique_labels = list(unique_labels)
unique_labels = [i for i in unique_labels if i != '']
print(unique_labels)


# Create an empty DataFrame to store the descriptions
described_df = pd.DataFrame()

# Loop over each unique label
for label in unique_labels:
    # Filter the data based on the label
    filtered_data = df[df[column_category] == label]
   
    # Describe the 'column_input' and add it to the described_df DataFrame
    described_df = pd.concat([described_df, filtered_data[column_input].describe()], axis=1)
    # Add the unique label to the column name
    column_name_with_label = f"{column_input}_{label}"
    described_df.rename(columns={column_input: column_name_with_label}, inplace=True)

# Transpose the DataFrame to the correct orientation
described_df = described_df.transpose()
  `;

  const sectionCodeEnd = `  
df_html = described_df.to_html()
js.render_html(html_output, df_html)`;

  const templates = {
    allInOne: sectionCodeStart + "\n" + allInOneCode + "\n" + sectionCodeEnd,
    descStatNum:
      sectionCodeStart + "\n" + descStatNumCode + "\n" + sectionCodeEnd,
    descStatStrings: sectionCodeStart + "\n" + descStatStringsCode + "\n" + sectionCodeEnd,
    descStatsStringsAndNumerical: sectionCodeStart + "\n" + descStatsStringsAndNumericalCode + "\n" + sectionCodeEnd,
    descStatsStringsAndStrings: sectionCodeStart + "\n" + descStatsStringsAndStringsCode + "\n" + sectionCodeEnd,
  };

   // Set the default template type (e.g., "descStatNum")
   const defaultTemplateType = "allInOne";

   // Initialize the default code based on the default template type
   const defaultCode = templates[defaultTemplateType];
 
   // Call handleContentChange with the default content
   handleContentChange({
     newContent: {
       type: defaultTemplateType,
       code: defaultCode,
     },
   });
 
   // Run the default code
   runCode({ code: defaultCode });

  // const selectGraphType = ({ type, title }) => {
  //   const code = templates[type];
  //   handleContentChange({
  //     newContent: {
  //       type,
  //       code,
  //     },
  //   });
  //   runCode({ code });
  // };

  return (
    <div className="templates">
    <div
      className="template"
      onClick={() =>
        selectGraphType({ type: "descStatNum", title: "Descriptive Stats (Quantitative)" })
      }
    >
      <div>
        <img src={`/assets/icons/visualize/descriptiveStatsNumerical.svg`} />
      </div>
      <div className="text">
        <div className="title">Descriptive Stats (Quantitative)</div>
        <div className="description">Compute descriptive statistics on one or more column that contain numbers.</div>
      </div>
    </div>
    <div
      className="template"
      onClick={() =>
        selectGraphType({ type: "descStatStrings", title: "Descriptive Stats (Qualitative)" })
      }
    >
      <div>
        <img src={`/assets/icons/visualize/descriptiveStatsStrings.svg`} />
      </div>
      <div className="text">
        <div className="title">Descriptive Stats (Qualitative)</div>
        <div className="description">Compute descriptive statistics on one or more column that contain words, labels, condition name, etc.</div>
      </div>
    </div>

    <div
      className="template"
      onClick={() =>
        selectGraphType({ type: "descStatsStringsAndNumerical", title: "Descriptive Stats (Category & Quantitative)" })
      }
    >
      <div>
        <img src={`/assets/icons/visualize/descriptiveStatsStringsAndNumerical.svg`} />
      </div>
      <div className="text">
        <div className="title">Descriptive Stats (Category & Quantitative)</div>
        <div className="description">Compute descriptive statistics on a Quantitative column while using labels in another column to group the rows.</div>
      </div>
    </div>

    <div
      className="template"
      onClick={() =>
        selectGraphType({ type: "descStatsStringsAndStrings", title: "Descriptive Stats (Category & Quantitative)" })
      }
    >
      <div>
        <img src={`/assets/icons/visualize/descriptiveStatsStrings.svg`} />
      </div>
      <div className="text">
        <div className="title">Descriptive Stats (Category & Words)</div>
        <div className="description">Compute descriptive statistics on a column containing words while using labels in another column to group the rows.</div>
      </div>
    </div>
    
  </div>
);
}