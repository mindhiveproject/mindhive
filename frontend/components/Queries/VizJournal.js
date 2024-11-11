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
          settings
          content
          position
          createdAt
          vizChapters {
            id
            title
            description
            isTemplate
            position
            createdAt
            vizSections {
              id
              title
              description
              type
              content
              position
              createdAt
            }
          }
        }
      }
    }
  }
`;
