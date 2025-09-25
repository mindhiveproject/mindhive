import gql from "graphql-tag";

// query the data journals based on the study and project IDs
export const GET_DATA_JOURNALS = gql`
  query GET_DATA_JOURNALS($where: VizJournalWhereInput) {
    vizJournals(where: $where) {
      id
      vizParts {
        id
        title
        datasources {
          id
          dataOrigin
        }
        updatedAt
      }
    }
  }
`;
