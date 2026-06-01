import gql from "graphql-tag";

export const CREATE_OPPORTUNITY = gql`
  mutation CREATE_OPPORTUNITY($input: OpportunityCreateInput!) {
    createOpportunity(data: $input) {
      id
      title
      status
    }
  }
`;

export const UPDATE_OPPORTUNITY = gql`
  mutation UPDATE_OPPORTUNITY($id: ID!, $input: OpportunityUpdateInput!) {
    updateOpportunity(where: { id: $id }, data: $input) {
      id
      title
      status
      coverImage {
        url
      }
      videoFile {
        url
      }
    }
  }
`;

export const DELETE_OPPORTUNITY = gql`
  mutation DELETE_OPPORTUNITY($id: ID!) {
    deleteOpportunity(where: { id: $id }) {
      id
    }
  }
`;

// Connect / disconnect an opportunity from the current user's favorites.
// We update Profile.favoriteOpportunities directly rather than adding a custom
// mutation — the existing Keystone update mutation handles it cleanly.
export const TOGGLE_FAVORITE_OPPORTUNITY = gql`
  mutation TOGGLE_FAVORITE_OPPORTUNITY(
    $profileId: ID!
    $input: ProfileUpdateInput!
  ) {
    updateProfile(where: { id: $profileId }, data: $input) {
      id
      favoriteOpportunities {
        id
      }
    }
  }
`;
