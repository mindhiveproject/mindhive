import gql from "graphql-tag";

// get consents
export const GET_CONSENTS = gql`
  query GET_CONSENTS {
    consents {
      id
      code
      title
      description
    }
  }
`;

// get my consents
export const GET_MY_CONSENTS = gql`
  query GET_MY_CONSENTS($userId: ID!) {
    consents(where: { author: { id: { equals: $userId } } }) {
      id
      code
      title
      description
      createdAt
    }
  }
`;

// get public consents
export const GET_PUBLIC_CONSENTS = gql`
  query GET_PUBLIC_CONSENTS {
    consents(where: { public: { equals: true } }) {
      id
      code
      title
      description
      createdAt
    }
  }
`;

// get consent by code
export const GET_CONSENT = gql`
  query GET_CONSENT($code: String!) {
    consent(where: { code: $code }) {
      id
      code
      title
      description
      info
      author {
        id
      }
      collaborators {
        id
      }
    }
  }
`;
