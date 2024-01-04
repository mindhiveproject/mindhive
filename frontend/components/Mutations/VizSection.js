import gql from "graphql-tag";

// create new section
export const CREATE_VIZSECTION = gql`
  mutation CREATE_VIZSECTION($input: VizSectionCreateInput!) {
    createVizSection(data: $input) {
      id
    }
  }
`;

// edit viz section
export const UPDATE_VIZSECTION = gql`
  mutation UPDATE_VIZSECTION($id: ID!, $input: VizSectionUpdateInput!) {
    updateVizSection(where: { id: $id }, data: $input) {
      id
    }
  }
`;

// delete viz section
export const DELETE_VIZSECTION = gql`
  mutation DELETE_VIZSECTION($id: ID!) {
    deleteVizSection(where: { id: $id }) {
      id
    }
  }
`;
