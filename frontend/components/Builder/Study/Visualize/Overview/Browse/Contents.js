import { Dropdown, DropdownMenu, DropdownItem } from "semantic-ui-react";
import DeleteChapter from "../../Document/DeleteChapter";

export default function Contents({
  studyId,
  journal,
  chapterId,
  selectChapter,
}) {
  return (
    <div className="contents">
      {journal?.vizParts.map((part, num) => (
        <div key={num} className="part">
          <div className="menuOriginaDataTitle">
            {part?.dataOrigin === "STUDY" ? "Study Data" : "Simulated Data"}
          </div>
          <div>
            {part?.vizChapters.map((chapter, num) => (
              <div
                key={num}
                className={
                  chapter?.id === chapterId ? "selected chapter" : "chapter"
                }
              >
                <div
                  className="title"
                  onClick={() => selectChapter({ chapterId: chapter?.id })}
                >
                  <div>{chapter?.title}</div>
                  <Dropdown
                    icon={<img src={`/assets/icons/visualize/more_vert.svg`} />}
                  >
                    <DropdownMenu>
                      <DeleteChapter studyId={studyId} chapter={chapter} />
                    </DropdownMenu>
                  </Dropdown>
                </div>
                <div>
                  {chapter?.vizSections.map((section, num) => (
                    <div key={num} className="section">
                      {section?.title}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
