import { list } from "@keystone-6/core";
import {
  text,
  relationship,
  select,
  checkbox,
  integer,
} from "@keystone-6/core/fields";
import { permissions, rules, isSignedIn } from "../access";

// Milestone — global platform steps (scope=global) or teacher-authored
// template steps (scope=template) paired with action cards on a template board.
export const Milestone = list({
  access: {
    operation: {
      query: () => true,
      create: ({ session }) =>
        !!session &&
        (permissions.canManageUsers({ session }) ||
          permissions.canManageForms({ session })),
      update: isSignedIn,
      delete: isSignedIn,
    },
    filter: {
      update: rules.milestoneMutate,
      delete: rules.milestoneMutate,
    },
  },
  fields: {
    key: text({
      validation: { isRequired: true },
      isIndexed: true,
      isFilterable: true,
    }),
    title: text(),
    description: text({ ui: { displayMode: "textarea" } }),
    scope: select({
      options: [
        { label: "Global", value: "global" },
        { label: "Template", value: "template" },
      ],
      defaultValue: "global",
      isFilterable: true,
      validation: { isRequired: true },
    }),
    templateBoard: relationship({
      ref: "ProposalBoard.templateMilestones",
    }),
    actionCardType: select({
      options: [
        { label: "Submit", value: "ACTION_SUBMIT" },
        { label: "Peer Feedback", value: "ACTION_PEER_FEEDBACK" },
        { label: "Collecting Data", value: "ACTION_COLLECTING_DATA" },
        { label: "Project Report", value: "ACTION_PROJECT_REPORT" },
      ],
      isFilterable: true,
    }),
    reviewStage: text({
      validation: { isRequired: true },
      isFilterable: true,
    }),
    statusTarget: select({
      options: [
        { label: "Board", value: "board" },
        { label: "Study", value: "study" },
      ],
      validation: { isRequired: true },
      isFilterable: true,
    }),
    legacyBoardStatusField: text(),
    legacyOpenForCommentsField: text(),
    logEventName: text({ validation: { isRequired: true } }),
    position: integer({ defaultValue: 0 }),
    showInFeedbackCenter: checkbox({ defaultValue: true, isFilterable: true }),
    canReview: relationship({
      ref: "Permission.reviewableMilestones",
      many: true,
    }),
    formDefinition: relationship({
      ref: "FormDefinition.milestones",
    }),
    formDefinitionKeyPattern: text({
      defaultValue: "review_{{key}}_{{curriculumType}}",
    }),
    actionCards: relationship({
      ref: "ProposalCard.milestone",
      many: true,
    }),
    reviews: relationship({
      ref: "Review.milestone",
      many: true,
    }),
    isActive: checkbox({ defaultValue: true, isFilterable: true }),
  },
  hooks: {
    async validateInput({ resolvedData, operation, item, context, addValidationError }) {
      const scope = resolvedData.scope ?? item?.scope ?? "global";
      const key = resolvedData.key ?? item?.key;
      const templateBoardId =
        resolvedData.templateBoard?.connect?.id ??
        resolvedData.templateBoard?.connect?.connect?.id ??
        item?.templateBoardId;

      if (scope === "template" && !templateBoardId && operation === "create") {
        addValidationError(
          "Template milestones require a templateBoard relationship."
        );
      }

      if (!key) return;

      const existing = await context.query.Milestone.findMany({
        where: {
          key: { equals: key },
          scope: { equals: scope },
          ...(scope === "template" && templateBoardId
            ? { templateBoard: { id: { equals: templateBoardId } } }
            : scope === "global"
              ? { scope: { equals: "global" } }
              : {}),
          ...(operation === "update" && item?.id
            ? { id: { not: { equals: item.id } } }
            : {}),
        },
        query: "id",
        take: 1,
      });

      if (existing.length > 0) {
        addValidationError(
          `A milestone with key "${key}" already exists for this scope.`
        );
      }
    },
  },
});
