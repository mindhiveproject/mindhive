import gql from "graphql-tag";

// query the study viz journal via a study ID
export const STUDY_VIZJOURNAL = gql`
  query STUDY_VIZJOURNAL($id: ID!) {
    study(where: { id: $id }) {
      id
      vizJournals {
        id
        vizParts {
          id
          dataOrigin
          vizChapters {
            id
            title
            description
            vizSections {
              id
              title
              type
              content
            }
          }
        }
      }
    }
  }
`;
