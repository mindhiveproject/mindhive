import gql from "graphql-tag";

// get all updates for admin
export const GET_UPDATES = gql`
  query GET_UPDATES($updateArea: String!) {
    updates(where: { updateArea: { equals: $updateArea } }) {
      id
      link
      content
      user {
        username
      }
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_FIELDS = `
  id
  updateArea
  link
  content
  hasOpen
  isArchived
  createdAt
  updatedAt
`;

// get user updates (active / not archived)
export const GET_MY_UPDATES = gql`
  query GET_MY_UPDATES($id: ID!) {
    updates(
      where: {
        user: { id: { equals: $id } }
        isArchived: { equals: false }
      }
      orderBy: [{ createdAt: desc }]
    ) {
      ${UPDATE_FIELDS}
    }
  }
`;

// get archived updates for the Archive modal
export const GET_MY_ARCHIVED_UPDATES = gql`
  query GET_MY_ARCHIVED_UPDATES($id: ID!) {
    updates(
      where: {
        user: { id: { equals: $id } }
        isArchived: { equals: true }
      }
      orderBy: [{ createdAt: desc }]
    ) {
      ${UPDATE_FIELDS}
    }
  }
`;

// count the number of not read updates (exclude archived)
export const COUNT_NEW_UPDATES = gql`
  query COUNT_NEW_UPDATES($id: ID!) {
    updates(
      where: {
        user: { id: { equals: $id } }
        hasOpen: { equals: false }
        isArchived: { equals: false }
      }
    ) {
      id
    }
  }
`;

// get specific update
export const GET_UPDATE = gql`
  query GET_UPDATE($id: ID!) {
    update(where: { id: $id }) {
      id
      link
      content
      user {
        username
      }
      hasOpen
      isArchived
      createdAt
      updatedAt
    }
  }
`;
