import Browse from "./Browse/Main";
import Database from "./Database/Main";

export default function Overview({
  user,
  page,
  studyId,
  journal,
  chapterId,
  selectChapter,
  data,
  variables,
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
      {page === "database" && <Database data={data} variables={variables} />}
    </div>
  );
}
