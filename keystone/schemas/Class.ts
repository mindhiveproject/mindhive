// schemas/Class.ts

import { list } from "@keystone-6/core";
import { text, relationship, timestamp, json } from "@keystone-6/core/fields";
import { isSignedIn, isAdmin, rules } from "../access";

export const Class = list({
  access: {
    operation: {
      // Only authenticated users can interact with classes
      query: isSignedIn,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn,
    },
    filter: {
      query: ({ session }) =>
        isAdmin({ session })
          ? true
          : {
              OR: [
                // Classes where the user is creator / mentor / student
                { creator: { id: { equals: session?.itemId } } },
                { mentors: { some: { id: { equals: session?.itemId } } } },
                { students: { some: { id: { equals: session?.itemId } } } },

                // Classes that are in at least one network that also contains
                // a class where the user is creator / mentor / student
                {
                  networks: {
                    some: {
                      classes: {
                        some: {
                          OR: [
                            { creator: { id: { equals: session?.itemId } } },
                            {
                              mentors: {
                                some: { id: { equals: session?.itemId } },
                              },
                            },
                            {
                              students: {
                                some: { id: { equals: session?.itemId } },
                              },
                            },
                          ],
                        },
                      },
                    },
                  },
                },
              ],
            },
      // Who can update/delete:
      // - Admins: all
      // - Others: creator only (rules.canManageOwnClasses)
      update: rules.canManageOwnClasses,
      delete: rules.canManageOwnClasses,
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

    students: relationship({
      ref: "Profile.studentIn",
      many: true,
    }),

    networks: relationship({ ref: "ClassNetwork.classes", many: true }),

    creator: relationship({
      ref: "Profile.teacherIn",
      hooks: {
        async resolveInput({ context, operation, inputData }) {
          if (operation === "create") {
            // Automatically set current user as creator
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
  },
});
