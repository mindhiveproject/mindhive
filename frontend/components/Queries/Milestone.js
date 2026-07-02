import gql from "graphql-tag";

// Board resolver returns milestone scalars from context.query; requesting
// formDefinition or clonedFrom on that path triggers a Keystone batching bug.
export const MILESTONE_BOARD_FIELDS = `
  id
  key
  title
  description
  scope
  actionCardType
  reviewStage
  statusTarget
  legacyBoardStatusField
  legacyOpenForCommentsField
  logEventName
  position
  showInFeedbackCenter
  formDefinitionKeyPattern
  isActive
  canReview {
    id
    name
  }
  actionCards {
    id
    publicId
    type
    title
  }
  formDefinition {
    id
    key
    scope
    status
  }
`;

export const MILESTONE_FIELDS = `
  id
  key
  title
  description
  scope
  actionCardType
  reviewStage
  statusTarget
  legacyBoardStatusField
  legacyOpenForCommentsField
  logEventName
  position
  showInFeedbackCenter
  formDefinitionKeyPattern
  isActive
  formDefinition {
    id
    key
  }
  clonedFrom {
    id
    key
    title
    scope
  }
  canReview {
    id
    name
  }
  actionCards {
    id
    publicId
    type
    title
  }
`;

export const GET_MILESTONES = gql`
  query GET_MILESTONES {
    milestones(where: { isActive: { equals: true } }) {
      ${MILESTONE_FIELDS}
    }
  }
`;

export const ADMIN_MILESTONES = gql`
  query ADMIN_MILESTONES {
    milestones(orderBy: [{ key: asc }]) {
      ${MILESTONE_FIELDS}
    }
  }
`;

export const ADMIN_MILESTONE = gql`
  query ADMIN_MILESTONE($id: ID!) {
    milestone(where: { id: $id }) {
      ${MILESTONE_FIELDS}
    }
  }
`;

export const RESOLVE_MILESTONES_FOR_BOARD = gql`
  query RESOLVE_MILESTONES_FOR_BOARD($boardId: ID!) {
    resolveMilestonesForBoard(boardId: $boardId) {
      ${MILESTONE_BOARD_FIELDS}
    }
  }
`;

export const CREATE_TEMPLATE_MILESTONE = gql`
  mutation CREATE_TEMPLATE_MILESTONE($input: CreateTemplateMilestoneInput!) {
    createTemplateMilestone(input: $input) {
      ${MILESTONE_BOARD_FIELDS}
    }
  }
`;

export const UPDATE_TEMPLATE_MILESTONE = gql`
  mutation UPDATE_TEMPLATE_MILESTONE($input: UpdateTemplateMilestoneInput!) {
    updateTemplateMilestone(input: $input) {
      ${MILESTONE_BOARD_FIELDS}
    }
  }
`;
