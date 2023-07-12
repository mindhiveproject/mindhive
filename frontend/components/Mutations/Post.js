import gql from "graphql-tag";

// create new post
export const CREATE_POST = gql`
  mutation CREATE_POST($journalId: ID!, $title: String, $content: String) {
    createPost(
      data: {
        title: $title
        content: $content
        journal: { connect: { id: $journalId } }
      }
    ) {
      id
    }
  }
`;

// update post
export const UPDATE_POST = gql`
  mutation UPDATE_POST($id: ID!, $title: String, $content: String) {
    updatePost(where: { id: $id }, data: { title: $title, content: $content }) {
      id
    }
  }
`;

// delete post
export const DELETE_POST = gql`
  mutation DELETE_POST($id: ID!) {
    deletePost(where: { id: $id }) {
      id
    }
  }
`;
