import StateManager from "./StateManager";

export default function Graph({
  content,
  handleContentChange,
  pyodide,
  sectionId,
  data,
  variables,
}) {
  // update content in the local state
  const handleChange = async ({ name, content }) => {
    handleContentChange({ name, content });
  };

  return (
    <StateManager
      content={content}
      handleChange={handleChange}
      pyodide={pyodide}
      sectionId={sectionId}
      data={data}
      variables={variables}
    />
  );
}
