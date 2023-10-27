import gql from "graphql-tag";

// create new template
export const CREATE_TEMPLATE = gql`
  mutation CREATE_TEMPLATE(
    $title: String!
    $description: String
    $style: String
    $parameters: JSON
    $collaborators: [ProfileWhereUniqueInput!]
    $fileAddress: String
    $scriptAddress: String
  ) {
    createTemplate(
      data: {
        title: $title
        description: $description
        style: $style
        parameters: $parameters
        collaborators: { connect: $collaborators }
        fileAddress: $fileAddress
        scriptAddress: $scriptAddress
      }
    ) {
      id
      slug
      collaborators {
        id
      }
    }
  }
`;

// update template
export const UPDATE_TEMPLATE = gql`
  mutation UPDATE_TEMPLATE(
    $id: ID!
    $title: String
    $description: String
    $style: String
    $parameters: JSON
    $collaborators: [ProfileWhereUniqueInput!]
    $fileAddress: String
    $scriptAddress: String
  ) {
    updateTemplate(
      where: { id: $id }
      data: {
        title: $title
        description: $description
        style: $style
        parameters: $parameters
        collaborators: { set: $collaborators }
        fileAddress: $fileAddress
        scriptAddress: $scriptAddress
      }
    ) {
      id
      title
      description
    }
  }
`;
