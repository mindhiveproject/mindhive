import gql from "graphql-tag";

// get all networks
export const GET_ALL_NETWORKS = gql`
  query GET_ALL_NETWORKS {
    classNetworks {
      id
      title
      description
      creator {
        id
        username
      }
      settings
      classes {
        id
        title
      }
      createdAt
      updatedAt
    }
  }
`;

// get network
export const GET_NETWORK = gql`
  query GET_NETWORK($id: ID!) {
    classNetwork(where: { id: $id }) {
      id
      title
      description
      creator {
        id
        username
      }
      settings
      classes {
        id
        title
      }
      createdAt
      updatedAt
    }
  }
`;
