import gql from "graphql-tag";

// get all resources
export const GET_PUBLIC_RESOURCES = gql`
  query GET_RESOURCES {
    resources(where: { isPublic: { equals: true } }) {
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

// get my and public resources
export const GET_MY_AND_PUBLIC_RESOURCES = gql`
  query GET_MY_AND_PUBLIC_RESOURCES($id: ID!) {
    resources(
      where: {
        OR: [
          { author: { id: { equals: $id } } }
          { collaborators: { some: { id: { equals: $id } } } }
          { isPublic: { equals: true } }
        ]
      }
    ) {
      id
      title
      content
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

// get specific resource
export const GET_RESOURCE = gql`
  query GET_RESOURCE($id: ID!) {
    resource(where: { id: $id }) {
      id
      title
      slug
      description
      content
      isPublic
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
