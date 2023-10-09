import gql from "graphql-tag";

// create new consent
export const CREATE_CONSENT = gql`
  mutation CREATE_CONSENT($input: ConsentCreateInput!) {
    createConsent(data: $input) {
      id
    }
  }
`;

// export const CREATE_CONSENT = gql`
//   mutation CREATE_CONSENT(
//     $title: String!
//     $description: String
//     $info: JSON
//     $collaborators: [ProfileWhereUniqueInput!]
//   ) {
//     createConsent(
//       data: {
//         title: $title
//         description: $description
//         info: $info
//         collaborators: { connect: $collaborators }
//       }
//     ) {
//       id
//     }
//   }
// `;

// edit consent
export const EDIT_CONSENT = gql`
  mutation EDIT_CONSENT(
    $id: ID!
    $title: String
    $description: String
    $info: JSON
    $collaborators: [ProfileWhereUniqueInput!]
  ) {
    updateConsent(
      where: { id: $id }
      data: {
        title: $title
        description: $description
        info: $info
        collaborators: { set: $collaborators }
      }
    ) {
      id
    }
  }
`;

// delete consent
export const DELETE_CONSENT = gql`
  mutation DELETE_CONSENT($id: ID!) {
    deleteConsent(where: { id: $id }) {
      id
    }
  }
`;
