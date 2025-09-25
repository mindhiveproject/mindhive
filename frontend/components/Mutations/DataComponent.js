import gql from "graphql-tag";

// add component
export const CREATE_DATA_COMPONENT = gql`
  mutation CREATE_DATA_COMPONENT($input: VizSectionCreateInput!) {
    createVizSection(data: $input) {
      id
    }
  }
`;

// edit component
export const UPDATE_DATA_COMPONENT = gql`
  mutation UPDATE_DATA_COMPONENT($id: ID!, $input: VizSectionUpdateInput!) {
    updateVizSection(where: { id: $id }, data: $input) {
      id
    }
  }
`;

// delete component
export const DELETE_DATA_COMPONENT = gql`
  mutation DELETE_DATA_COMPONENT($id: ID!) {
    deleteVizSection(where: { id: $id }) {
      id
    }
  }
`;
