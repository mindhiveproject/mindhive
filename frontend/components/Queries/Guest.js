import gql from "graphql-tag";

// get the guest account by public id
export const GET_GUEST = gql`
  query GET_GUEST($publicId: String!) {
    guest(where: { publicId: $publicId }) {
      id
      publicId
      type
      studiesInfo
      participantIn {
        id
      }
      createdAt
      updatedAt
    }
  }
`;