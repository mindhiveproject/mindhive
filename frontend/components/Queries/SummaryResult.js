import gql from "graphql-tag";

export const STUDY_SUMMARY_RESULTS = gql`
  query STUDY_SUMMARY_RESULTS($studyId: ID!) {
    study(where: { id: $studyId }) {
      id
      slug
      flow
      datasets {
        id
        token
        isIncluded
      }
      summaryResults {
        id
        metadataId
        testVersion
        type
        user {
          id
          publicReadableId
          studentIn {
            code
          }
        }
        guest {
          id
          publicId
          publicReadableId
        }
        study {
          id
          title
        }
        task {
          id
          title
        }
        data
        createdAt
        updatedAt
      }
    }
  }
`;
