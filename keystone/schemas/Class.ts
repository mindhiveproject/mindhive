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
import { classQueryFilter, classStaffFilter, isSignedIn } from "../access";

export const Class = list({
  access: {
    operation: {
      query: () => true,
      create: isSignedIn,
      update: () => true,
      delete: ({ session }) => !!session?.itemId,
    },
    filter: {
      // Only class staff (creator, co-teachers, mentors) or admins change a
      // class: settings, rosters, teaching team. Joining uses joinClass (sudo).
      // Members and network-connected users read a class; joining by code
      // uses the classJoinPreview query instead.
      query: classQueryFilter,
      update: classStaffFilter,
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
      const actorId = context.session?.itemId
        ? String(context.session.itemId)
        : "";
      const classTitle = (item as { title?: string } | undefined)?.title || "a class";
      const classCode = (item as { code?: string } | undefined)?.code;
      const classLink = classCode
        ? `/dashboard/myclasses/${classCode}`
        : "/dashboard/myclasses";
      for (const profileId of profileIds) {
        await ensureTeacherPermission(context, profileId);
        if (actorId && String(profileId) === actorId) continue;
        try {
          await context.sudo().db.Update.createOne({
            data: {
              user: { connect: { id: profileId } },
              updateArea: "CLASS",
              link: classLink,
              content: {
                title: "Added to a class",
                message: `You were added as a co-teacher of "${classTitle}".`,
                linkTitle: "Open class",
              },
            },
          });
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error(
            `Failed to create teaching-team Update for user ${profileId}:`,
            e
          );
        }
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
