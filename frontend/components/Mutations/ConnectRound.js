import gql from "graphql-tag";

export const CREATE_CONNECT_ROUND = gql`
  mutation CREATE_CONNECT_ROUND($input: ConnectRoundCreateInput!) {
    createConnectRound(data: $input) {
      id
      title
      status
    }
  }
`;

export const UPDATE_CONNECT_ROUND = gql`
  mutation UPDATE_CONNECT_ROUND($id: ID!, $input: ConnectRoundUpdateInput!) {
    updateConnectRound(where: { id: $id }, data: $input) {
      id
      title
      status
    }
  }
`;

export const DELETE_CONNECT_ROUND = gql`
  mutation DELETE_CONNECT_ROUND($id: ID!) {
    deleteConnectRound(where: { id: $id }) {
      id
    }
  }
`;
