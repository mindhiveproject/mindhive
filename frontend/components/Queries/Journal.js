import gql from "graphql-tag";

// get teacher classes
export const GET_MY_JOURNALS = gql`
  query GET_MY_JOURNALS {
    journals {
      id
      title
      code
      createdAt
      updatedAt
      settings
      posts {
        id
      }
    }
  }
`;

// get journal with a unique code
export const GET_JOURNAL = gql`
  query GET_JOURNAL($code: String!) {
    journal(where: { code: $code }) {
      id
      title
      code
      posts {
        id
        title
        content
        createdAt
        updatedAt
      }
      creator {
        id
        studentIn {
          id
        }
      }
    }
  }
`;
