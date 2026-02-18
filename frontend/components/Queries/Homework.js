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

// get student homework for assignments attached to a card (for chip status)
export const GET_MY_HOMEWORK_FOR_CARD_ASSIGNMENTS = gql`
  query GET_MY_HOMEWORK_FOR_CARD_ASSIGNMENTS($userId: ID!, $assignmentIds: [ID!]!) {
    homeworks(
      where: {
        author: { id: { equals: $userId } }
        assignment: { id: { in: $assignmentIds } }
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
        publicReadableId
      }
    }
  }
`;

// get all homework for assignments attached to a card (for Mentor/Teacher chip status)
export const GET_ALL_HOMEWORK_FOR_CARD_ASSIGNMENTS = gql`
  query GET_ALL_HOMEWORK_FOR_CARD_ASSIGNMENTS($assignmentIds: [ID!]!) {
    homeworks(where: { assignment: { id: { in: $assignmentIds } } }) {
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
