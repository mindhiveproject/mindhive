import gql from "graphql-tag";

// to get a review (if there is any)
export const GET_REVIEW = gql`
  query GET_REVIEW($projectId: ID, $authorId: ID, $stage: String) {
    reviews(
      where: {
        proposal: { id: { equals: $projectId } }
        author: { id: { equals: $authorId } }
        stage: { equals: $stage }
      }
    ) {
      id
      stage
      settings
      content
      createdAt
      updatedAt
    }
  }
`;
