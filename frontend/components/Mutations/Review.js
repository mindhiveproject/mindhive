import gql from "graphql-tag";

// create new review
export const CREATE_REVIEW = gql`
  mutation CREATE_REVIEW($input: ReviewCreateInput!) {
    createReview(data: $input) {
      id
    }
  }
`;

// update existing review
export const UPDATE_REVIEW = gql`
  mutation UPDATE_REVIEW($id: ID!, $settings: JSON, $content: JSON) {
    updateReview(
      where: { id: $id }
      data: { settings: $settings, content: $content }
    ) {
      id
    }
  }
`;

// edit review
export const EDIT_REVIEW = gql`
  mutation EDIT_REVIEW($id: ID!, $input: ReviewUpdateInput!) {
    updateReview(where: { id: $id }, data: $input) {
      id
    }
  }
`;
