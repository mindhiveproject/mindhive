import Browse from "./Browse/Main";
import Database from "./Database/Main";

export default function Overview({
  user,
  page,
  setPage,
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
        <Browse
          user={user}
          studyId={studyId}
          journal={journal}
          part={part}
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
