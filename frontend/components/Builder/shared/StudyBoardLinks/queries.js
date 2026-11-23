import { gql } from "@apollo/client";

const PERSON = gql`
  fragment StudyBoardLinksPerson on Profile {
    id
    username
    # The student page link (/dashboard/students/:publicId) for their staff.
    publicId
    studentIn {
      id
    }
    # Avatar fields read by the header facepile (ConnectFacepile photoUrl).
    image {
      id
      keystoneImage {
        id
        url
      }
      image {
        publicUrlTransformed
      }
    }
  }
`;

// A class with its staff (who keep study access whatever the boards) and
// its settings (studentsManageCollaborators, read by canManagePeople).
const STAFF = gql`
  fragment StudyBoardLinksStaff on Class {
    id
    settings
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
`;

export const STUDY_BOARD_LINKS_BOARD = gql`
  fragment StudyBoardLinksBoard on ProposalBoard {
    id
    title
    isMain
    author {
      ...StudyBoardLinksPerson
    }
    creator {
      ...StudyBoardLinksPerson
    }
    collaborators {
      ...StudyBoardLinksPerson
    }
    studyMain {
      id
    }
    usedInClass {
      id
      title
      settings
    }
    clonedFrom {
      id
      title
    }
    study {
      id
      title
    }
  }
  ${PERSON}
`;

/** A study with its visible boards (hidden boards stay hidden). */
export const STUDY_BOARD_LINKS = gql`
  query STUDY_BOARD_LINKS($studyId: ID!) {
    study(where: { id: $studyId }) {
      id
      title
      dataCollectionStatus
      author {
        ...StudyBoardLinksPerson
        studentIn {
          ...StudyBoardLinksStaff
        }
      }
      collaborators {
        ...StudyBoardLinksPerson
        studentIn {
          ...StudyBoardLinksStaff
        }
      }
      classes {
        title
        ...StudyBoardLinksStaff
      }
      proposalMain {
        id
      }
      proposal(
        where: { isHidden: { equals: false } }
        orderBy: [{ createdAt: desc }]
      ) {
        ...StudyBoardLinksBoard
        datasourcesCount(where: { study: { id: { equals: $studyId } } })
      }
    }
  }
  ${PERSON}
  ${STAFF}
  ${STUDY_BOARD_LINKS_BOARD}
`;

/** The board in context and its study's id. */
export const BOARD_FOR_LINKS = gql`
  query BOARD_FOR_LINKS($boardId: ID!) {
    proposalBoard(where: { id: $boardId }) {
      ...StudyBoardLinksBoard
    }
  }
  ${STUDY_BOARD_LINKS_BOARD}
`;

/**
 * Boards the user may connect to a study: their own, plus the boards of the
 * study's classes they are staff of.
 */
export const LINKABLE_BOARDS = gql`
  query LINKABLE_BOARDS($userId: ID!, $classIds: [ID!]!) {
    proposalBoards(
      where: {
        AND: [
          { isHidden: { equals: false } }
          { isTemplate: { equals: false } }
          {
            OR: [
              { author: { id: { equals: $userId } } }
              { creator: { id: { equals: $userId } } }
              { collaborators: { some: { id: { equals: $userId } } } }
              { usedInClass: { id: { in: $classIds } } }
            ]
          }
        ]
      }
      orderBy: [{ createdAt: desc }]
    ) {
      ...StudyBoardLinksBoard
    }
  }
  ${STUDY_BOARD_LINKS_BOARD}
`;

/**
 * Studies the user may put on a board: their own, plus the studies of the
 * board's class when they are its staff.
 */
export const LINKABLE_STUDIES = gql`
  query LINKABLE_STUDIES($userId: ID!, $classIds: [ID!]!) {
    studies(
      where: {
        isHidden: { equals: false }
        OR: [
          { author: { id: { equals: $userId } } }
          { collaborators: { some: { id: { equals: $userId } } } }
          { classes: { some: { id: { in: $classIds } } } }
          { author: { studentIn: { some: { id: { in: $classIds } } } } }
        ]
      }
      orderBy: [{ createdAt: desc }]
    ) {
      id
      title
      author {
        ...StudyBoardLinksPerson
      }
      collaborators {
        ...StudyBoardLinksPerson
      }
      classes {
        id
      }
      proposal(where: { isHidden: { equals: false } }) {
        id
        title
      }
    }
  }
  ${PERSON}
`;

/** Queries to refresh after a link or people change. */
export const STUDY_BOARD_LINKS_REFETCH = [
  "STUDY_BOARD_LINKS",
  "BOARD_FOR_LINKS",
  "LINKABLE_BOARDS",
  "LINKABLE_STUDIES",
  "STUDY_CLASSES",
  "STUDY_PROPOSALS_QUERY",
  "GET_PROJECT_STUDY",
  "PROPOSAL_QUERY",
  "MY_STUDY",
];
