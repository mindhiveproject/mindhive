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

// get user updates
export const GET_MY_UPDATES = gql`
  query GET_MY_UPDATES($id: ID!) {
    updates(where: { user: { id: { equals: $id } } }) {
      id
      updateArea
      link
      content
      hasOpen
      createdAt
      updatedAt
    }
  }
`;

// count the number of not read updates
export const COUNT_NEW_UPDATES = gql`
  query COUNT_NEW_UPDATES($id: ID!) {
    updates(
      where: { user: { id: { equals: $id } }, hasOpen: { equals: false } }
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
      createdAt
      updatedAt
    }
  }
`;
