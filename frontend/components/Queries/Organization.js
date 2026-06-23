import gql from "graphql-tag";

// Lean "all orgs" query for admin pickers (e.g. scope=organization
// in the form-definition editor). Just id + name — no nested members
// or opportunities.
export const ALL_ORGANIZATIONS_LITE = gql`
  query ALL_ORGANIZATIONS_LITE {
    organizations(orderBy: { name: asc }) {
      id
      name
    }
  }
`;

// Pending invites for a specific organization. Used by the Members section
// to show "Sent invites" with revoke buttons.
export const PENDING_INVITES_FOR_ORG = gql`
  query PENDING_INVITES_FOR_ORG($organizationId: ID!) {
    organizationInvites(
      where: {
        organization: { id: { equals: $organizationId } }
        status: { equals: "pending" }
      }
      orderBy: { createdAt: desc }
    ) {
      id
      email
      createdAt
      invitedBy {
        id
        username
        firstName
        lastName
      }
    }
  }
`;

// Resolve an invite token from a URL (?invite=…) to the invite + org. Used
// by the signup page to show context (which org you're joining) and by the
// post-signup handler to mark the right invite as accepted.
export const GET_INVITE_BY_TOKEN = gql`
  query GET_INVITE_BY_TOKEN($token: String!) {
    organizationInvites(where: { token: { equals: $token } }, take: 1) {
      id
      email
      status
      organization {
        id
        name
      }
      invitedBy {
        username
        firstName
        lastName
      }
    }
  }
`;

// Pending invites addressed to the currently logged-in user's email. Called
// after signup to auto-attach the new user to any organizations that
// invited them.
export const MY_PENDING_INVITES = gql`
  query MY_PENDING_INVITES($email: String!) {
    organizationInvites(
      where: {
        email: { equals: $email }
        status: { equals: "pending" }
      }
    ) {
      id
      organization {
        id
        name
      }
    }
  }
`;

// Look up a Profile by email so members can be invited / added by email
// from the org Members section. Returns 0 or 1 profiles.
export const FIND_PROFILE_BY_EMAIL = gql`
  query FIND_PROFILE_BY_EMAIL($email: String!) {
    profiles(where: { email: { equals: $email } }, take: 1) {
      id
      username
      firstName
      lastName
      email
    }
  }
`;

// Resolve an org the current user may edit before create (avoids unique-name errors
// when membership/createdBy links are missing from the profile cache).
export const FIND_ORG_FOR_PROFILE_SAVE = gql`
  query FIND_ORG_FOR_PROFILE_SAVE($name: String!, $profileId: ID!) {
    organizations(
      where: {
        name: { equals: $name }
        OR: [
          { members: { some: { id: { equals: $profileId } } } }
          { createdBy: { id: { equals: $profileId } } }
        ]
      }
      take: 1
    ) {
      id
      name
    }
  }
`;

export const GET_MY_ORGANIZATION = gql`
  query GET_MY_ORGANIZATION {
    authenticatedItem {
      ... on Profile {
        id
        profileType
        organizations {
          id
          name
          tagline
          department
          website
          location
          mission
          primaryDomain
          verified
          logo {
            url
          }
          interests {
            id
          }
        }
      }
    }
  }
`;

// Server-paginated list of organizations for the Connect "Organizations"
// browse page. The frontend builds a `where` clause for search.
export const EXPLORE_ORGANIZATIONS_PAGED = gql`
  query EXPLORE_ORGANIZATIONS_PAGED(
    $where: OrganizationWhereInput!
    $take: Int!
    $skip: Int!
  ) {
    organizations(
      where: $where
      take: $take
      skip: $skip
      orderBy: { name: asc }
    ) {
      id
      name
      tagline
      department
      location
      mission
      primaryDomain
      verified
      logo {
        url
      }
      opportunitiesCount(
        where: { status: { equals: "published" } }
      )
    }
    organizationsCount(where: $where)
  }
`;

// Full detail for one organization (browse page → click an org).
export const EXPLORE_ORGANIZATION_DETAIL = gql`
  query EXPLORE_ORGANIZATION_DETAIL($id: ID!) {
    organization(where: { id: $id }) {
      id
      name
      tagline
      department
      website
      location
      mission
      primaryDomain
      verified
      logo {
        url
      }
      interests {
        id
        title
      }
      members {
        id
        username
        firstName
        lastName
        publicReadableId
        tagline
        image {
          keystoneImage {
            url
          }
          image {
            publicUrlTransformed
          }
        }
      }
      opportunities(
        where: { status: { equals: "published" } }
        orderBy: { createdAt: desc }
      ) {
        id
        title
        shortDescription
        teamSize
        studentCapacity
        availableFrom
        availableTo
        coverImageUrl
        coverImage {
          url
        }
        publicRatingAverage
        publicRatingCount
      }
    }
  }
`;

export const GET_ORGANIZATION = gql`
  query GET_ORGANIZATION($id: ID!) {
    organization(where: { id: $id }) {
      id
      name
      tagline
      department
      website
      location
      mission
      primaryDomain
      verified
      logo {
        url
      }
      interests {
        id
      }
      members {
        id
        username
        firstName
        lastName
      }
    }
  }
`;
