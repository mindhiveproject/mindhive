import gql from "graphql-tag";

// get specific classes
export const GET_CLASSES = gql`
  query GET_CLASSES($input: ClassWhereInput!) {
    classes(where: $input) {
      id
      title
      description
      code
      creator {
        id
        username
      }
      students {
        id
      }
      settings
      createdAt
      updatedAt
    }
  }
`;

// get all classes
export const GET_ALL_CLASSES = gql`
  query GET_ALL_CLASSES {
    classes {
      id
      title
      description
      code
      createdAt
      updatedAt
      settings
    }
  }
`;

// get class with a unique code
export const GET_CLASS = gql`
  query GET_CLASS($code: String!) {
    class(where: { code: $code }) {
      id
      title
      description
      code
      creator {
        username
      }
      students {
        id
        publicId
        username
        email
      }
      mentors {
        id
        publicId
        username
        email
      }
      studies {
        id
        slug
        title
        author {
          username
        }
        collaborators {
          username
        }
        participants {
          id
        }
        createdAt
      }
      settings
      createdAt
      updatedAt
    }
  }
`;
