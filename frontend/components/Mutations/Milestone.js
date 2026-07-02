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

export const BACKFILL_LINK_ACTION_CARDS_TO_MILESTONES = gql`
  mutation BACKFILL_LINK_ACTION_CARDS_TO_MILESTONES(
    $limit: Int
    $dryRun: Boolean
  ) {
    backfillLinkActionCardsToMilestones(limit: $limit, dryRun: $dryRun)
  }
`;

export const BACKFILL_MILESTONE_STATUS = gql`
  mutation BACKFILL_MILESTONE_STATUS($limit: Int, $dryRun: Boolean) {
    backfillMilestoneStatus(limit: $limit, dryRun: $dryRun)
  }
`;
