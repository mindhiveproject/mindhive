import Browse from "./Browse/Main";
import Database from "./Database/Main";

export default function Overview({
  user,
  page,
  studyId,
  journal,
  part,
  chapterId,
  selectChapter,
  data,
  variables,
  components,
  addNewColumn,
  checkData,
  onColumnChange,
}) {
  return (
    <div className="overview">
      {page === "browse" && (
        <Browse
          user={user}
          studyId={studyId}
          journal={journal}
          chapterId={chapterId}
          selectChapter={selectChapter}
        />
      )}
      {page === "database" && (
        <Database
          part={part}
          data={data}
          variables={variables}
          components={components}
          addNewColumn={addNewColumn}
          checkData={checkData}
          onColumnChange={onColumnChange}
        />
      )}
    </div>
  );
}
