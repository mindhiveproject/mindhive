import { list } from "@keystone-6/core";
import {
  text,
  relationship,
  password,
  timestamp,
  select,
  float,
  checkbox,
  json,
} from "@keystone-6/core/fields";
import slugify from "slugify";
import uniqid from "uniqid";

export const ProposalCard = list({
  access: {
    operation: {
      query: () => true,
      create: () => true,
      update: () => true,
      delete: () => true,
    },
  },
  fields: {
    title: text({ validation: { isRequired: true } }),
    publicId: text({
      defaultValue: uniqid(),
      isIndexed: true, // NEW: Add this for indexing
    }),
    description: text(),
    position: float(),
    internalContent: text(),
    revisedContent: text(),
    content: text(),
    comment: text(),
    settings: json(),
    section: relationship({
      ref: "ProposalSection.cards",
    }),
    assignedTo: relationship({
      ref: "Profile.assignedToProposalCard",
      many: true,
    }),
    studyDescription: relationship({
      ref: "Study.descriptionInProposalCard",
      many: true,
    }),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    updatedAt: timestamp(),
    isEditedBy: relationship({
      ref: "Profile.editsProposalCard",
    }),
    lastTimeEdited: timestamp(),
    type: select({
      options: [
        { label: "Proposal", value: "PROPOSAL" },
        { label: "Assignment", value: "ASSIGNMENT" },
        { label: "Lesson", value: "LESSON" },
        { label: "Article", value: "ARTICLE" },
        { label: "Survey", value: "SURVEY" },
        { label: "Link", value: "LINK" },
        { label: "ActionSubmit", value: "ACTION_SUBMIT" },
        { label: "ActionPeerFeedback", value: "ACTION_PEER_FEEDBACK" },
        { label: "ActionCollectingData", value: "ACTION_COLLECTING_DATA" },
        { label: "ActionProjectReport", value: "ACTION_PROJECT_REPORT" },
      ],
      defaultValue: "PROPOSAL",
    }),
    shareType: select({
      options: [
        { label: "Individual", value: "INDIVIDUAL" },
        { label: "Collective", value: "COLLECTIVE" },
      ],
      defaultValue: "COLLECTIVE",
    }),
    homework: relationship({
      ref: "Homework.proposalCard",
      many: true,
    }),
    resources: relationship({
      ref: "Resource.proposalCards",
      many: true,
    }),
    assignments: relationship({
      ref: "Assignment.proposalCards",
      many: true,
    }),
    studies: relationship({
      ref: "Study.proposalCards",
      many: true,
    }),
    tasks: relationship({
      ref: "Task.proposalCards",
      many: true,
    }),
  },
});
