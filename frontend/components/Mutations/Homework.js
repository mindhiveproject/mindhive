import gql from "graphql-tag";

// create homework
export const CREATE_HOMEWORK = gql`
  mutation CREATE_HOMEWORK(
    $title: String
    $content: String
    $settings: JSON
    $public: Boolean
    $assignmentId: ID!
  ) {
    createHomework(
      data: {
        title: $title
        content: $content
        settings: $settings
        public: $public
        assignment: { connect: { id: $assignmentId } }
      }
    ) {
      id
    }
  }
`;

// edit homework
export const EDIT_HOMEWORK = gql`
  mutation EDIT_HOMEWORK(
    $id: ID!
    $title: String
    $content: String
    $settings: JSON
    $public: Boolean
    $updatedAt: DateTime
  ) {
    updateHomework(
      where: { id: $id }
      data: {
        title: $title
        content: $content
        settings: $settings
        public: $public
        updatedAt: $updatedAt
      }
    ) {
      id
    }
  }
`;

// delete homework
export const DELETE_HOMEWORK = gql`
  mutation DELETE_HOMEWORK($id: ID!) {
    deleteHomework(where: { id: $id }) {
      id
    }
  }
`;
