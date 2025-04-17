import StateManager from "./StateManager";

export default function HypVis({
  content,
  handleContentChange,
  pyodide,
  sectionId,
  data,
  variables,
  user,
  studyId,
}) {
  return (
    <StateManager
      content={content}
      handleContentChange={handleContentChange}
      pyodide={pyodide}
      sectionId={sectionId}
      data={data}
      variables={variables}
      user={user}
      studyId={studyId}
    />
  );
}
