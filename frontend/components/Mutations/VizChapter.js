import gql from "graphql-tag";

// add a chapter to the journal
export const ADD_VIZCHAPTER = gql`
  mutation ADD_VIZCHAPTER($input: VizChapterCreateInput!) {
    createVizChapter(data: $input) {
      id
    }
  }
`;

// update viz chapter
export const UPDATE_VIZCHAPTER = gql`
  mutation UPDATE_VIZCHAPTER($id: ID!, $input: VizChapterUpdateInput!) {
    updateVizChapter(where: { id: $id }, data: $input) {
      id
    }
  }
`;

// delete viz chapter
export const DELETE_VIZCHAPTER = gql`
  mutation DELETE_VIZCHAPTER($id: ID!) {
    deleteVizChapter(where: { id: $id }) {
      id
    }
  }
`;
