import gql from "graphql-tag";

// Mutation to create a new datasource
export const CREATE_DATASOURCE = gql`
  mutation CREATE_DATASOURCE($data: DatasourceCreateInput!) {
    createDatasource(data: $data) {
      id
      title
      dataOrigin
    }
  }
`;

// Mutation to update a datasource
export const UPDATE_DATASOURCE = gql`
  mutation UPDATE_DATASOURCE($id: ID!, $data: DatasourceUpdateInput!) {
    updateDatasource(where: { id: $id }, data: $data) {
      id
      title
    }
  }
`;

// Mutation to delete a datasource
export const DELETE_DATASOURCE = gql`
  mutation DELETE_DATASOURCE($id: ID!) {
    deleteDatasource(where: { id: $id }) {
      id
    }
  }
`;
