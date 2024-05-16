import gql from "graphql-tag";

export const CREATE_UPDATE = gql`
  mutation CREATE_UPDATE(
    $userId: ID!
    $updateArea: String
    $link: String
    $content: JSON
  ) {
    createUpdate(
      data: {
        user: { connect: { id: $userId } }
        updateArea: $updateArea
        link: $link
        content: $content
      }
    ) {
      id
    }
  }
`;

export const OPEN_UPDATE = gql`
  mutation OPEN_UPDATE($id: ID!) {
    updateUpdate(where: { id: $id }, data: { hasOpen: true }) {
      id
    }
  }
`;

export const DELETE_UPDATE = gql`
  mutation DELETE_UPDATE($id: ID!) {
    deleteUpdate(where: { id: $id }) {
      id
    }
  }
`;

export const EDIT_UPDATE = gql`
  mutation EDIT_UPDATE($id: ID!, $input: UpdateUpdateInput!) {
    updateUpdate(where: { id: $id }, data: $input) {
      id
    }
  }
`;
