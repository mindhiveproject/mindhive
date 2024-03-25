import StateManager from "./StateManager";

export default function Statistics({
  pyodide,
  content,
  handleContentChange,
  data,
  variables,
}) {
  // update content in the local state
  const handleChange = async (content) => {
    handleContentChange({ name: "code", content });
  };

  return (
    <StateManager
      content={content}
      handleChange={handleChange}
      pyodide={pyodide}
      data={data}
      variables={variables}
    />
  );
}
