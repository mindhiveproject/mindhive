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
