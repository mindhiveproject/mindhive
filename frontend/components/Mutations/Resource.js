import gql from "graphql-tag";

/** Default Resource settings; matches Keystone schema defaultValue. */
export const DEFAULT_RESOURCE_SETTINGS = {
  publishedToAssociatedClass: false,
};

/**
 * Merges partial settings with defaults so publishedToAssociatedClass is always present.
 * Use when reading or sending Resource.settings to respect the schema default.
 */
export function mergeResourceSettings(settings) {
  return {
    ...DEFAULT_RESOURCE_SETTINGS,
    ...(settings && typeof settings === "object" ? settings : {}),
  };
}

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
    $collaborators: ProfileRelateToManyForUpdateInput
    $classes: ClassRelateToManyForUpdateInput
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
        collaborators: $collaborators
        classes: $classes
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

// set resource's linked template cards (multi-card); propagates to student boards
export const SET_RESOURCE_TEMPLATE_CARDS = gql`
  mutation SET_RESOURCE_TEMPLATE_CARDS(
    $resourceId: ID!
    $templateCardIds: [ID!]!
    $classId: ID!
  ) {
    setResourceTemplateCards(
      resourceId: $resourceId
      templateCardIds: $templateCardIds
      classId: $classId
    ) {
      id
    }
  }
`;
