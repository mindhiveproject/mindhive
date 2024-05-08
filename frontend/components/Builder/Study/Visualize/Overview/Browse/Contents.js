import { Dropdown, DropdownMenu, DropdownItem } from "semantic-ui-react";
import DeleteChapter from "../../Document/DeleteChapter";
import DeletePart from "../../Document/DeletePart";

import CreateChapter from "./CreateChapter";
import PartSettings from "./PartSettings";

import sortBy from "lodash/sortBy";

export default function Contents({
  user,
  studyId,
  journal,
  activePart,
  chapterId,
  selectChapter,
  setPage,
}) {
  const goToChapter = async ({ part, chapter, headerId }) => {
    if (chapterId !== chapter?.id) {
      await selectChapter({
        partId: part?.id,
        chapterId: chapter?.id,
      });
    }
    const header = document.getElementById(headerId);
    if (header) {
      header.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      });
    }
  };

  return (
    <div className="contents">
      {sortBy(journal?.vizParts, [
        (part) => part?.position || new Date(part?.createdAt).getTime(),
      ]).map((part, num) => (
        <div
          key={num}
          className={part?.id === activePart?.id ? "active part" : "part"}
        >
          <div className="menuOriginaDataTitle">
            <div
              className="title"
              onClick={async () => {
                await goToChapter({
                  part,
                  chapter: part?.vizChapters.length && part?.vizChapters[0],
                  headerId:
                    part?.vizChapters.length && part?.vizChapters[0]?.id,
                });
              }}
            >
              {part?.title || (
                <>
                  {part?.dataOrigin?.charAt(0) +
                    part?.dataOrigin?.toLowerCase().slice(1)}{" "}
                  Data
                </>
              )}
            </div>

            {part?.id === activePart?.id ? (
              <div 
              className="dataButtonPart menuButtonThin greenFrame"
              onClick={async () => {setPage("database");}}>
                <img src={`/assets/icons/visualize/database_green.svg`} />
                <div>
                  <a>Data</a>
                </div>
              </div>
            ) : (
              <div></div>
            )}

            <Dropdown
              icon={<img src={`/assets/icons/visualize/more_vert.svg`} />}
              direction="left"
            >
              <DropdownMenu>
                <PartSettings user={user} studyId={studyId} part={part} />
                <DeletePart studyId={studyId} part={part} />
              </DropdownMenu>
            </Dropdown>
            {part?.description && (
              <div className="menuDescription">{part?.description}</div>
            )}
          </div>

          {part?.id === activePart?.id && (
            <>
              <div>
                {sortBy(part?.vizChapters, [
                  (chapter) =>
                    chapter?.position || new Date(chapter?.createdAt).getTime(),
                ]).map((chapter, num) => (
                  <div
                    key={num}
                    className={
                      chapter?.id === chapterId ? "selected chapter" : "chapter"
                    }
                  >
                    <div
                      className="title"
                      onClick={async () =>
                        await goToChapter({
                          part,
                          chapter,
                          headerId: chapter?.id,
                        })
                      }
                    >
                      <div>{chapter?.title}</div>
                      <Dropdown
                        icon={
                          <img src={`/assets/icons/visualize/more_vert.svg`} />
                        }
                        direction="left"
                      >
                        <DropdownMenu>
                          <DeleteChapter
                            studyId={studyId}
                            part={part}
                            chapter={chapter}
                            selectChapter={selectChapter}
                          />
                        </DropdownMenu>
                      </Dropdown>
                    </div>
                    <div>
                      {sortBy(chapter?.vizSections, [
                        (section) =>
                          section?.position ||
                          new Date(section?.createdAt).getTime(),
                      ]).map((section, num) => (
                        <div
                          key={num}
                          className="section"
                          onClick={async () =>
                            await goToChapter({
                              part,
                              chapter,
                              headerId: section?.id,
                            })
                          }
                        >
                          {section?.title}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="addNewChapter">
                <CreateChapter studyId={studyId} part={part} />
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
