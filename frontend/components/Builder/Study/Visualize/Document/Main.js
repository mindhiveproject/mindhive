import ChapterHeader from "./ChapterHeader";
import CreateSection from "./CreateSection";

import Section from "./Section";

export default function Document({
  user,
  studyId,
  part,
  chapter,
  data,
  variables,
  pyodide,
}) {
  if (!chapter) {
    if (part?.vizChapters && part?.vizChapters.length) {
      return (
        <div className="emptyDocument">
          Select a chapter in the menu on the left
        </div>
      );
    } else {
      return (
        <div className="emptyDocument">Create a new document to begin</div>
      );
    }
  }
  return (
    <div className="document">
      <ChapterHeader
        user={user}
        studyId={studyId}
        part={part}
        chapter={chapter}
      />
      <div>
        {chapter?.vizSections.map((section, num) => (
          <Section
            key={num}
            studyId={studyId}
            chapter={chapter}
            section={section}
            data={data}
            variables={variables}
            pyodide={pyodide}
          />
        ))}
      </div>
      <div className="createSectionButton">
        <CreateSection studyId={studyId} chapterId={chapter?.id} />
      </div>
    </div>
  );
}
