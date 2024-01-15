import StateManager from "./StateManager";

// helper function to get all column names of the given dataset
const getColumnNames = (data) => {
  const allKeys = data
    .map((line) => Object.keys(line))
    .reduce((a, b) => a.concat(b), []);
  const keys = Array.from(new Set(allKeys)).sort();
  return keys;
};

export default function Graph({ content, handleContentChange, results }) {
  // update content in the local state
  const handleChange = async (content) => {
    handleContentChange({ name: "spec", content });
  };

  const data = results.map((result) => {
    return {
      task: result?.task?.title,
      testVersion: result?.testVersion,
      participant:
        result?.guest?.publicReadableId || result?.user?.publicReadableId,
      ...result?.data,
    };
  });

  const variables = getColumnNames(data);
  // console.log({ data, variables });

  return (
    <StateManager
      studyData={data}
      studyVariables={variables}
      content={content}
      handleChange={handleChange}
    />
  );
}

// TODO
// next step
// how to save graph manipulations?
