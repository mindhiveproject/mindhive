import gql from "graphql-tag";

export const STUDY_SUMMARY_RESULTS = gql`
  query STUDY_SUMMARY_RESULTS($studyId: ID!) {
    study(where: { id: $studyId }) {
      id
      slug
      flow
      summaryResults {
        id
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

// export const STUDY_SUMMARY_RESULTS = gql`
//   query STUDY_SUMMARY_RESULTS($studyId: ID!) {
//     summaryResults(where: { study: { id: { equals: $studyId } } }) {
//       id
//       testVersion
//       type
//       user {
//         id
//         publicReadableId
//       }
//       guest {
//         id
//         publicId
//         publicReadableId
//       }
//       study {
//         id
//         title
//       }
//       task {
//         id
//         title
//       }
//       data
//       createdAt
//       updatedAt
//     }
//   }
// `;
