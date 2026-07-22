import gql from "graphql-tag";

// get all networks
export const GET_ALL_NETWORKS = gql`
  query GET_ALL_NETWORKS($where: ClassNetworkWhereInput) {
    classNetworks(where: $where, orderBy: { title: asc }) {
      id
      publicId
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
        code
        creator {
          id
        }
        mentors {
          id
        }
        students {
          id
        }
      }
      memberOrganizations {
        id
        name
      }
      memberProfiles {
        id
        username
        firstName
        lastName
        email
      }
      connectRounds {
        id
        title
        status
        matches {
          id
        }
      }
      opportunities {
        id
        mentor {
          id
        }
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
      publicId
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

// get network by internal id (admin edit and similar)
export const GET_NETWORK = gql`
  query GET_NETWORK($id: ID!) {
    classNetwork(where: { id: $id }) {
      id
      publicId
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

// Lookup by publicId (share/deep-link ref). Pair with GET_NETWORK for dual-read.
export const GET_NETWORK_BY_PUBLIC_ID = gql`
  query GET_NETWORK_BY_PUBLIC_ID($publicId: String!) {
    classNetwork(where: { publicId: $publicId }) {
      id
      publicId
      title
      description
      isPublic
      settings
      creator {
        id
        username
      }
    }
  }
`;

const NETWORK_INVITE_FIELDS = `
  id
  direction
  status
  email
  token
  classNetwork {
    id
    publicId
    title
    isPublic
    settings
  }
  profile {
    id
    username
    firstName
    lastName
    email
  }
  requestedBy {
    id
    username
    firstName
    lastName
    email
  }
  reviewedBy {
    id
  }
  createdAt
  resolvedAt
`;

// filtered reads for the current participant and network admins
export const GET_NETWORK_INVITES = gql`
  query GET_NETWORK_INVITES($where: NetworkInviteWhereInput!) {
    networkInvites(where: $where, orderBy: { createdAt: desc }) {
      ${NETWORK_INVITE_FIELDS}
    }
  }
`;
