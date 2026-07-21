import gql from "graphql-tag";

// create new network
export const CREATE_NETWORK = gql`
  mutation CREATE_NETWORK(
    $title: String!
    $description: String
    $isPublic: Boolean
    $settings: JSON
    $classes: [ClassWhereUniqueInput!]
  ) {
    createClassNetwork(
      data: {
        title: $title
        description: $description
        isPublic: $isPublic
        settings: $settings
        classes: { connect: $classes }
      }
    ) {
      id
    }
  }
`;

// update network title, description, and settings (e.g. membershipMode)
export const UPDATE_CLASS_NETWORK_DETAILS = gql`
  mutation UPDATE_CLASS_NETWORK_DETAILS(
    $id: ID!
    $title: String!
    $description: String
    $settings: JSON
  ) {
    updateClassNetwork(
      where: { id: $id }
      data: {
        title: $title
        description: $description
        settings: $settings
      }
    ) {
      id
      title
      description
      settings
    }
  }
`;

// update a network
export const UPDATE_NETWORK = gql`
  mutation UPDATE_NETWORK(
    $id: ID!
    $title: String
    $description: String
    $isPublic: Boolean
    $settings: JSON
    $classes: [ClassWhereUniqueInput!]
  ) {
    updateClassNetwork(
      where: { id: $id }
      data: {
        title: $title
        description: $description
        isPublic: $isPublic
        settings: $settings
        classes: { set: $classes }
      }
    ) {
      id
    }
  }
`;

export const ASSOCIATE_CLASS_WITH_PUBLIC_NETWORK = gql`
  mutation ASSOCIATE_CLASS_WITH_PUBLIC_NETWORK(
    $classId: ID!
    $networkId: ID!
  ) {
    associateClassWithPublicNetwork(classId: $classId, networkId: $networkId) {
      id
      networks {
        id
        title
        description
        isPublic
        settings
      }
    }
  }
`;

export const REMOVE_CLASS_FROM_NETWORK = gql`
  mutation REMOVE_CLASS_FROM_NETWORK($classId: ID!, $networkId: ID!) {
    removeClassFromNetwork(classId: $classId, networkId: $networkId) {
      id
      networks {
        id
        title
        description
        isPublic
        settings
      }
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

export const ADD_CLASS_NETWORK_MEMBER_PROFILE = gql`
  mutation ADD_CLASS_NETWORK_MEMBER_PROFILE(
    $networkId: ID!
    $profileId: ID
    $email: String
  ) {
    addClassNetworkMemberProfile(
      networkId: $networkId
      profileId: $profileId
      email: $email
    ) {
      id
      memberProfiles {
        id
        username
        firstName
        lastName
        email
      }
      memberOrganizations {
        id
        name
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

export const REMOVE_CLASS_NETWORK_MEMBER_PROFILE = gql`
  mutation REMOVE_CLASS_NETWORK_MEMBER_PROFILE(
    $networkId: ID!
    $profileId: ID!
  ) {
    removeClassNetworkMemberProfile(
      networkId: $networkId
      profileId: $profileId
    ) {
      id
      memberProfiles {
        id
        username
        firstName
        lastName
        email
      }
      memberOrganizations {
        id
        name
      }
    }
  }
`;

export const REMOVE_CLASS_NETWORK_MEMBER_ORGANIZATION = gql`
  mutation REMOVE_CLASS_NETWORK_MEMBER_ORGANIZATION(
    $networkId: ID!
    $organizationId: ID!
  ) {
    removeClassNetworkMemberOrganization(
      networkId: $networkId
      organizationId: $organizationId
    ) {
      id
      memberProfiles {
        id
        username
        firstName
        lastName
        email
      }
      memberOrganizations {
        id
        name
      }
    }
  }
`;

// Do not request DateTime fields on custom mutation responses — Keystone
// double-resolves them and throws "unexpected value provided to DateTime scalar".
const NETWORK_INVITE_MUTATION_FIELDS = `
  id
  direction
  status
  email
  token
  classNetwork {
    id
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
`;

export const REQUEST_CLASS_NETWORK_MEMBERSHIP = gql`
  mutation REQUEST_CLASS_NETWORK_MEMBERSHIP($networkId: ID!) {
    requestClassNetworkMembership(networkId: $networkId) {
      ${NETWORK_INVITE_MUTATION_FIELDS}
    }
  }
`;

export const JOIN_OPEN_CLASS_NETWORK = gql`
  mutation JOIN_OPEN_CLASS_NETWORK($networkId: ID!) {
    joinOpenClassNetwork(networkId: $networkId) {
      id
      title
      memberProfiles {
        id
      }
    }
  }
`;

export const LEAVE_CLASS_NETWORK = gql`
  mutation LEAVE_CLASS_NETWORK($networkId: ID!) {
    leaveClassNetwork(networkId: $networkId) {
      id
      title
      memberProfiles {
        id
      }
    }
  }
`;

export const INVITE_PROFILE_TO_CLASS_NETWORK = gql`
  mutation INVITE_PROFILE_TO_CLASS_NETWORK(
    $networkId: ID!
    $profileId: ID
    $email: String
  ) {
    inviteProfileToClassNetwork(
      networkId: $networkId
      profileId: $profileId
      email: $email
    ) {
      ${NETWORK_INVITE_MUTATION_FIELDS}
    }
  }
`;

export const APPROVE_NETWORK_INVITE = gql`
  mutation APPROVE_NETWORK_INVITE($inviteId: ID!) {
    approveNetworkInvite(inviteId: $inviteId) {
      ${NETWORK_INVITE_MUTATION_FIELDS}
    }
  }
`;

export const REJECT_NETWORK_INVITE = gql`
  mutation REJECT_NETWORK_INVITE($inviteId: ID!) {
    rejectNetworkInvite(inviteId: $inviteId) {
      ${NETWORK_INVITE_MUTATION_FIELDS}
    }
  }
`;

export const ACCEPT_NETWORK_INVITE = gql`
  mutation ACCEPT_NETWORK_INVITE($inviteId: ID, $token: String) {
    acceptNetworkInvite(inviteId: $inviteId, token: $token) {
      ${NETWORK_INVITE_MUTATION_FIELDS}
    }
  }
`;

export const DECLINE_NETWORK_INVITE = gql`
  mutation DECLINE_NETWORK_INVITE($inviteId: ID, $token: String) {
    declineNetworkInvite(inviteId: $inviteId, token: $token) {
      ${NETWORK_INVITE_MUTATION_FIELDS}
    }
  }
`;

export const CANCEL_NETWORK_INVITE = gql`
  mutation CANCEL_NETWORK_INVITE($inviteId: ID!) {
    cancelNetworkInvite(inviteId: $inviteId) {
      ${NETWORK_INVITE_MUTATION_FIELDS}
    }
  }
`;
