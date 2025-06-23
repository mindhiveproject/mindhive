import gql from "graphql-tag";

// update workspace
export const UPDATE_WORKSPACE = gql`
  mutation UPDATE_WORKSPACE($id: ID!, $input: VizChapterUpdateInput!) {
    updateVizChapter(where: { id: $id }, data: $input) {
      id
    }
  }
`;
