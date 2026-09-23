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
      dataSourceRecords {
        profile {
          publicId
        }
        guest {
          publicId
        }
        steps
      }
      summaryResults {
        id
        metadataId
        testVersion
        type
        user {
          id
          publicId
          publicReadableId
          studiesInfo
          studentIn {
            code
          }
        }
        guest {
          id
          publicId
          publicReadableId
          studiesInfo
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
