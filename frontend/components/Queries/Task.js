import gql from "graphql-tag";

// get all public tasks
export const ALL_PUBLIC_TASKS = gql`
  query ALL_PUBLIC_TASKS {
    tasks(where: { public: { equals: true } }, orderBy: { title: asc }) {
      id
      title
      i18nContent
      slug
    }
  }
`;

// get public tasks
export const PUBLIC_TASKS = gql`
  query PUBLIC_TASKS($where: TaskWhereInput!) {
    tasks(where: $where, orderBy: { title: asc }) {
      id
      title
      i18nContent
      taskType
      slug
      image
      description
      descriptionForParticipants
      author {
        id
      }
      collaborators {
        id
        username
      }
      parameters
      settings
    }
  }
`;

// get my tasks
export const MY_TASKS = gql`
  query MY_TASKS($where: TaskWhereInput!) {
    tasks(where: $where, orderBy: [{ createdAt: desc }]) {
      id
      title
      i18nContent
      slug
      image
      description
      taskType
      author {
        id
      }
      collaborators {
        id
        username
      }
      parameters
      settings
    }
  }
`;

// get favorite tasks
export const FAVORITE_TASKS = gql`
  query FAVORITE_TASKS($where: TaskWhereInput!) {
    tasks(where: $where, orderBy: { title: asc }) {
      id
      title
      i18nContent
      taskType
      slug
      image
      description
      descriptionForParticipants
      author {
        id
      }
      collaborators {
        id
        username
      }
      parameters
      settings
    }
  }
`;

// get task to participate
export const GET_TASK = gql`
  query GET_TASK($slug: String!) {
    task(where: { slug: $slug }) {
      id
      title
      i18nContent
      slug
      taskType
      image
      description
      descriptionForParticipants
      parameters
      settings
    }
  }
`;

// get my task to edit
export const MY_TASK = gql`
  query MY_TASK($id: ID!) {
    task(where: { id: $id }) {
      id
      title
      i18nContent
      slug
      image
      description
      descriptionForParticipants
      parameters
      settings
      isExternal
      taskType
      link
      template {
        id
        title
        i18nContent
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
      i18nContent
      slug
      image
      description
      descriptionForParticipants
      taskType
      parameters
      settings
      template {
        id
        slug
        title
        i18nContent
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
      i18nContent
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
      i18nContent
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
        i18nContent
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

// query all users that a user follows
export const MY_FAVORITE_TASKS = gql`
  query {
    authenticatedItem {
      ... on Profile {
        id
        favoriteTasks {
          id
          slug
          title
          i18nContent
        }
      }
    }
  }
`;
