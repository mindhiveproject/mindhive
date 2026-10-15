import { list } from "@keystone-6/core";
import {
  relationship,
  json,
  timestamp,
  text,
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
    // Free text so each milestone's own logEventName (e.g.
    // MILESTONE_SUBMITTED_<KEY> for teacher-made milestones) can be logged.
    // Built-in events: PROPOSAL_SUBMITTED_FOR_REVIEW,
    // PROPOSAL_SUBMITTED_FOR_PEER_REVIEW, STUDY_SUBMITTED_FOR_DATA_COLLECTION,
    // PROJECT_SUBMITTED_FOR_REPORT, OPPORTUNITY_PREVIEW_VISIT.
    event: text({ db: { isNullable: true } }),
    content: json(),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    updatedAt: timestamp(),
  },
});
