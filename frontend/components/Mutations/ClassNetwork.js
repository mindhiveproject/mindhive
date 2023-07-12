import gql from "graphql-tag";

// create new network
export const CREATE_NETWORK = gql`
  mutation CREATE_NETWORK(
    $title: String!
    $description: String
    $settings: JSON
    $classes: [ClassWhereUniqueInput!]
  ) {
    createClassNetwork(
      data: {
        title: $title
        description: $description
        settings: $settings
        classes: { connect: $classes }
      }
    ) {
      id
    }
  }
`;

// update a network
export const UPDATE_NETWORK = gql`
  mutation UPDATE_NETWORK(
    $id: ID!
    $title: String
    $description: String
    $settings: JSON
    $classes: [ClassWhereUniqueInput!]
  ) {
    updateClassNetwork(
      where: { id: $id }
      data: {
        title: $title
        description: $description
        settings: $settings
        classes: { set: $classes }
      }
    ) {
      id
    }
  }
`;
