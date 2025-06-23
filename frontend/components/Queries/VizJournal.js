import gql from "graphql-tag";

// query the journals based on the study and project IDs
export const GET_VIZJOURNALS = gql`
  query GET_VIZJOURNALS($where: VizJournalWhereInput) {
    vizJournals(where: $where) {
      id
      study {
        id
      }
      project {
        id
      }
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
        updatedAt
        vizChapters {
          id
          title
          description
          isTemplate
          position
          createdAt
          layout
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
`;

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
          updatedAt
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
