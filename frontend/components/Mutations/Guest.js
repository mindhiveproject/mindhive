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

// update guest study information (custom mutation: guests have no session,
// so they are identified by their publicId)
export const UPDATE_GUEST_STUDY_INFO = gql`
  mutation UPDATE_GUEST_STUDY_INFO($publicId: String!, $studiesInfo: JSON!) {
    updateGuestStudiesInfo(publicId: $publicId, studiesInfo: $studiesInfo) {
      id
    }
  }
`;