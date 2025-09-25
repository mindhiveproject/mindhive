import gql from "graphql-tag";

// get data journal
export const GET_DATA_JOURNAL = gql`
  query GET_DATA_JOURNAL($id: ID!) {
    vizPart(where: { id: $id }) {
      id
      title
      datasources {
        id
        dataOrigin
        study {
          id
        }
        content
        settings
      }
      vizChapters {
        id
        title
      }
      updatedAt
    }
  }
`;
