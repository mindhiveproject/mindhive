import gql from "graphql-tag";

// get public tasks
export const PUBLIC_TASKS = gql`
  query PUBLIC_TASKS($taskType: TaskTaskTypeType, $searchTerm: String) {
    tasks(
      where: {
        taskType: { equals: $taskType }
        public: { equals: true }
        OR: [
          { title: { contains: $searchTerm } }
          { description: { contains: $searchTerm } }
        ]
      }
      orderBy: { title: asc }
    ) {
      id
      title
      taskType
      slug
      image
      description
      descriptionForParticipants
    }
  }
`;

// get my tasks
export const MY_TASKS = gql`
  query MY_TASKS($id: ID!, $taskType: TaskTaskTypeType, $searchTerm: String) {
    tasks(
      where: {
        AND: [
          { taskType: { equals: $taskType } }
          {
            OR: [
              { author: { id: { equals: $id } } }
              { collaborators: { some: { id: { equals: $id } } } }
            ]
          }
          {
            OR: [
              { title: { contains: $searchTerm } }
              { description: { contains: $searchTerm } }
            ]
          }
        ]
      }
    ) {
      id
      title
      slug
      image
      description
      taskType
    }
  }
`;

// get task to participate
export const GET_TASK = gql`
  query GET_TASK($slug: String!) {
    task(where: { slug: $slug }) {
      id
      title
      slug
      taskType
      image
      description
    }
  }
`;

// get my task to edit
export const MY_TASK = gql`
  query MY_TASK($id: ID!) {
    task(where: { id: $id }) {
      id
      title
      slug
      image
      description
      parameters
      isExternal
      taskType
      link
      template {
        id
        title
        slug
        description
        style
        parameters
        author {
          id
        }
        collaborators {
          id
        }
        fileAddress
        scriptAddress
      }
      collaborators {
        id
      }
    }
  }
`;

// get task to clone
export const TASK_TO_CLONE = gql`
  query TASK_TO_CLONE($slug: String!) {
    task(where: { slug: $slug }) {
      id
      title
      slug
      image
      description
      taskType
      parameters
      template {
        id
        slug
        title
        description
        style
        scriptAddress
        parameters
        author {
          id
        }
        collaborators {
          id
        }
      }
    }
  }
`;

// get task to participate
export const TASK_TO_PARTICIPATE = gql`
  query TASK_TO_PARTICIPATE($id: ID!) {
    task(where: { id: $id }) {
      id
      title
      slug
      image
      description
      parameters
      template {
        id
        slug
        style
        scriptAddress
      }
      taskType
      settings
    }
  }
`;

// get task to edit in the builder
export const TASK_TO_EDIT = gql`
  query TASK_TO_EDIT($id: ID!) {
    task(where: { id: $id }) {
      id
      title
      slug
      description
      descriptionForParticipants
      parameters
      settings
      updatedAt
      link
      author {
        id
      }
      template {
        id
        title
        description
        parameters
        style
        fileAddress
        scriptAddress
        author {
          id
        }
        createdAt
        updatedAt
      }
      collaborators {
        id
      }
      consent {
        id
        title
      }
      taskType
      public
      submitForPublishing
      isOriginal
      isExternal
      link
      image
      largeImage
    }
  }
`;
