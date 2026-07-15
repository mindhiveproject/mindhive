import gql from "graphql-tag";

// get all networks
export const GET_ALL_NETWORKS = gql`
  query GET_ALL_NETWORKS($where: ClassNetworkWhereInput) {
    classNetworks(where: $where, orderBy: { title: asc }) {
      id
      title
      description
      isPublic
      creator {
        id
        username
      }
      admins {
        id
        username
        firstName
        lastName
        email
      }
      settings
      classes {
        id
        title
      }
      memberOrganizations {
        id
        name
      }
      opportunities {
        id
      }
      createdAt
      updatedAt
    }
  }
`;

// get public networks for Connect browsing and class association
export const GET_PUBLIC_CLASS_NETWORKS = gql`
  query GET_PUBLIC_CLASS_NETWORKS {
    classNetworks(
      where: { isPublic: { equals: true } }
      orderBy: { title: asc }
    ) {
      id
      title
      description
      isPublic
      settings
      classes {
        id
        title
      }
      memberOrganizations {
        id
        name
      }
      opportunities {
        id
      }
      createdAt
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
      isPublic
      creator {
        id
        username
      }
      admins {
        id
        username
        firstName
        lastName
        email
      }
      settings
      classes {
        id
        title
      }
      memberOrganizations {
        id
        name
      }
      opportunities {
        id
      }
      createdAt
      updatedAt
    }
  }
`;
