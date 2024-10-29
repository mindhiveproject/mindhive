import gql from "graphql-tag";

// get homework by code
export const GET_HOMEWORK = gql`
  query GET_HOMEWORK($code: String!) {
    homework(where: { code: $code }) {
      id
      code
      title
      content
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
