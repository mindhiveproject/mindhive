import gql from "graphql-tag";

// get a post
export const GET_POST = gql`
  query GET_POST($id: ID!) {
    post(where: { id: $id }) {
      id
      title
      content
    }
  }
`;
