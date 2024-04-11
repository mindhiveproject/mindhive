import StateManager from "./StateManager";

export default function Statistics({
  content,
  handleContentChange,
  pyodide,
  sectionId,
  data,
  variables,
}) {
  // update content in the local state
  const handleChange = async (content) => {
    handleContentChange({ newContent: { code: content } });
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
