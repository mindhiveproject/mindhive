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

// get public and project resources
export const GET_PUBLIC_AND_PROJECT_RESOURCES = gql`
  query GET_PUBLIC_AND_PROJECT_RESOURCES($projectId: ID!) {
    resources(
      where: {
        OR: [
          { proposalBoard: { some: { id: { equals: $projectId } } } }
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
      parent {
        id
      }
      isCustom
      isPublic
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

// get public and class resources
export const GET_PUBLIC_AND_CLASS_RESOURCES = gql`
  query GET_PUBLIC_AND_CLASS_RESOURCES($classId: ID!) {
    resources(
      where: {
        OR: [
          {
            proposalBoard: {
              some: {
                templateForClasses: { some: { id: { equals: $classId } } }
              }
            }
          }
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
      parent {
        id
      }
      isCustom
      isPublic
      createdAt
      updatedAt
    }
  }
`;
