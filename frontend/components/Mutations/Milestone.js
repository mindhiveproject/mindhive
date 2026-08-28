import { gql } from "@apollo/client";

import { MILESTONE_FIELDS } from "../Queries/Milestone";

export const SEED_MISSING_MILESTONES = gql`
  mutation SEED_MISSING_MILESTONES {
    seedMissingMilestones {
      ${MILESTONE_FIELDS}
    }
  }
`;

export const UPDATE_MILESTONE = gql`
  mutation UPDATE_MILESTONE($id: ID!, $input: MilestoneUpdateInput!) {
    updateMilestone(where: { id: $id }, data: $input) {
      ${MILESTONE_FIELDS}
    }
  }
`;

// Global milestone create — used by the "+ New milestone" flow on the
// admin milestones page. Template milestones go through the dedicated
// createTemplateMilestone mutation (which auto-provisions a template
// FormDefinition and handles slug uniqueness per template board).
// Hard delete. Cascades happen via Keystone's relationship rules:
// ProposalCard.milestone (nullable) is set to null on delete; Reviews
// linked via Review.milestone stay but lose the milestone link. For an
// audit-preserving alternative, prefer setting isActive=false.
export const DELETE_MILESTONE = gql`
  mutation DELETE_MILESTONE($id: ID!) {
    deleteMilestone(where: { id: $id }) {
      id
    }
  }
`;

export const CREATE_MILESTONE = gql`
  mutation CREATE_MILESTONE($input: MilestoneCreateInput!) {
    createMilestone(data: $input) {
      id
      key
      title
      scope
      actionCardType
      reviewStage
      statusTarget
      isActive
    }
  }
`;

export const BACKFILL_LINK_ACTION_CARDS_TO_MILESTONES = gql`
  mutation BACKFILL_LINK_ACTION_CARDS_TO_MILESTONES(
    $limit: Int
    $dryRun: Boolean
  ) {
    backfillLinkActionCardsToMilestones(limit: $limit, dryRun: $dryRun)
  }
`;

export const DELETE_TEMPLATE_MILESTONE = gql`
  mutation DELETE_TEMPLATE_MILESTONE($id: ID!) {
    deleteTemplateMilestone(id: $id) {
      id
    }
  }
`;

// deleteTemplateMilestone removes the template milestone only; review forms
// stay in the database and become unavailable on the board. See
// keystone/mutations/deleteTemplateMilestone.ts and DeleteCardsConfirmModal.js
// when teachers can reassociate forms to milestones.

export const BACKFILL_MILESTONE_STATUS = gql`
  mutation BACKFILL_MILESTONE_STATUS($limit: Int, $dryRun: Boolean) {
    backfillMilestoneStatus(limit: $limit, dryRun: $dryRun)
  }
`;
