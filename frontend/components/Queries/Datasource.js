import gql from "graphql-tag";

// Fields a dataset card and the dataset pickers need. Kept small on purpose:
// every to-many relation here costs one query per row on the server, and
// `content` (simulated datasets keep their whole table in it) is loaded only
// when a dataset is opened (GET_DATASOURCE_DETAIL).
const DATASOURCE_LIST_FIELDS = gql`
  fragment DatasourceListFields on Datasource {
    id
    title
    dataOrigin
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
    }
    study {
      id
    }
    isPublic
    sharedWithTeam
    isCopy
    sharedWithClasses {
      id
    }
    journal {
      id
      isPublic
      isTemplate
    }
    createdAt
    updatedAt
  }
`;

// One page of the datasets the user may read, newest first, plus the total
// (see frontend/components/Builder/Project/DataJournal/Hooks/usePagedDatasources.js).
export const GET_DATASOURCES = gql`
  query GET_DATASOURCES(
    $where: DatasourceWhereInput
    $take: Int
    $skip: Int! = 0
  ) {
    datasources(
      where: $where
      orderBy: [{ updatedAt: desc }, { createdAt: desc }]
      take: $take
      skip: $skip
    ) {
      ...DatasourceListFields
    }
    datasourcesCount(where: $where)
  }
  ${DATASOURCE_LIST_FIELDS}
`;

// One dataset with its content, for the dataset view.
export const GET_DATASOURCE_DETAIL = gql`
  query GET_DATASOURCE_DETAIL($id: ID!) {
    datasource(where: { id: $id }) {
      ...DatasourceListFields
      content
    }
  }
  ${DATASOURCE_LIST_FIELDS}
`;

// The classes a dataset is linked to through its study or project board, for
// ordering the share-with-class modal. Loaded only when the modal opens.
export const GET_DATASOURCE_LINKED_CLASSES = gql`
  query GET_DATASOURCE_LINKED_CLASSES($id: ID!) {
    datasource(where: { id: $id }) {
      id
      sharedWithClasses {
        id
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
      isPublic
      sharedWithTeam
      sharedWithClasses {
        id
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

// The people who may be added as collaborators on a dataset: its study's and
// board's team, without its author, as [{ id, username }]
// (keystone/lib/datasourceTeam.ts).
export const GET_DATASOURCE_COLLABORATOR_CANDIDATES = gql`
  query GET_DATASOURCE_COLLABORATOR_CANDIDATES($id: ID!) {
    datasourceCollaboratorCandidates(datasourceId: $id)
  }
`;
