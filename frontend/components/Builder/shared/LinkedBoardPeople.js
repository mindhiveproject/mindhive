import { useQuery } from "@apollo/client";
import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";

import Chip from "../../DesignSystem/Chip";
import { STUDY_LINKED_BOARD_PEOPLE } from "../../Queries/Study";

const StyledLinkedBoardPeople = styled.div`
  display: grid;
  gap: 8px;

  p {
    margin: 0;
  }

  .linkedPeopleAuthor {
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }

  .linkedPeopleSection {
    display: grid;
    gap: 6px;
    margin-top: 12px;
  }

  .linkedPeopleTitle {
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }

  .linkedPeopleNote {
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  }

  .linkedPeopleChips {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
`;

/**
 * Who else can edit a study: its author, and the authors and collaborators of
 * the project boards linked to it (board members may edit the study through
 * their board — see studyUpdateWhere in keystone/access.ts). `people` leaves
 * out the author and anyone in `collaboratorIds` (the study's own
 * collaborators), each person once with the titles of their boards and their
 * avatar fields. Shared by the Connect modals and their facepiles.
 */
export function useLinkedBoardPeople(studyId, collaboratorIds = []) {
  const { t } = useTranslation("builder");
  const { data } = useQuery(STUDY_LINKED_BOARD_PEOPLE, {
    variables: { id: studyId },
    skip: !studyId,
  });
  const study = data?.study;
  const skip = new Set([study?.author?.id, ...collaboratorIds].filter(Boolean));
  const people = new Map();
  for (const board of study?.proposal || []) {
    const title =
      board?.title ||
      t("linkedBoardPeople.untitledBoard", {}, { default: "Untitled project" });
    for (const person of [board?.author, ...(board?.collaborators || [])]) {
      if (!person?.id || skip.has(person.id)) continue;
      const entry = people.get(person.id) || { ...person, boards: [] };
      if (!entry.boards.includes(title)) entry.boards.push(title);
      people.set(person.id, entry);
    }
  }
  return {
    loaded: !!study,
    author: study?.author || null,
    people: [...people.values()],
  };
}

/**
 * The read-only part of the Connect modals. `placement="author"` renders the
 * author line (above the collaborator picker); `placement="boards"` renders
 * the linked-board people (below it). Board members are managed on the
 * board, not here.
 */
export default function LinkedBoardPeople({
  studyId,
  collaboratorIds = [],
  placement = "boards",
}) {
  const { t } = useTranslation("builder");
  const { loaded, author, people } = useLinkedBoardPeople(
    studyId,
    collaboratorIds
  );
  if (!loaded) return null;

  if (placement === "author") {
    return (
      <StyledLinkedBoardPeople>
        <p className="MH-Type-Body-Base linkedPeopleAuthor">
          {t("linkedBoardPeople.author", {
            username:
              author?.username ||
              t("linkedBoardPeople.noAuthor", {}, { default: "No author" }),
          }, { default: "Study author: {{username}}" })}
        </p>
      </StyledLinkedBoardPeople>
    );
  }

  if (!people.length) return null;

  return (
    <StyledLinkedBoardPeople>
      <div className="linkedPeopleSection">
        <p className="MH-Type-Title-Small linkedPeopleTitle">
          {t("linkedBoardPeople.title", {}, {
            default: "Also on linked project boards",
          })}
        </p>
        <p className="MH-Type-Body-Small linkedPeopleNote">
          {t("linkedBoardPeople.note", {}, {
            default:
              "They can edit this study through their project board. Add or remove them from the board's own Connect menu.",
          })}
        </p>
        <div className="linkedPeopleChips">
          {people.map((person) => (
            <Chip
              key={person.id}
              variant="static"
              label={`${person.username} · ${person.boards.join(", ")}`}
              title={person.boards.join(", ")}
            />
          ))}
        </div>
      </div>
    </StyledLinkedBoardPeople>
  );
}
