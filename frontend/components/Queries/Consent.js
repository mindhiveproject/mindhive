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

// get my consents (authored or shared with me as a collaborator)
export const GET_MY_CONSENTS = gql`
  query GET_MY_CONSENTS($userId: ID!) {
    consents(
      where: {
        OR: [
          { author: { id: { equals: $userId } } }
          { collaborators: { some: { id: { equals: $userId } } } }
        ]
      }
      orderBy: { createdAt: desc }
    ) {
      id
      code
      title
      description
      createdAt
      author {
        id
        username
      }
    }
  }
`;

// get public consents
export const GET_PUBLIC_CONSENTS = gql`
  query GET_PUBLIC_CONSENTS {
    consents(
      where: { public: { equals: true } }
      orderBy: { createdAt: desc }
    ) {
      id
      code
      title
      organization
      info
      settings
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
      settings
      organization
      class {
        id
        title
        creator {
          id
          username
        }
        teachingTeam {
          id
          username
        }
        networks {
          id
        }
      }
      createdAt
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

// classes a student can link a protocol to (for teacher review)
export const GET_MY_STUDENT_CLASSES = gql`
  query GET_MY_STUDENT_CLASSES {
    authenticatedItem {
      ... on Profile {
        id
        studentIn {
          id
          title
          code
          networks {
            id
          }
        }
      }
    }
  }
`;
