import gql from "graphql-tag";

// create homework
export const CREATE_HOMEWORK = gql`
  mutation CREATE_HOMEWORK(
    $title: String
    $content: String
    $placeholder: String
    $settings: JSON
    $public: Boolean
    $assignmentId: ID!
  ) {
    createHomework(
      data: {
        title: $title
        content: $content
        placeholder: $placeholder
        settings: $settings
        public: $public
        assignment: { connect: { id: $assignmentId } }
      }
    ) {
      id
    }
  }
`;

// more flexible way to create a homework
export const CREATE_NEW_HOMEWORK = gql`
  mutation CREATE_NEW_HOMEWORK($input: HomeworkCreateInput!) {
    createHomework(data: $input) {
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
    $placeholder: String
    $settings: JSON
    $public: Boolean
    $updatedAt: DateTime
  ) {
    updateHomework(
      where: { id: $id }
      data: {
        title: $title
        content: $content
        placeholder: $placeholder
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

// update homework
export const UPDATE_HOMEWORK = gql`
  mutation UPDATE_HOMEWORK($id: ID!, $input: HomeworkUpdateInput!) {
    updateHomework(where: { id: $id }, data: $input) {
      id
    }
  }
`;
