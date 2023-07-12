import gql from "graphql-tag";

// to get a review (if there is any)
export const GET_REVIEW = gql`
  query GET_REVIEW($proposalId: ID, $authorId: ID, $stage: String) {
    reviews(
      where: {
        proposal: { id: { equals: $proposalId } }
        author: { id: { equals: $authorId } }
        stage: { equals: $stage }
      }
    ) {
      id
      stage
      settings
      content
    }
  }
`;
