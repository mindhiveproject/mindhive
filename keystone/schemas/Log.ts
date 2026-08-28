import { list } from "@keystone-6/core";
import {
  relationship,
  json,
  timestamp,
  select,
} from "@keystone-6/core/fields";
import { rules } from "../access";

export const OPPORTUNITY_PREVIEW_VISIT = "OPPORTUNITY_PREVIEW_VISIT";

export const Log = list({
  access: {
    operation: {
      query: () => true,
      // Visit rows are created only via recordOpportunityPreviewVisit (sudo).
      create: ({ inputData }: { session?: any; inputData?: any }) => {
        if (inputData?.event === OPPORTUNITY_PREVIEW_VISIT) {
          return false;
        }
        return true;
      },
      update: () => true,
      delete: () => true,
    },
    filter: {
      query: rules.logQuery,
      update: rules.logVisitMutate,
      delete: rules.logVisitMutate,
    },
  },
  fields: {
    user: relationship({
      ref: "Profile.logs",
    }),
    proposal: relationship({
      ref: "ProposalBoard.logs",
    }),
    class: relationship({
      ref: "Class.logs",
    }),
    study: relationship({
      ref: "Study.logs",
    }),
    opportunity: relationship({
      ref: "Opportunity.logs",
    }),
    event: select({
      options: [
        {
          label: "Proposal is submitted for expert review",
          value: "PROPOSAL_SUBMITTED_FOR_REVIEW",
        },
        {
          label: "Proposal is submitted for peer review",
          value: "PROPOSAL_SUBMITTED_FOR_PEER_REVIEW",
        },
        {
          label: "Study is submitted for data collection",
          value: "STUDY_SUBMITTED_FOR_DATA_COLLECTION",
        },
        {
          label: "Project is submitted for report",
          value: "PROJECT_SUBMITTED_FOR_REPORT",
        },
        {
          label: "Student previewed an opportunity",
          value: OPPORTUNITY_PREVIEW_VISIT,
        },
      ],
    }),
    content: json(),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    updatedAt: timestamp(),
  },
});
