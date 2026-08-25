import { gql } from "@apollo/client";

// Resolve the most-specific published FormDefinition for a given key.
// The backend chooses project_board > class_network > organization >
// global, returning the highest-version published row at the winning
// scope. Cards and nested fields are ordered by their `order` column
// at the GraphQL layer.
export const RESOLVE_FORM_DEFINITION = gql`
  query RESOLVE_FORM_DEFINITION(
    $key: String!
    $organizationId: ID
    $classNetworkId: ID
    $proposalBoardId: ID
    $classId: ID
  ) {
    resolveFormDefinition(
      key: $key
      organizationId: $organizationId
      classNetworkId: $classNetworkId
      proposalBoardId: $proposalBoardId
      classId: $classId
    ) {
      id
      key
      title
      description
      scope
      status
      surface
      version
      organization {
        id
      }
      classNetwork {
        id
      }
      class {
        id
      }
      proposalBoard {
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

// Load a specific FormDefinition by id (e.g. round-attached follow-up forms).
export const FORM_DEFINITION_BY_ID = gql`
  query FORM_DEFINITION_BY_ID($id: ID!) {
    formDefinition(where: { id: $id }) {
      id
      key
      title
      description
      scope
      status
      surface
      version
      organization {
        id
      }
      classNetwork {
        id
      }
      class {
        id
      }
      proposalBoard {
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
      surface
      version
      organization {
        id
        name
      }
      classNetwork {
        id
        title
      }
      proposalBoard {
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
      proposalBoard {
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
      surface
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
      proposalBoard {
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

// Published opportunity-surface forms available to attach to a matching
// round: global scope, class_network scoped to the given network, or
// class scoped to the teacher's class.
export const ROUND_PICKABLE_FORM_DEFINITIONS = gql`
  query ROUND_PICKABLE_FORM_DEFINITIONS(
    $classNetworkId: ID!
    $classId: ID!
  ) {
    formDefinitions(
      where: {
        status: { equals: "published" }
        surface: { equals: "opportunity" }
        OR: [
          { scope: { equals: "global" } }
          {
            AND: [
              { scope: { equals: "class_network" } }
              { classNetwork: { id: { equals: $classNetworkId } } }
            ]
          }
          {
            AND: [
              { scope: { equals: "class" } }
              { class: { id: { equals: $classId } } }
            ]
          }
        ]
      }
      orderBy: [{ title: asc }, { version: desc }]
    ) {
      id
      title
      key
      scope
      version
      classNetwork {
        id
      }
      class {
        id
      }
      createdBy {
        id
      }
    }
  }
`;

// Class-scoped opportunity forms for a class (draft + published), shared
// across co-teachers. Used by the matching-round class form library panel.
// `createdBy` is selected so the UI can gate delete on ownership.
export const CLASS_LIBRARY_FORM_DEFINITIONS = gql`
  query CLASS_LIBRARY_FORM_DEFINITIONS($classId: ID!) {
    formDefinitions(
      where: {
        surface: { equals: "opportunity" }
        scope: { equals: "class" }
        status: { in: ["draft", "published"] }
        class: { id: { equals: $classId } }
      }
      orderBy: [{ title: asc }, { updatedAt: desc }]
    ) {
      id
      title
      key
      scope
      status
      version
      updatedAt
      class {
        id
      }
      createdBy {
        id
      }
    }
  }
`;

// Published global opportunity forms teachers can clone into their class.
export const PUBLIC_OPPORTUNITY_FORM_DEFINITIONS = gql`
  query PUBLIC_OPPORTUNITY_FORM_DEFINITIONS {
    formDefinitions(
      where: {
        status: { equals: "published" }
        surface: { equals: "opportunity" }
        scope: { equals: "global" }
      }
      orderBy: [{ title: asc }, { version: desc }]
    ) {
      id
      title
      key
      description
      version
    }
  }
`;

// Board-scoped review/feedback forms for a template board (draft + published).
// Used so teachers can re-link forms they created earlier on this board.
export const BOARD_REVIEW_FORM_DEFINITIONS = gql`
  query BOARD_REVIEW_FORM_DEFINITIONS($proposalBoardId: ID!) {
    formDefinitions(
      where: {
        scope: { equals: "project_board" }
        surface: { equals: "feedback" }
        status: { in: ["draft", "published"] }
        proposalBoard: { id: { equals: $proposalBoardId } }
      }
      orderBy: [{ updatedAt: desc }, { title: asc }]
    ) {
      id
      title
      key
      scope
      status
      version
      updatedAt
      proposalBoard {
        id
      }
    }
  }
`;
