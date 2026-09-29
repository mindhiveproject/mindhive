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
  mutation UPDATE_REVIEW(
    $id: ID!
    $settings: JSON
    $content: JSON
    $updatedAt: DateTime
  ) {
    updateReview(
      where: { id: $id }
      data: { settings: $settings, content: $content, updatedAt: $updatedAt }
    ) {
      id
    }
  }
`;

// edit review
// upvote (or remove an upvote from) someone's review as the current user;
// reviews themselves are only editable by their author
export const TOGGLE_REVIEW_UPVOTE = gql`
  mutation TOGGLE_REVIEW_UPVOTE($id: ID!, $upvote: Boolean!) {
    toggleReviewUpvote(reviewId: $id, upvote: $upvote) {
      id
    }
  }
`;
