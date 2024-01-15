import ChapterHeader from "./ChapterHeader";
import CreateSection from "./CreateSection";

import Section from "./Section";

export default function Document({ studyId, part, chapter, results }) {
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
      <ChapterHeader studyId={studyId} part={part} chapter={chapter} />
      <div>
        {chapter?.vizSections.map((section, num) => (
          <Section
            key={num}
            studyId={studyId}
            chapter={chapter}
            section={section}
            results={results}
          />
        ))}
      </div>
      <div className="createSectionButton">
        <CreateSection studyId={studyId} chapterId={chapter?.id} />
      </div>
    </div>
  );
}
