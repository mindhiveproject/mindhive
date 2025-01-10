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
import slugify from "slugify";

export const ProposalBoard = list({
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
    slug: text({
      validation: { isRequired: true },
      isIndexed: "unique",
      isFilterable: true,
      hooks: {
        async resolveInput({ context, operation, inputData }) {
          if (operation === "create") {
            // in case if slug is given use that slug (e.g., for cloning templates)
            if (inputData.slug) {
              return inputData.slug;
            }
            const { title } = inputData;
            if (title) {
              let slug = slugify(title, {
                remove: /[*+~.()'"!:@]/g, // remove characters that match regex
                lower: true, // convert to lower case
                strict: true, // strip special characters except replacement
              });
              const items = await context.query.ProposalBoard.findMany({
                where: { slug: { startsWith: slug } },
                query: "id slug",
              });
              if (items.length) {
                const re = new RegExp(`${slug}-*\\d*$`);
                const slugs = items.filter((item) => item.slug.match(re));
                if (slugs.length) {
                  slug = `${slug}-${slugs.length}`;
                }
              }
              return slug;
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
    // status: select({
    //   options: [
    //     { label: "Working", value: "WORKING" },
    //     {
    //       label: "Submitted as proposal for review",
    //       value: "SUBMITTED_AS_PROPOSAL_FOR_REVIEW",
    //     },
    //     {
    //       label: "Submitted as study for review",
    //       value: "SUBMITTED_AS_STUDY_FOR_REVIEW",
    //     },
    //     { label: "Reviewed as proposal", value: "REVIEWED_AS_PROPOSAL" },
    //     { label: "Reviewed as study", value: "REVIEWED_AS_STUDY" },
    //   ],
    //   defaultValue: "WORKING",
    // }),
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
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    updatedAt: timestamp(),
  },
});
