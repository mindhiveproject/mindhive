import gql from "graphql-tag";

// create new network
export const CREATE_NETWORK = gql`
  mutation CREATE_NETWORK(
    $title: String!
    $description: String
    $settings: JSON
    $classes: [ClassWhereUniqueInput!]
  ) {
    createClassNetwork(
      data: {
        title: $title
        description: $description
        settings: $settings
        classes: { connect: $classes }
      }
    ) {
      id
    }
  }
`;

// update a network
export const UPDATE_NETWORK = gql`
  mutation UPDATE_NETWORK(
    $id: ID!
    $title: String
    $description: String
    $settings: JSON
    $classes: [ClassWhereUniqueInput!]
  ) {
    updateClassNetwork(
      where: { id: $id }
      data: {
        title: $title
        description: $description
        settings: $settings
        classes: { set: $classes }
      }
    ) {
      id
    }
  }
`;

export const ADD_CLASS_NETWORK_ADMIN = gql`
  mutation ADD_CLASS_NETWORK_ADMIN(
    $networkId: ID!
    $profileId: ID
    $email: String
  ) {
    addClassNetworkAdmin(
      networkId: $networkId
      profileId: $profileId
      email: $email
    ) {
      id
      admins {
        id
        username
        firstName
        lastName
        email
      }
    }
  }
`;

export const REMOVE_CLASS_NETWORK_ADMIN = gql`
  mutation REMOVE_CLASS_NETWORK_ADMIN($networkId: ID!, $profileId: ID!) {
    removeClassNetworkAdmin(networkId: $networkId, profileId: $profileId) {
      id
      admins {
        id
        username
        firstName
        lastName
        email
      }
    }
  }
`;
