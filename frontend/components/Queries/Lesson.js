import gql from "graphql-tag";

// get my lessons
export const GET_MY_LESSONS = gql`
  query GET_MY_LESSONS($id: ID!) {
    lessons(
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
      type
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

// get specific lesson
export const GET_LESSON = gql`
  query GET_LESSON($id: ID!) {
    lesson(where: { id: $id }) {
      id
      title
      slug
      description
      type
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
