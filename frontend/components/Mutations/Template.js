import gql from "graphql-tag";

// create new template
export const CREATE_TEMPLATE = gql`
  mutation CREATE_TEMPLATE(
    $title: String!
    $description: String
    $script: String
    $style: String
    $parameters: JSON
    $file: String
    $collaborators: [ProfileWhereUniqueInput!]
  ) {
    createTemplate(
      data: {
        title: $title
        description: $description
        script: $script
        style: $style
        parameters: $parameters
        file: $file
        collaborators: { connect: $collaborators }
      }
    ) {
      id
    }
  }
`;

// update template
export const UPDATE_TEMPLATE = gql`
  mutation UPDATE_TEMPLATE(
    $id: ID!
    $title: String
    $description: String
    $script: String
    $style: String
    $parameters: JSON
    $file: String
    $collaborators: [ProfileWhereUniqueInput!]
  ) {
    updateTemplate(
      where: { id: $id }
      data: {
        title: $title
        description: $description
        script: $script
        style: $style
        parameters: $parameters
        file: $file
        collaborators: { set: $collaborators }
      }
    ) {
      id
      title
      description
    }
  }
`;
