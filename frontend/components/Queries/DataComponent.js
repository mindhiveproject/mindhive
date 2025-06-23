import gql from "graphql-tag";

// get data component
export const GET_COMPONENT = gql`
  query GET_COMPONENT($id: ID!) {
    vizSection(where: { id: $id }) {
      id
      title
      description
      type
      content
      settings
      createdAt
      updatedAt
    }
  }
`;
