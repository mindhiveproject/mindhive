import gql from "graphql-tag";

// create new journal
export const CREATE_VIZJOURNAL = gql`
  mutation CREATE_VIZJOURNAL($input: VizJournalCreateInput!) {
    createVizJournal(data: $input) {
      id
    }
  }
`;
