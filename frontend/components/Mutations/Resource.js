import gql from "graphql-tag";

// create new resource
export const CREATE_RESOURCE = gql`
  mutation CREATE_RESOURCE($input: ResourceCreateInput!) {
    createResource(data: $input) {
      id
    }
  }
`;

// update a resource
export const UPDATE_RESOURCE = gql`
  mutation UPDATE_RESOURCE(
    $id: ID!
    $title: String
    $description: String
    $content: JSON
    $settings: JSON
    $isPublic: Boolean
    $updatedAt: DateTime
  ) {
    updateResource(
      where: { id: $id }
      data: {
        title: $title
        description: $description
        content: $content
        settings: $settings
        isPublic: $isPublic
        updatedAt: $updatedAt
      }
    ) {
      id
    }
  }
`;

// delete resource
export const DELETE_RESOURCE = gql`
  mutation DELETE_RESOURCE($id: ID!) {
    deleteResource(where: { id: $id }) {
      id
    }
  }
`;
