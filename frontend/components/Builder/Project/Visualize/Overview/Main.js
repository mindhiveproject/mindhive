import Navigation from "./Navigation/Main";
import Database from "./Database/Main";

export default function Overview({
  user,
  page,
  setPage,
  projectId,
  studyId,
  journal,
  part,
  chapterId,
  selectChapter,
  data,
  variables,
  settings,
  components,
  updateDataset,
  onVariableChange,
}) {
  return (
    <div className="overview">
      {page === "browse" && (
        <Navigation
          user={user}
          projectId={projectId}
          studyId={studyId}
          journal={journal}
          part={part}
          data={data}
          variables={variables}
          chapterId={chapterId}
          selectChapter={selectChapter}
          setPage={setPage}
        />
      )}
      {page === "database" && (
        <Database
          part={part}
          data={data}
          variables={variables}
          settings={settings}
          components={components}
          updateDataset={updateDataset}
          onVariableChange={onVariableChange}
          setPage={setPage}
        />
      )}
    </div>
  );
}
