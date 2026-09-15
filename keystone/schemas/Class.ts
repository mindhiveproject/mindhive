import { list } from "@keystone-6/core";
import {
  text,
  relationship,
  password,
  timestamp,
  select,
  integer,
  checkbox,
  json,
} from "@keystone-6/core/fields";
import {
  ensureTeacherPermission,
  relationshipConnectIds,
  syncClassStaffAsRoundReviewers,
} from "../lib/classStaff";

export const Class = list({
  access: {
    operation: {
      query: () => true,
      create: () => true,
      update: () => true,
      delete: ({ session }) => !!session?.itemId,
    },
    filter: {
      delete: ({ session }) =>
        session?.itemId
          ? { creator: { id: { equals: session.itemId } } }
          : false,
    },
  },
  fields: {
    code: text({ isIndexed: "unique" }),
    title: text({ validation: { isRequired: true } }),
    description: text(),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    updatedAt: timestamp(),
    settings: json(),
    mentors: relationship({
      ref: "Profile.mentorIn",
      many: true,
    }),
    teachingTeam: relationship({
      ref: "Profile.teachingTeamIn",
      many: true,
    }),
    students: relationship({
      ref: "Profile.studentIn",
      many: true,
    }),
    favoriteBy: relationship({
      ref: "Profile.favoriteClasses",
      many: true,
    }),
    networks: relationship({ ref: "ClassNetwork.classes", many: true }),
    creator: relationship({
      ref: "Profile.teacherIn",
      hooks: {
        async resolveInput({ context, operation, inputData }) {
          if (operation === "create") {
            return { connect: { id: context.session.itemId } };
          } else {
            return inputData.creator;
          }
        },
      },
    }),
    talks: relationship({
      ref: "Talk.classes",
      many: true,
    }),
    studies: relationship({
      ref: "Study.classes",
      many: true,
    }),
    assignments: relationship({
      ref: "Assignment.classes",
      many: true,
    }),
    templateProposal: relationship({
      ref: "ProposalBoard.templateForClasses",
    }),
    classTemplateBoards: relationship({
      ref: "ProposalBoard.templatesForClass",
      many: true,
    }),
    studentProposals: relationship({
      ref: "ProposalBoard.usedInClass",
      many: true,
    }),
    resources: relationship({
      ref: "Resource.classes",
      many: true,
    }),
    logs: relationship({
      ref: "Log.class",
      many: true,
    }),
    tickets: relationship({
      ref: "Ticket.class",
      many: true,
    }),
    formDefinitions: relationship({
      ref: "FormDefinition.class",
      many: true,
    }),
  },
  hooks: {
    async afterOperation({ operation, inputData, item, context }) {
      if (operation !== "create" && operation !== "update") return;
      const profileIds = relationshipConnectIds(inputData?.teachingTeam);
      for (const profileId of profileIds) {
        await ensureTeacherPermission(context, profileId);
      }
      if (
        inputData?.teachingTeam ||
        inputData?.mentors ||
        inputData?.networks
      ) {
        await syncClassStaffAsRoundReviewers(context, item?.id ? String(item.id) : "");
      }
    },
  },
});
