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
import {
  classQueryFilter,
  classStaffFilter,
  isAdmin,
  isSignedIn,
} from "../access";
import { DOE_DATA_OWNER, isDoeStaffEmail, normalizeDbn } from "../lib/doe/doe";

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
    // DOE data agreement: a class run in an NYC public school holds DOE data,
    // which lib/doe/findDoeData finds for de-identification and deletion.
    // Defaults to NYC DOE when the creator signs in with a DOE staff address.
    // Class staff may mark a class as DOE later, but only an admin may unmark
    // it, since that takes its data out of the agreement's protections.
    dataOwner: select({
      type: "string",
      options: [{ label: "NYC DOE", value: DOE_DATA_OWNER }],
      db: { isNullable: true },
      isIndexed: true,
      isFilterable: true,
      access: {
        update: ({ session, inputData }) =>
          isAdmin({ session }) || inputData?.dataOwner === DOE_DATA_OWNER,
      },
      hooks: {
        async resolveInput({ operation, resolvedData, inputData, context }) {
          if (operation !== "create" || inputData.dataOwner !== undefined) {
            return resolvedData.dataOwner;
          }
          const me = context.session?.itemId;
          if (!me) return resolvedData.dataOwner;
          const profile = await context.sudo().db.Profile.findOne({
            where: { id: String(me) },
          });
          return isDoeStaffEmail(profile?.email) ? DOE_DATA_OWNER : null;
        },
      },
    }),
    // The school's DOE code (DBN), e.g. 02M475, for deletion when one school
    // stops using MindHive.
    school: text({
      isIndexed: true,
      isFilterable: true,
      hooks: {
        resolveInput({ resolvedData }) {
          if (resolvedData.school === undefined) return undefined;
          return normalizeDbn(resolvedData.school);
        },
        validateInput({ resolvedData, addValidationError }) {
          const dbn = resolvedData.school;
          if (dbn && !/^\d{2}[MXKQR]\d{3}$/.test(dbn)) {
            addValidationError(
              "School code must be a DOE DBN such as 02M475."
            );
          }
        },
      },
    }),
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
    // Block list for the class's students: public tasks/surveys hidden from
    // their discover page, descriptions PDF and builder pickers. Empty means
    // everything public is visible, including tasks published later.
    hiddenTasks: relationship({
      ref: "Task.hiddenInClasses",
      many: true,
    }),
    // Block list for featured studies: hidden from the class's students on
    // the discover page and in the study builder's templates.
    hiddenStudies: relationship({
      ref: "Study.hiddenInClasses",
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
