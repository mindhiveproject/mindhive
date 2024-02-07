import gql from "graphql-tag";

// add a part to the journal
export const ADD_VIZPART = gql`
  mutation ADD_VIZPART($input: VizPartCreateInput!) {
    createVizPart(data: $input) {
      id
    }
  }
`;

// delete viz part
export const DELETE_VIZPART = gql`
  mutation DELETE_VIZPART($id: ID!) {
    deleteVizPart(where: { id: $id }) {
      id
    }
  }
`;
