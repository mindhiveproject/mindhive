import gql from "graphql-tag";

// query the data journals based on the study and project IDs
export const GET_DATASOURCES = gql`
  query GET_DATASOURCES($where: DatasourceWhereInput) {
    datasources(where: $where) {
      id
      title
      dataOrigin
      content
      author {
        username
      }
      updatedAt
    }
  }
`;

// Query to get detailed datasource content
export const GET_DATASOURCE_CONTENT = gql`
  query GET_DATASOURCE_CONTENT($id: ID!) {
    datasource(where: { id: $id }) {
      id
      title
      dataOrigin
      content
      settings
      updatedAt
    }
  }
`;
