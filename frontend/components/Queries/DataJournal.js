import gql from "graphql-tag";

// get data journal
export const GET_DATA_JOURNAL = gql`
  query GET_DATA_JOURNAL($id: ID!) {
    vizPart(where: { id: $id }) {
      id
      title
      datasources(orderBy: [{ updatedAt: desc }]) {
        id
        title
        dataOrigin
        study {
          id
        }
        content
        settings
        createdAt
        updatedAt
      }
      vizChapters {
        id
        title
        vizSections {
          id
        }
      }
      createdAt
      updatedAt
    }
  }
`;
