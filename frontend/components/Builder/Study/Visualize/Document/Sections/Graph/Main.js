import StateManager from "./StateManager";

export default function Graph({
  content,
  handleContentChange,
  data,
  variables,
  pyodide,
  sectionId,
}) {
  // update content in the local state
  const handleChange = async ({ name, content }) => {
    handleContentChange({ name, content });
  };

  return (
    <StateManager
      studyData={data}
      studyVariables={variables}
      content={content}
      handleChange={handleChange}
      pyodide={pyodide}
      sectionId={sectionId}
    />
  );
}
