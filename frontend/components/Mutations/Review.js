import gql from "graphql-tag";

// create new review
export const CREATE_REVIEW = gql`
  mutation CREATE_REVIEW(
    $studyId: ID!
    $proposalId: ID!
    $stage: String
    $settings: JSON
    $content: JSON
  ) {
    createReview(
      data: {
        study: { connect: { id: $studyId } }
        proposal: { connect: { id: $proposalId } }
        stage: $stage
        settings: $settings
        content: $content
      }
    ) {
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
