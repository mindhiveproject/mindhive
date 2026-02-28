import gql from "graphql-tag";

// get all resources
export const GET_PUBLIC_RESOURCES = gql`
  query GET_PUBLIC_RESOURCES {
    resources(where: { isPublic: { equals: true } }) {
      id
      title
      slug
      isPublic
      isCustom
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
      parent {
        id
      }
    }
  }
`;

// get all public assignment
export const GET_TEMPLATE_ASSIGNMENT = gql`
  query GET_TEMPLATE_ASSIGNMENT {
    assignments(where: { isTemplate: { equals: true } }){
      id
      title
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
      classes {
        id
      }
      isPublic
      isCustom
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
      parent {
        id
      }
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
      collaborators {
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
      collaborators {
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
      isCustom
      settings
      classes {
        id
      }
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
      parent {
        id
      }
    }
  }
`;

// get all resources for a class (teacher tab grid)
export const GET_CLASS_RESOURCES = gql`
  query GET_CLASS_RESOURCES($classId: ID!) {
    resources(
      where: { classes: { some: { id: { equals: $classId } } } }
      orderBy: [{ createdAt: desc }]
    ) {
      id
      title
      slug
      settings
      createdAt
      updatedAt
      classes {
        id
      }
      author {
        id
        username
      }
      proposalCards {
        id
        title
        section {
          id
          title
          board {
            id
          }
        }
      }
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
          { classes: { some: { id: { equals: $classId } } } }
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
      collaborators {
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

// search users with specific permissions
export const SEARCH_USERS = gql`
  query SEARCH_USERS($search: String) {
    profiles(
      where: {
        AND: [
          { username: { contains: $search } }
          {
            OR: [
              { permissions: { some: { name: { equals: "TEACHER" } } } }
              { permissions: { some: { name: { equals: "ADMIN" } } } }
              { permissions: { some: { name: { equals: "MENTOR" } } } }
            ]
          }
        ]
      }
    ) {
      id
      username
    }
  }
`;
