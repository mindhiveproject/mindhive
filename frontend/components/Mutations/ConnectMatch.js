import gql from "graphql-tag";

export const CREATE_MATCH = gql`
  mutation CREATE_MATCH($input: ConnectMatchCreateInput!) {
    createConnectMatch(data: $input) {
      id
      status
    }
  }
`;

export const CREATE_MATCHES = gql`
  mutation CREATE_MATCHES($data: [ConnectMatchCreateInput!]!) {
    createConnectMatches(data: $data) {
      id
    }
  }
`;

export const UPDATE_MATCH = gql`
  mutation UPDATE_MATCH($id: ID!, $input: ConnectMatchUpdateInput!) {
    updateConnectMatch(where: { id: $id }, data: $input) {
      id
      status
    }
  }
`;

export const DELETE_MATCH = gql`
  mutation DELETE_MATCH($id: ID!) {
    deleteConnectMatch(where: { id: $id }) {
      id
    }
  }
`;

export const DELETE_MATCHES = gql`
  mutation DELETE_MATCHES($where: [ConnectMatchWhereUniqueInput!]!) {
    deleteConnectMatches(where: $where) {
      id
    }
  }
`;
