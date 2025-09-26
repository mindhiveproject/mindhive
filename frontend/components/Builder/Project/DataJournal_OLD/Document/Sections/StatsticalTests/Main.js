import StateManager from "./StateManager";

export default function StatisticTest({
  content,
  handleContentChange,
  pyodide,
  sectionId,
  data,
  variables,
}) {
  return (
    <StateManager
      content={content}
      handleContentChange={handleContentChange}
      pyodide={pyodide}
      sectionId={sectionId}
      data={data}
      variables={variables}
    />
  );
}