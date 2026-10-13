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

import {
  signedInWrites,
  canMutateClassTemplateBoard,
  CLASS_TEMPLATE_BOARD_ACCESS_QUERY,
} from "../access";
import { keepHiddenLinksOnSet } from "../lib/keepHiddenLinks";
import { connectAssignmentsToTemplateClasses } from "../mutations/utils/classTemplateBoards";

export const ProposalCard = list({
  access: {
    // Anyone may read; changes need a signed-in user.
    operation: signedInWrites,
  },
  hooks: {
    // An assignment linked on a class template card must belong to the
    // class(es) using that template, or it never shows in the class and
    // the board warns "not connected to a class". Only runs on writes that
    // touch `assignments`, and only for editors of the class template.
    async afterOperation({ operation, inputData, item, context }) {
      if (operation !== "create" && operation !== "update") return;
      if (!item?.id || !inputData?.assignments) return;
      // Template propagation writes `assignments: { set: [] }` on every clone
      // card; skip writes that link nothing before paying for a lookup.
      const links = inputData.assignments;
      const linksSomething =
        (links.set?.length ?? 0) +
          (links.connect?.length ?? 0) +
          (links.create?.length ?? 0) >
        0;
      if (!linksSomething) return;
      const me = context.session?.itemId;
      if (!me) return;

      // Sudo: as the editor, a board collaborator outside the class could
      // not read the class links the permission check needs.
      const sudo = context.sudo();
      const card = await sudo.query.ProposalCard.findOne({
        where: { id: String(item.id) },
        query: `id assignments { id } section { board { ${CLASS_TEMPLATE_BOARD_ACCESS_QUERY} } }`,
      });
      const board = card?.section?.board;
      if (!board?.id || !canMutateClassTemplateBoard(String(me), board)) {
        return;
      }

      await connectAssignmentsToTemplateClasses(
        sudo,
        board.id,
        (card.assignments || []).map((a: { id: string }) => a.id)
      );
    },
  },
  fields: {
    title: text({ validation: { isRequired: true } }),
    publicId: text(),
    description: text(),
    position: float(),
    internalContent: text(),
    revisedContent: text(),
    content: text(),
    comment: text(),
    /**
     * Base64-encoded Yjs document state for collaborative editing of this card's
     * rich-text fields. Managed by the standalone collaboration server
     * (keystone/collab-server.js). The HTML columns above are kept in sync by the
     * browser editor on save (the server stays DOM-free). Hidden from the Admin UI.
     *
     * Keystone `text()` is NOT NULL by default. To clear state (e.g. after
     * template content is propagated onto a clone card) write `""`, not `null`.
     * The collab server treats a falsy value as "no document yet" and the
     * browser re-seeds from HTML on next open.
     */
    yjsState: text({
      ui: {
        createView: { fieldMode: "hidden" },
        itemView: { fieldMode: "hidden" },
        listView: { fieldMode: "hidden" },
      },
    }),
    /**
     * Settings JSON field for ProposalCard.
     * 
     * Expected structure:
     * {
     *   status?: string;                    // Card completion status: "Not started", "Completed", "In progress", etc.
     *   includeInReport?: boolean;          // Whether card should be included in project reports
     *   includeInReviewSteps?: string[];   // Array of review step types (e.g., ["ACTION_SUBMIT", "ACTION_PEER_FEEDBACK"])
     * }
     * 
     * IMPORTANT: Settings merging is handled in the frontend (see mergeCardSettings utility).
     * The frontend ensures that when updating settings, existing properties are preserved.
     */
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
        { label: "Action", value: "ACTION" },
      ],
      defaultValue: "PROPOSAL",
    }),
    milestone: relationship({
      ref: "Milestone.actionCards",
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
      // Saving with `set` keeps links the editor cannot see (lib/keepHiddenLinks).
      hooks: { resolveInput: keepHiddenLinksOnSet("Assignment") },
    }),
    studies: relationship({
      ref: "Study.proposalCards",
      many: true,
    }),
    tasks: relationship({
      ref: "Task.proposalCards",
      many: true,
    }),
    mediaAssetsUsed: relationship({
      ref: "MediaAsset.usedInCards",
      many: true,
    }),
  },
});
