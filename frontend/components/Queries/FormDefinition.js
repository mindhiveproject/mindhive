import { gql } from "@apollo/client";

// Resolve the most-specific published FormDefinition for a given key.
// The backend chooses class_network > organization > global, returning
// the highest-version published row at the winning scope. Cards and
// nested fields are ordered by their `order` column at the GraphQL layer.
export const RESOLVE_FORM_DEFINITION = gql`
  query RESOLVE_FORM_DEFINITION(
    $key: String!
    $organizationId: ID
    $classNetworkId: ID
  ) {
    resolveFormDefinition(
      key: $key
      organizationId: $organizationId
      classNetworkId: $classNetworkId
    ) {
      id
      key
      title
      description
      scope
      status
      version
      organization {
        id
      }
      classNetwork {
        id
      }
      cards(orderBy: { order: asc }) {
        id
        cardType
        title
        titleI18n
        description
        descriptionI18n
        visibleWhenStatus
        roleVisibility
        order
        fields(orderBy: { order: asc }) {
          id
          name
          fieldType
          label
          labelI18n
          helperText
          helperTextI18n
          placeholder
          placeholderI18n
          isRequired
          order
          storage
          storageColumn
          storageBucket
          storageEntity
          options
          validation
          defaultValue
          showWhen
          jsonArraySchema
          visibilityRoles
        }
      }
    }
  }
`;

// Admin list — used by the admin UI (phase 6).
export const ADMIN_FORM_DEFINITIONS = gql`
  query ADMIN_FORM_DEFINITIONS {
    formDefinitions(orderBy: [{ key: asc }, { version: desc }]) {
      id
      key
      title
      scope
      status
      version
      organization {
        id
        name
      }
      classNetwork {
        id
        title
      }
      publishedAt
      createdBy {
        id
        username
      }
      updatedAt
    }
  }
`;

// All FormDefinition rows sharing a key (across all scopes / versions /
// statuses). Used by the version-history panel inside the editor.
export const SIBLING_FORM_DEFINITIONS = gql`
  query SIBLING_FORM_DEFINITIONS($key: String!) {
    formDefinitions(
      where: { key: { equals: $key } }
      orderBy: [{ version: desc }]
    ) {
      id
      version
      status
      scope
      title
      publishedAt
      changelog
      organization {
        id
      }
      classNetwork {
        id
      }
      publishedBy {
        id
        username
      }
      createdBy {
        id
        username
      }
      updatedAt
    }
  }
`;

// Admin editor — single definition with full nesting.
export const ADMIN_FORM_DEFINITION = gql`
  query ADMIN_FORM_DEFINITION($id: ID!) {
    formDefinition(where: { id: $id }) {
      id
      key
      title
      description
      scope
      status
      version
      changelog
      publishedAt
      organization {
        id
        name
      }
      classNetwork {
        id
        title
      }
      createdBy {
        id
        username
      }
      cards(orderBy: { order: asc }) {
        id
        cardType
        title
        titleI18n
        description
        descriptionI18n
        visibleWhenStatus
        roleVisibility
        order
        fields(orderBy: { order: asc }) {
          id
          name
          fieldType
          label
          labelI18n
          helperText
          helperTextI18n
          placeholder
          placeholderI18n
          isRequired
          order
          storage
          storageColumn
          storageBucket
          storageEntity
          options
          validation
          defaultValue
          showWhen
          jsonArraySchema
          visibilityRoles
        }
      }
    }
  }
`;
