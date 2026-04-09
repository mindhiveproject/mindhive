import { list } from "@keystone-6/core";
import {
  text,
  relationship,
  timestamp,
  select,
  checkbox,
  json,
} from "@keystone-6/core/fields";
import slugify from "slugify";
import { isSignedIn, isAdmin } from "../access";

export const ProposalBoard = list({
  access: {
    operation: {
      query: isSignedIn,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn,
    },
    filter: {
      // Admins: all;
      // Others: boards where they are creator/author/collaborator or used in their class
      query: ({ session }) =>
        isAdmin({ session })
          ? true
          : {
              OR: [
                { creator: { id: { equals: session?.itemId } } },
                { author: { id: { equals: session?.itemId } } },
                {
                  collaborators: { some: { id: { equals: session?.itemId } } },
                },
                {
                  usedInClass: {
                    OR: [
                      { creator: { id: { equals: session?.itemId } } },
                      {
                        mentors: { some: { id: { equals: session?.itemId } } },
                      },
                      {
                        students: { some: { id: { equals: session?.itemId } } },
                      },
                    ],
                  },
                },
              ],
            },
      update: ({ session }) =>
        isAdmin({ session })
          ? true
          : {
              OR: [
                { creator: { id: { equals: session?.itemId } } },
                { author: { id: { equals: session?.itemId } } },
                {
                  collaborators: { some: { id: { equals: session?.itemId } } },
                },
              ],
            },
      delete: ({ session }) =>
        isAdmin({ session })
          ? true
          : { creator: { id: { equals: session?.itemId } } },
    },
  },
  hooks: {
    async afterOperation({ operation, item, context }) {
      if ((operation !== "create" && operation !== "update") || !item?.id) {
        return;
      }

      const board = await context.query.ProposalBoard.findOne({
        where: { id: item.id },
        query: "id usedInClass { id } sections { cards { resources { id } } }",
      });

      if (!board?.usedInClass?.id) {
        return;
      }

      const classId = board.usedInClass.id;
      const resourceIdsSet = new Set<string>();

      for (const section of board.sections || []) {
        for (const card of section.cards || []) {
          for (const resource of card.resources || []) {
            if (resource?.id) {
              resourceIdsSet.add(resource.id);
            }
          }
        }
      }

      if (!resourceIdsSet.size) {
        return;
      }

      const resourceIds = Array.from(resourceIdsSet);

      await Promise.all(
        resourceIds.map((resourceId) =>
          context.db.Resource.updateOne({
            where: { id: resourceId },
            data: {
              classes: { connect: { id: classId } },
            },
          }),
        ),
      );
    },
  },
  fields: {
    title: text({ validation: { isRequired: true } }),
    publicId: text(),
    slug: text({
      validation: { isRequired: true },
      isIndexed: "unique",
      isFilterable: true,
      hooks: {
        async resolveInput({ context, operation, inputData }) {
          if (operation === "create") {
            if (inputData.slug) {
              return inputData.slug;
            }
            const { title } = inputData;
            if (title) {
              let baseSlug = slugify(title, {
                remove: /[*+~.()'"!:@]/g,
                lower: true,
                strict: true,
              });
              if (!baseSlug) {
                baseSlug = `proposal-${Date.now()}-${Math.floor(
                  Math.random() * 1000,
                )}`;
              }
              const items = await context.query.ProposalBoard.findMany({
                where: { slug: { startsWith: baseSlug } },
                query: "slug",
              });
              if (!items.length) {
                return baseSlug;
              }
              const exactMatch = items.find(
                (item: any) => item.slug === baseSlug,
              );
              if (!exactMatch) {
                return baseSlug;
              }
              let maxSuffix = 0;
              const suffixRegex = new RegExp(`^${baseSlug}-(\\d+)$`);
              items.forEach((item: any) => {
                const match = item.slug.match(suffixRegex);
                if (match) {
                  const suffix = parseInt(match[1], 10);
                  if (!Number.isNaN(suffix) && suffix > maxSuffix) {
                    maxSuffix = suffix;
                  }
                }
              });
              return `${baseSlug}-${maxSuffix + 1}`;
            }
          } else {
            return inputData.slug;
          }
        },
      },
    }),
    description: text(),
    isDefault: checkbox({ isFilterable: true }),
    isTemplate: checkbox({ isFilterable: true }),
    isSubmitted: checkbox({ isFilterable: true }),
    isMain: checkbox({ isFilterable: true }),
    isHidden: checkbox({ isFilterable: true }),
    submitProposalStatus: select({
      options: [
        { label: "Not started", value: "NOT_STARTED" },
        { label: "In progress", value: "IN_PROGRESS" },
        { label: "Submitted", value: "SUBMITTED" },
        { label: "Review is finished", value: "FINISHED" },
      ],
      defaultValue: "NOT_STARTED",
    }),
    submitProposalOpenForComments: checkbox({ isFilterable: true }),
    peerFeedbackStatus: select({
      options: [
        { label: "Not started", value: "NOT_STARTED" },
        { label: "In progress", value: "IN_PROGRESS" },
        { label: "Submitted", value: "SUBMITTED" },
        { label: "Review is finished", value: "FINISHED" },
      ],
      defaultValue: "NOT_STARTED",
    }),
    peerFeedbackOpenForComments: checkbox({ isFilterable: true }),
    projectReportStatus: select({
      options: [
        { label: "Not started", value: "NOT_STARTED" },
        { label: "In progress", value: "IN_PROGRESS" },
        { label: "Submitted", value: "SUBMITTED" },
        { label: "Report is finished", value: "FINISHED" },
      ],
      defaultValue: "NOT_STARTED",
    }),
    projectReportOpenForComments: checkbox({ isFilterable: true }),
    checklist: json(),
    settings: json(),
    creator: relationship({
      ref: "Profile.creatorOfProposal",
    }),
    author: relationship({
      ref: "Profile.authorOfProposal",
    }),
    collaborators: relationship({
      ref: "Profile.collaboratorInProposal",
      many: true,
    }),
    study: relationship({
      ref: "Study.proposal",
    }),
    studyMain: relationship({
      ref: "Study.proposalMain",
    }),
    sections: relationship({
      ref: "ProposalSection.board",
      many: true,
    }),
    reviews: relationship({
      ref: "Review.proposal",
      many: true,
    }),
    templateForClasses: relationship({
      ref: "Class.templateProposal",
      many: true,
    }),
    usedInClass: relationship({
      ref: "Class.studentProposals",
    }),
    clonedFrom: relationship({ ref: "ProposalBoard.prototypeFor" }),
    prototypeFor: relationship({ ref: "ProposalBoard.clonedFrom", many: true }),
    mediaAssetsUsed: relationship({
      ref: "MediaAsset.usedInBoards",
      many: true,
    }),
    resources: relationship({
      ref: "Resource.proposalBoard",
      many: true,
    }),
    logs: relationship({
      ref: "Log.proposal",
      many: true,
    }),
    vizJournals: relationship({
      ref: "VizJournal.project",
      many: true,
    }),
    datasources: relationship({
      ref: "Datasource.project",
      many: true,
    }),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    updatedAt: timestamp(),
  },
});
