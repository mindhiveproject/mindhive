import gql from "graphql-tag";

export const CREATE_ORGANIZATION = gql`
  mutation CREATE_ORGANIZATION($input: OrganizationCreateInput!) {
    createOrganization(data: $input) {
      id
      name
      members {
        id
      }
    }
  }
`;

export const UPDATE_ORGANIZATION = gql`
  mutation UPDATE_ORGANIZATION($id: ID!, $input: OrganizationUpdateInput!) {
    updateOrganization(where: { id: $id }, data: $input) {
      id
      name
    }
  }
`;

export const CREATE_ORG_INVITE = gql`
  mutation CREATE_ORG_INVITE($input: OrganizationInviteCreateInput!) {
    createOrganizationInvite(data: $input) {
      id
      email
      status
    }
  }
`;

export const REVOKE_ORG_INVITE = gql`
  mutation REVOKE_ORG_INVITE($id: ID!) {
    deleteOrganizationInvite(where: { id: $id }) {
      id
    }
  }
`;

export const ACCEPT_ORG_INVITE = gql`
  mutation ACCEPT_ORG_INVITE($id: ID!, $now: DateTime!) {
    updateOrganizationInvite(
      where: { id: $id }
      data: { status: "accepted", acceptedAt: $now }
    ) {
      id
    }
  }
`;
