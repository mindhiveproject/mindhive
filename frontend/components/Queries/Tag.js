import gql from "graphql-tag";

// get all tags
export const GET_TAGS = gql`
  query GET_TAGS {
    tags {
      id
      title
      slug
      createdAt
      updatedAt
    }
  }
`;

// get specific tag
export const GET_TAG = gql`
  query GET_TAG($id: ID!) {
    tag(where: { id: $id }) {
      id
      title
      slug
      description
      level
      createdAt
      updatedAt
    }
  }
`;
