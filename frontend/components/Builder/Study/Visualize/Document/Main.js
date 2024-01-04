import CreateSection from "./CreateSection";
import Section from "./Section";

export default function Document({ studyId, part, chapter }) {
  return (
    <div className="document">
      <div>
        <div>{part?.dataOrigin}</div>
        <div>{chapter?.title}</div>
        <div>{chapter?.description}</div>
      </div>
      <div>
        {chapter?.vizSections.map((section, num) => (
          <Section
            key={num}
            studyId={studyId}
            chapter={chapter}
            section={section}
          />
        ))}
      </div>
      <div>
        <CreateSection studyId={studyId} chapterId={chapter?.id} />
      </div>
    </div>
  );
}
