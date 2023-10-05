import gql from "graphql-tag";

// create a guest account
export const CREATE_GUEST = gql`
  mutation CREATE_GUEST($input: GuestCreateInput!) {
    createGuest(data: $input) {
      id
      publicId
    }
  }
`;

// update guest study information
export const UPDATE_GUEST_STUDY_INFO = gql`
  mutation UPDATE_GUEST_STUDY_INFO($id: ID!, $studiesInfo: JSON) {
    updateGuest(where: { id: $id }, data: { studiesInfo: $studiesInfo }) {
      id
    }
  }
`;