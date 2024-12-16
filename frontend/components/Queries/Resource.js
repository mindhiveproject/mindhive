import gql from "graphql-tag";

// get all resources
export const GET_RESOURCES = gql`
  query GET_RESOURCES {
    resources {
      id
      title
      slug
      author {
        id
        username
      }
      createdAt
      updatedAt
    }
  }
`;

// get my resources
export const GET_MY_RESOURCES = gql`
  query GET_MY_RESOURCES($id: ID!) {
    resources(
      where: {
        OR: [
          { author: { id: { equals: $id } } }
          { collaborators: { some: { id: { equals: $id } } } }
        ]
      }
    ) {
      id
      title
      slug
      description
      content
      settings
      author {
        id
        username
      }
      collaborators {
        id
        username
      }
      createdAt
      updatedAt
    }
  }
`;

// get specific resource
export const GET_RESOURCE = gql`
  query GET_RESOURCE($id: ID!) {
    resource(where: { id: $id }) {
      id
      title
      slug
      description
      content
      settings
      author {
        id
        username
      }
      collaborators {
        id
        username
      }
      createdAt
      updatedAt
    }
  }
`;
