import gql from "graphql-tag";

// create new tag
export const CREATE_TAG = gql`
  mutation CREATE_TAG($title: String!, $description: String) {
    createTag(data: { title: $title, description: $description }) {
      id
    }
  }
`;

// update a tag
export const UPDATE_TAG = gql`
  mutation UPDATE_TAG($id: ID!, $title: String, $description: String) {
    updateTag(
      where: { id: $id }
      data: { title: $title, description: $description }
    ) {
      id
    }
  }
`;
