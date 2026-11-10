import { gql, useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import MessageCard from "../../../../../DesignSystem/MessageCard";
import { classStaffIds } from "../../../../../../lib/mainProject";

// Main projects, in the board's class, of the people about to be added to it.
const MAINS_OF_NEW_COLLABORATORS = gql`
  query MAINS_OF_NEW_COLLABORATORS($id: ID!, $classId: ID!, $profileIds: [ID!]!) {
    proposalBoard(where: { id: $id }) {
      id
      isMain
      usedInClass {
        id
        creator {
          id
        }
        teachingTeam {
          id
        }
        mentors {
          id
        }
      }
    }
    proposalBoards(
      where: {
        id: { not: { equals: $id } }
        isMain: { equals: true }
        isHidden: { equals: false }
        usedInClass: { id: { equals: $classId } }
        OR: [
          { author: { id: { in: $profileIds } } }
          { collaborators: { some: { id: { in: $profileIds } } } }
        ]
      }
    ) {
      id
      title
      author {
        id
        username
      }
      collaborators {
        id
        username
      }
    }
  }
`;

/**
 * Warns before adding collaborators to a main project when one of them
 * already has a main project in the same class: they would then have two.
 * Adding them is allowed; their teacher sees both on the class dashboard.
 *
 * `newIds` are the profiles being added (not yet saved on the board).
 */
export default function SecondMainWarning({ boardId, classId, newIds = [] }) {
  const { t } = useTranslation("builder");
  const { data } = useQuery(MAINS_OF_NEW_COLLABORATORS, {
    variables: { id: boardId, classId, profileIds: newIds },
    skip: !boardId || !classId || !newIds.length,
  });

  if (!newIds.length || !data?.proposalBoard?.isMain) return null;

  // Teachers and mentors of the class have no main project of their own.
  const staffIds = classStaffIds(data.proposalBoard.usedInClass);
  const names = new Set();
  for (const board of data.proposalBoards || []) {
    for (const person of [board.author, ...(board.collaborators || [])]) {
      if (person?.id && newIds.includes(person.id) && !staffIds.has(person.id)) {
        names.add(person.username);
      }
    }
  }
  if (!names.size) return null;
  const list = [...names].join(", ");

  return (
    <MessageCard
      variant="information"
      message={t("mainProject.secondMainWarning", { names: list }, {
        default: `This is a main project, and ${list} already has a main project in this class. If you add them, they will have two main projects, and their teacher will see both until one is removed as main project.`,
      })}
    />
  );
}
