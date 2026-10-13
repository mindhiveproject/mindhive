import gql from "graphql-tag";

// get homework by code
export const GET_HOMEWORK = gql`
  query GET_HOMEWORK($code: String!) {
    homework(where: { code: $code }) {
      id
      code
      title
      content
      placeholder
      settings
      author {
        id
        username
        publicReadableId
      }
      createdAt
      updatedAt
    }
  }
`;

// get homework by code
export const GET_MY_HOMEWORK = gql`
  query GET_MY_HOMEWORK($userId: ID!, $code: String!) {
    homeworks(
      where: { author: { id: { equals: $userId } }, code: { equals: $code } }
    ) {
      id
      code
      title
      content
      placeholder
      settings
      author {
        id
        username
        publicReadableId
      }
      createdAt
      updatedAt
    }
  }
`;

// get student homework for specific assignment
export const GET_MY_HOMEWORKS_FOR_ASSIGNMENT = gql`
  query GET_MY_HOMEWORKS_FOR_ASSIGNMENT(
    $userId: ID!
    $assignmentCode: String!
  ) {
    homeworks(
      where: {
        author: { id: { equals: $userId } }
        assignment: { code: { equals: $assignmentCode } }
      }
    ) {
      id
      code
      title
      content
      placeholder
      settings
      public
      author {
        id
        username
        publicReadableId
      }
      createdAt
      updatedAt
    }
  }
`;

// get all homework for specific assignment (for Mentor/Teacher)
export const GET_ALL_HOMEWORKS_FOR_ASSIGNMENT = gql`
  query GET_ALL_HOMEWORKS_FOR_ASSIGNMENT($assignmentCode: String!) {
    homeworks(where: { assignment: { code: { equals: $assignmentCode } } }) {
      id
      code
      title
      content
      placeholder
      settings
      public
      author {
        id
        username
        publicReadableId
      }
      createdAt
      updatedAt
    }
  }
`;

// get student homework for specific proposal card
export const GET_MY_HOMEWORK_FOR_PROPOSAL_CARD = gql`
  query GET_MY_HOMEWORK_FOR_PROPOSAL_CARD($userId: ID!, $cardId: ID!) {
    homeworks(
      where: {
        author: { id: { equals: $userId } }
        proposalCard: { id: { equals: $cardId } }
      }
    ) {
      id
      code
      title
      content
      placeholder
      settings
      comment
      public
      assignment {
        id
      }
      author {
        id
        username
        publicReadableId
      }
      createdAt
      updatedAt
    }
  }
`;

// get all student homework for specific proposal card
export const GET_ALL_HOMEWORK_FOR_PROPOSAL_CARD = gql`
  query GET_ALL_HOMEWORK_FOR_PROPOSAL_CARD($cardId: ID!) {
    homeworks(where: { proposalCard: { id: { equals: $cardId } } }) {
      id
      settings
      assignment {
        id
      }
      author {
        id
        username
      }
    }
  }
`;

// Homework on a card's assignments, limited to the given authors: the viewing
// student, or the students of the board a teacher is visiting. Homework only
// links its assignment, so without the author filter a chip would reflect
// anyone who ever answered the assignment, in any class.
export const GET_HOMEWORK_FOR_CARD_ASSIGNMENTS_BY_AUTHORS = gql`
  query GET_HOMEWORK_FOR_CARD_ASSIGNMENTS_BY_AUTHORS(
    $assignmentIds: [ID!]!
    $authorIds: [ID!]!
  ) {
    homeworks(
      where: {
        assignment: { id: { in: $assignmentIds } }
        author: { id: { in: $authorIds } }
      }
    ) {
      id
      settings
      assignment {
        id
      }
      author {
        id
        username
      }
    }
  }
`;

// Full homework for one assignment, limited to the given authors (see above).
export const GET_HOMEWORKS_FOR_ASSIGNMENT_BY_AUTHORS = gql`
  query GET_HOMEWORKS_FOR_ASSIGNMENT_BY_AUTHORS(
    $assignmentCode: String!
    $authorIds: [ID!]!
  ) {
    homeworks(
      where: {
        assignment: { code: { equals: $assignmentCode } }
        author: { id: { in: $authorIds } }
      }
    ) {
      id
      code
      title
      content
      placeholder
      settings
      public
      author {
        id
        username
        publicReadableId
      }
      createdAt
      updatedAt
    }
  }
`;

// Which of a board's members are students of its class.
export const GET_BOARD_STUDENT_MEMBERS = gql`
  query GET_BOARD_STUDENT_MEMBERS($memberIds: [ID!]!, $classId: ID!) {
    profiles(
      where: {
        id: { in: $memberIds }
        studentIn: { some: { id: { equals: $classId } } }
      }
    ) {
      id
    }
  }
`;

// Students working from a class template board (members of its student
// boards who are students of the template's classes), with their homework on
// the given assignments. Used for the completion count in edit mode.
export const GET_TEMPLATE_ASSIGNMENT_COMPLETION = gql`
  query GET_TEMPLATE_ASSIGNMENT_COMPLETION(
    $templateBoardId: ID!
    $classIds: [ID!]!
    $assignmentIds: [ID!]!
  ) {
    proposalBoards(where: { clonedFrom: { id: { equals: $templateBoardId } } }) {
      id
      author {
        id
      }
      collaborators {
        id
      }
    }
    profiles(where: { studentIn: { some: { id: { in: $classIds } } } }) {
      id
    }
    homeworks(
      where: {
        assignment: { id: { in: $assignmentIds } }
        author: { studentIn: { some: { id: { in: $classIds } } } }
      }
    ) {
      id
      settings
      assignment {
        id
      }
      author {
        id
      }
    }
  }
`;

// get homework by id
export const GET_HOMEWORK_BY_ID = gql`
  query GET_HOMEWORK_BY_ID($id: ID!) {
    homework(where: { id: $id }) {
      id
      code
      title
      content
      placeholder
      settings
      comment
      author {
        id
        username
        publicReadableId
      }
      createdAt
      updatedAt
    }
  }
`;
