import gql from "graphql-tag";

// to get a review (if there is any)
export const GET_REVIEW = gql`
  query GET_REVIEW($studyId: ID, $authorId: ID, $stage: String) {
    reviews(
      where: {
        study: { id: { equals: $studyId } }
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
