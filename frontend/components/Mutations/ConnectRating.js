import gql from "graphql-tag";

export const CREATE_RATING = gql`
  mutation CREATE_RATING($input: ConnectRatingCreateInput!) {
    createConnectRating(data: $input) {
      id
      opportunityRating
    }
  }
`;

export const UPDATE_RATING = gql`
  mutation UPDATE_RATING($id: ID!, $input: ConnectRatingUpdateInput!) {
    updateConnectRating(where: { id: $id }, data: $input) {
      id
      opportunityRating
    }
  }
`;

export const DELETE_RATING = gql`
  mutation DELETE_RATING($id: ID!) {
    deleteConnectRating(where: { id: $id }) {
      id
    }
  }
`;
