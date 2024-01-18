import StateManager from "./StateManager";

export default function Statistics({
  content,
  handleContentChange,
  data,
  variables,
  pyodide,
}) {
  // update content in the local state
  const handleChange = async (content) => {
    handleContentChange({ name: "code", content });
  };

  return (
    <StateManager
      studyData={data}
      studyVariables={variables}
      content={content}
      handleChange={handleChange}
      pyodide={pyodide}
    />
  );
}
