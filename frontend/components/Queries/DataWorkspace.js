import gql from "graphql-tag";

// get data journal
export const GET_WORKSPACE = gql`
  query GET_WORKSPACE($id: ID!) {
    vizChapter(where: { id: $id }) {
      id
      title
      description
      settings
      content
      layout
      vizSections {
        id
        type
        content
      }
    }
  }
`;
