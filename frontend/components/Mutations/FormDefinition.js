import { gql } from "@apollo/client";

// Auto-generated Keystone mutations for FormDefinition / FormCard /
// FormField. We use the `$input: <List><Op>Input!` pattern consistently
// so callers can build dynamic inputs without GraphQL-document edits.

export const CREATE_FORM_DEFINITION = gql`
  mutation CREATE_FORM_DEFINITION($input: FormDefinitionCreateInput!) {
    createFormDefinition(data: $input) {
      id
      key
      title
      scope
      status
      version
    }
  }
`;

export const DELETE_FORM_DEFINITION = gql`
  mutation DELETE_FORM_DEFINITION($id: ID!) {
    deleteFormDefinition(where: { id: $id }) {
      id
    }
  }
`;

export const CREATE_FORM_CARD = gql`
  mutation CREATE_FORM_CARD($input: FormCardCreateInput!) {
    createFormCard(data: $input) {
      id
      title
      order
    }
  }
`;

export const DELETE_FORM_CARD = gql`
  mutation DELETE_FORM_CARD($id: ID!) {
    deleteFormCard(where: { id: $id }) {
      id
    }
  }
`;

export const CREATE_FORM_FIELD = gql`
  mutation CREATE_FORM_FIELD($input: FormFieldCreateInput!) {
    createFormField(data: $input) {
      id
      name
      fieldType
      order
    }
  }
`;

export const DELETE_FORM_FIELD = gql`
  mutation DELETE_FORM_FIELD($id: ID!) {
    deleteFormField(where: { id: $id }) {
      id
    }
  }
`;

// One-shot migration for legacy auto-provisioned FormDefinitions that
// were created before the project_board scope existed. Relocates them
// from scope=global to scope=project_board with the correct
// proposalBoard set. Dry-run by default — returns a list of change
// descriptions. Idempotent.
export const BACKFILL_PROJECT_BOARD_FORM_SCOPE = gql`
  mutation BACKFILL_PROJECT_BOARD_FORM_SCOPE($dryRun: Boolean) {
    backfillProjectBoardFormScope(dryRun: $dryRun)
  }
`;

// Self-service seeder. Inserts only baseline definitions that are
// completely missing from the DB (any scope, any status). Safe to call
// without confirmation — never clobbers admin-edited definitions.
// Used by the "Seed default forms" button on the admin list page.
export const SEED_MISSING_FORMS = gql`
  mutation SEED_MISSING_FORMS {
    seedMissingForms {
      id
      key
      title
      scope
      status
      version
    }
  }
`;

// Custom mutation that clones a FormDefinition + all its cards + fields
// as a new draft (status="draft", version+1). See keystone/mutations/
// duplicateFormDefinition.ts.
export const DUPLICATE_FORM_DEFINITION = gql`
  mutation DUPLICATE_FORM_DEFINITION($id: ID!) {
    duplicateFormDefinition(id: $id) {
      id
      key
      title
      scope
      status
      version
    }
  }
`;

// Atomic publish — sets this row to status=published, stamps
// publishedAt/publishedBy/changelog, and archives any other published
// row at the same (key, scope, organization, classNetwork). Use this
// instead of the generic UPDATE_FORM_DEFINITION for publishing.
export const PUBLISH_FORM_DEFINITION = gql`
  mutation PUBLISH_FORM_DEFINITION($id: ID!, $changelog: String) {
    publishFormDefinition(id: $id, changelog: $changelog) {
      id
      status
      publishedAt
      changelog
      publishedBy {
        id
        username
      }
    }
  }
`;

export const SAVE_CLASS_FORM_DEFINITION = gql`
  mutation SAVE_CLASS_FORM_DEFINITION($input: SaveClassFormDefinitionInput!) {
    saveClassFormDefinition(input: $input) {
      id
      key
      title
      description
      scope
      status
      surface
      version
      class {
        id
      }
      cards(orderBy: { order: asc }) {
        id
        title
        cardType
        order
        fields(orderBy: { order: asc }) {
          id
          name
          fieldType
          label
          helperText
          placeholder
          isRequired
          order
          options
        }
      }
    }
  }
`;

export const SAVE_BOARD_REVIEW_FORM_DEFINITION = gql`
  mutation SAVE_BOARD_REVIEW_FORM_DEFINITION(
    $input: SaveBoardReviewFormDefinitionInput!
  ) {
    saveBoardReviewFormDefinition(input: $input) {
      id
      key
      title
      description
      scope
      status
      surface
      version
      proposalBoard {
        id
      }
      cards(orderBy: { order: asc }) {
        id
        title
        cardType
        order
        fields(orderBy: { order: asc }) {
          id
          name
          fieldType
          label
          helperText
          placeholder
          isRequired
          order
          options
        }
      }
    }
  }
`;

export const FORK_REVIEW_FORM_FOR_BOARD = gql`
  mutation FORK_REVIEW_FORM_FOR_BOARD(
    $templateBoardId: ID!
    $milestoneId: ID!
  ) {
    forkReviewFormForBoard(
      templateBoardId: $templateBoardId
      milestoneId: $milestoneId
    ) {
      id
      key
      title
      description
      scope
      status
      surface
      version
      proposalBoard {
        id
      }
      cards(orderBy: { order: asc }) {
        id
        title
        cardType
        order
        fields(orderBy: { order: asc }) {
          id
          name
          fieldType
          label
          helperText
          placeholder
          isRequired
          order
          options
        }
      }
    }
  }
`;

export const CLONE_FORM_DEFINITION_FOR_CLASS = gql`
  mutation CLONE_FORM_DEFINITION_FOR_CLASS($sourceId: ID!, $classId: ID!) {
    cloneFormDefinitionForClass(sourceId: $sourceId, classId: $classId) {
      id
      key
      title
      description
      scope
      status
      surface
      version
      class {
        id
      }
      cards(orderBy: { order: asc }) {
        id
        title
        cardType
        order
        fields(orderBy: { order: asc }) {
          id
          name
          fieldType
          label
          helperText
          placeholder
          isRequired
          order
          options
        }
      }
    }
  }
`;

export const UPDATE_FORM_DEFINITION = gql`
  mutation UPDATE_FORM_DEFINITION($id: ID!, $input: FormDefinitionUpdateInput!) {
    updateFormDefinition(where: { id: $id }, data: $input) {
      id
      key
      title
      description
      scope
      status
      version
      publishedAt
    }
  }
`;

export const UPDATE_FORM_CARD = gql`
  mutation UPDATE_FORM_CARD($id: ID!, $input: FormCardUpdateInput!) {
    updateFormCard(where: { id: $id }, data: $input) {
      id
      title
      description
      cardType
      visibleWhenStatus
      roleVisibility
      order
    }
  }
`;

export const UPDATE_FORM_FIELD = gql`
  mutation UPDATE_FORM_FIELD($id: ID!, $input: FormFieldUpdateInput!) {
    updateFormField(where: { id: $id }, data: $input) {
      id
      name
      fieldType
      label
      helperText
      placeholder
      isRequired
      order
      storage
      storageColumn
      storageBucket
      storageEntity
      options
      validation
      defaultValue
      jsonArraySchema
    }
  }
`;
