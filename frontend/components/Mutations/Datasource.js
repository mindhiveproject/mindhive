import gql from "graphql-tag";

// Mutation to create a new datasource
export const CREATE_DATASOURCE = gql`
  mutation CREATE_DATASOURCE($data: DatasourceCreateInput!) {
    createDatasource(data: $data) {
      id
      title
      dataOrigin
      collaboratorsCanEdit
      collaborators {
        id
        username
      }
      createdAt
      updatedAt
    }
  }
`;

// Mutation to update a datasource
export const UPDATE_DATASOURCE = gql`
  mutation UPDATE_DATASOURCE($id: ID!, $data: DatasourceUpdateInput!) {
    updateDatasource(where: { id: $id }, data: $data) {
      id
      title
      createdAt
      updatedAt
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

// Share datasets with a class the caller teaches, or stop sharing them.
// Returns how many datasets changed (keystone/mutations/datasourceClassSharing.ts).
export const SET_DATASOURCE_CLASS_SHARING = gql`
  mutation SET_DATASOURCE_CLASS_SHARING(
    $datasourceIds: [ID!]!
    $classId: ID!
    $shared: Boolean!
  ) {
    setDatasourceClassSharing(
      datasourceIds: $datasourceIds
      classId: $classId
      shared: $shared
    )
  }
`;
