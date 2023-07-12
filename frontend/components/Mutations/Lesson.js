import gql from "graphql-tag";

// create new lesson
export const CREATE_LESSON = gql`
  mutation CREATE_LESSON(
    $title: String!
    $description: String
    $content: String
    $settings: JSON
  ) {
    createLesson(
      data: {
        title: $title
        description: $description
        content: $content
        settings: $settings
      }
    ) {
      id
    }
  }
`;

// update a lesson
export const UPDATE_LESSON = gql`
  mutation UPDATE_LESSON(
    $id: ID!
    $title: String
    $description: String
    $content: String
    $settings: JSON
  ) {
    updateLesson(
      where: { id: $id }
      data: {
        title: $title
        description: $description
        content: $content
        settings: $settings
      }
    ) {
      id
    }
  }
`;
