import gql from "graphql-tag";

// get data journal
export const GET_DATA_JOURNAL = gql`
  query GET_DATA_JOURNAL($id: ID!) {
    vizPart(where: { id: $id }) {
      id
      vizChapters {
        id
        title
      }
    }
  }
`;

// title
// description
// dataOrigin
// isTemplate
// settings
// content
// vizChapters {
//   id
//   title
//   description
//   vizSections {
//     id
//     title
//     description
//     type
//     content
//   }
// }
// createdAt
// updatedAt
