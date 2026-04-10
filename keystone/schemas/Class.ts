import { list } from "@keystone-6/core";
import { text, relationship, timestamp, json } from "@keystone-6/core/fields";
import { isSignedIn, isAdmin, rules } from "../access";

const canReadClassField = ({ session }: { session?: any }) => !!session;
const canReadTitle = () => true;

export const Class = list({
  access: {
    operation: {
      query: () => true,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn,
    },
    filter: {
      query: ({ session }) => {
        if (!session) {
          // anonymous users can only see classes you decide are public
          // choose ONE public condition that exists in your schema
          return true;
        }

        return isAdmin({ session })
          ? true
          : {
              OR: [
                { creator: { id: { equals: session.itemId } } },
                { mentors: { some: { id: { equals: session.itemId } } } },
                { students: { some: { id: { equals: session.itemId } } } },
                {
                  networks: {
                    some: {
                      classes: {
                        some: {
                          OR: [
                            { creator: { id: { equals: session.itemId } } },
                            {
                              mentors: {
                                some: { id: { equals: session.itemId } },
                              },
                            },
                            {
                              students: {
                                some: { id: { equals: session.itemId } },
                              },
                            },
                          ],
                        },
                      },
                    },
                  },
                },
              ],
            };
      },
      update: rules.canManageOwnClasses,
      delete: rules.canManageOwnClasses,
    },
  },

  fields: {
    code: text({
      isIndexed: "unique",
      access: { read: canReadClassField },
    }),

    title: text({
      validation: { isRequired: true },
      access: { read: canReadTitle },
    }),

    description: text({
      access: { read: canReadClassField },
    }),

    createdAt: timestamp({
      defaultValue: { kind: "now" },
      access: { read: canReadClassField },
    }),

    updatedAt: timestamp({
      access: { read: canReadClassField },
    }),

    settings: json({
      access: { read: canReadClassField },
    }),

    mentors: relationship({
      ref: "Profile.mentorIn",
      many: true,
      access: { read: canReadClassField },
    }),

    students: relationship({
      ref: "Profile.studentIn",
      many: true,
      access: { read: canReadClassField },
    }),

    networks: relationship({
      ref: "ClassNetwork.classes",
      many: true,
      access: { read: canReadClassField },
    }),

    creator: relationship({
      ref: "Profile.teacherIn",
      access: {
        read: canReadClassField,
      },
      hooks: {
        async resolveInput({ context, operation, inputData }) {
          if (operation === "create") {
            return { connect: { id: context.session.itemId } };
          }
          return inputData.creator;
        },
      },
    }),

    talks: relationship({
      ref: "Talk.classes",
      many: true,
      access: { read: canReadClassField },
    }),

    studies: relationship({
      ref: "Study.classes",
      many: true,
      access: { read: canReadClassField },
    }),

    assignments: relationship({
      ref: "Assignment.classes",
      many: true,
      access: { read: canReadClassField },
    }),

    templateProposal: relationship({
      ref: "ProposalBoard.templateForClasses",
      access: { read: canReadClassField },
    }),

    studentProposals: relationship({
      ref: "ProposalBoard.usedInClass",
      many: true,
      access: { read: canReadClassField },
    }),

    resources: relationship({
      ref: "Resource.classes",
      many: true,
      access: { read: canReadClassField },
    }),

    logs: relationship({
      ref: "Log.class",
      many: true,
      access: { read: canReadClassField },
    }),
  },
});
