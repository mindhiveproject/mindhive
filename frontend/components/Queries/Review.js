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

// Feedback Center: the class fields that pick which review form a milestone
// resolves to (curriculum type + network scope).
export const CLASS_REVIEW_FORM_SCOPE = gql`
  query CLASS_REVIEW_FORM_SCOPE($classId: ID!) {
    class(where: { id: $classId }) {
      id
      settings
      networks {
        id
      }
    }
  }
`;

// Feedback Center: a class's reviews for one milestone stage, read for the
// task & survey suggestions mentors made (taskSelector answers).
export const CLASS_REVIEW_TASK_SUGGESTIONS = gql`
  query CLASS_REVIEW_TASK_SUGGESTIONS($classId: ID!, $stages: [String!]) {
    reviews(
      where: {
        proposal: { usedInClass: { id: { equals: $classId } } }
        stage: { in: $stages }
      }
    ) {
      id
      stage
      content
      proposal {
        id
      }
    }
  }
`;
