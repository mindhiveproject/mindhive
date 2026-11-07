import gql from "graphql-tag";

// get the guest account by public id (guests have no session; the backend
// returns only what the run pages use, under the same shape as before)
export const GET_GUEST = gql`
  query GET_GUEST($publicId: String!) {
    guest: guestForRun(publicId: $publicId)
  }
`;