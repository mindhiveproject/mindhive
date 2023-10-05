import gql from "graphql-tag";

export const CREATE_SPEC = gql`
  mutation CREATE_SPEC(
    $title: String
    $description: String
    $settings: JSON
    $content: JSON
    $isPublic: Boolean
    $isTemplate: Boolean
    $isFeatured: Boolean
    $studyId: ID
  ) {
    createSpec(
      data: {
        title: $title
        description: $description
        settings: $settings
        content: $content
        isPublic: $isPublic
        isTemplate: $isTemplate
        isFeatured: $isFeatured
        studies: { connect: { id: $studyId } }
      }
    ) {
      id
    }
  }
`;

export const UPDATE_SPEC = gql`
  mutation UPDATE_SPEC(
    $id: ID!
    $title: String
    $description: String
    $settings: JSON
    $content: JSON
    $isPublic: Boolean
    $isTemplate: Boolean
    $isFeatured: Boolean
  ) {
    updateSpec(
      where: { id: $id }
      data: { 
        title: $title
        description: $description
        settings: $settings
        content: $content
        isPublic: $isPublic
        isTemplate: $isTemplate
        isFeatured: $isFeatured
      }
    ) {
      id
    }
  }
`;

// delete spec
export const DELETE_SPEC = gql`
  mutation DELETE_SPEC($id: ID!) {
    deleteSpec(where: { id: $id }) {
      id
    }
  }
`;