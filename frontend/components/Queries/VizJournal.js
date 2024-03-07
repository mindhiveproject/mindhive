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
          title
          description
          isTemplate
          dataOrigin
          content
          vizChapters {
            id
            title
            description
            isTemplate
            vizSections {
              id
              title
              description
              type
              content
            }
          }
        }
      }
    }
  }
`;
