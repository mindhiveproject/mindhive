import gql from "graphql-tag";

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

export const RESOLVE_MILESTONES_FOR_BOARD = gql`
  query RESOLVE_MILESTONES_FOR_BOARD($boardId: ID!) {
    resolveMilestonesForBoard(boardId: $boardId) {
      ${MILESTONE_FIELDS}
    }
  }
`;

export const CREATE_TEMPLATE_MILESTONE = gql`
  mutation CREATE_TEMPLATE_MILESTONE($input: CreateTemplateMilestoneInput!) {
    createTemplateMilestone(input: $input) {
      ${MILESTONE_FIELDS}
    }
  }
`;

export const UPDATE_TEMPLATE_MILESTONE = gql`
  mutation UPDATE_TEMPLATE_MILESTONE($input: UpdateTemplateMilestoneInput!) {
    updateTemplateMilestone(input: $input) {
      ${MILESTONE_FIELDS}
    }
  }
`;
