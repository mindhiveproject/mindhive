import gql from "graphql-tag";

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
