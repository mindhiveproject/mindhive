import gql from "graphql-tag";

// create new journal
export const CREATE_JOURNAL = gql`
  mutation CREATE_JOURNAL(
    $code: String!
    $title: String!
    $description: String
  ) {
    createJournal(
      data: { code: $code, title: $title, description: $description }
    ) {
      id
    }
  }
`;

// edit journal
export const EDIT_JOURNAL = gql`
  mutation EDIT_JOURNAL($id: ID!, $title: String, $description: String) {
    updateJournal(
      where: { id: $id }
      data: { title: $title, description: $description }
    ) {
      id
    }
  }
`;

// delete journal
export const DELETE_JOURNAL = gql`
  mutation DELETE_JOURNAL($id: ID!) {
    deleteJournal(where: { id: $id }) {
      id
    }
  }
`;
