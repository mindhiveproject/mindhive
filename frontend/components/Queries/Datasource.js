import gql from "graphql-tag";

// query the data journals based on the study and project IDs
export const GET_DATASOURCES = gql`
  query GET_DATASOURCES($where: DatasourceWhereInput) {
    datasources(where: $where, orderBy: [{ updatedAt: desc }]) {
      id
      title
      dataOrigin
      content
      collaboratorsCanEdit
      author {
        id
        username
      }
      collaborators {
        id
        username
      }
      project {
        id
        usedInClass {
          id
        }
        templateForClasses {
          id
        }
      }
      study {
        id
        classes {
          id
        }
      }
      journal {
        id
        isPublic
        isTemplate
      }
      createdAt
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
      collaboratorsCanEdit
      author {
        id
        username
      }
      collaborators {
        id
        username
      }
      journal {
        id
        isPublic
        isTemplate
      }
      createdAt
      updatedAt
    }
  }
`;
