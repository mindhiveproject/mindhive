import gql from "graphql-tag";

// add a chapter to the journal
export const ADD_VIZCHAPTER = gql`
  mutation ADD_VIZCHAPTER($input: VizChapterCreateInput!) {
    createVizChapter(data: $input) {
      id
    }
  }
`;
