import gql from "graphql-tag";

// create new tag
export const CREATE_TAG = gql`
  mutation CREATE_TAG($input: TagCreateInput!) {
    createTag(data: $input) {
      id
    }
  }
`;

// $title: String!, $description: String, $level: String

// update a tag
export const UPDATE_TAG = gql`
  mutation UPDATE_TAG($id: ID!, $input: TagUpdateInput!) {
    updateTag(where: { id: $id }, data: $input) {
      id
    }
  }
`;

// delete tag
export const DELETE_TAG = gql`
  mutation DELETE_TAG($id: ID!) {
    deleteTag(where: { id: $id }) {
      id
    }
  }
`;
