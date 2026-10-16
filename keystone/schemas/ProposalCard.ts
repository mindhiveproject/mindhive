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

import { signedInWrites } from "../access";
import { keepHiddenLinksOnSet } from "../lib/keepHiddenLinks";
import {
  connectAssignmentsToTemplateClasses,
  publishResourcesToTemplateClasses,
} from "../mutations/utils/classTemplateBoards";

export const ProposalCard = list({
  access: {
    // Anyone may read; changes need a signed-in user.
    operation: signedInWrites,
  },
  hooks: {
    // A resource newly linked on a class template card is published to the
    // class(es) using that template, so students see it. Only new links:
    // a teacher who unpublished a linked resource keeps it unpublished when
    // the card is saved again. Runs before the write, while the card's
    // previous resources can still be read; the helper checks the editor may
    // edit the class template.
    async beforeOperation({ operation, resolvedData, item, context }) {
      if (operation !== "create" && operation !== "update") return;
      const links = resolvedData?.resources;
      if (!links || !context.session?.itemId) return;
      const requested = [...(links.set || []), ...(links.connect || [])]
        .map((r: { id?: string }) => r?.id)
        .filter(Boolean) as string[];
      if (requested.length === 0) return;

      const sudo = context.sudo();
      let sectionId: string | undefined = resolvedData.section?.connect?.id;
      let previous: string[] = [];
      if (operation === "update") {
        const card = await sudo.query.ProposalCard.findOne({
          where: { id: String(item.id) },
          query: "resources { id } section { id }",
        });
        sectionId = card?.section?.id;
        previous = (card?.resources || []).map((r: { id: string }) => r.id);
      }
      const added = requested.filter((id) => !previous.includes(id));
      if (added.length === 0 || !sectionId) return;

      const section = await sudo.query.ProposalSection.findOne({
        where: { id: String(sectionId) },
        query: "board { id }",
      });
      if (!section?.board?.id) return;
      await publishResourcesToTemplateClasses(
        sudo,
        section.board.id,
        added,
        context.session
      );
    },
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
      if (!linksSomething || !context.session?.itemId) return;

      // Sudo: as the editor, a board collaborator outside the class could
      // not read the class links. The helper checks the editor may edit
      // the class template before connecting anything.
      const sudo = context.sudo();
      const card = await sudo.query.ProposalCard.findOne({
        where: { id: String(item.id) },
        query: "id assignments { id } section { board { id } }",
      });
      const boardId = card?.section?.board?.id;
      if (!boardId) return;

      await connectAssignmentsToTemplateClasses(
        sudo,
        boardId,
        (card.assignments || []).map((a: { id: string }) => a.id),
        context.session
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
    /**
     * Snapshots of the card's entry, one per milestone that submitted it to
     * the feedback center, keyed by milestone key. Resubmitting a milestone
     * overwrites its snapshot. Student-owned: template propagation leaves it
     * alone.
     *
     * { [milestoneKey]: { milestoneId?, title, content, submittedAt } }
     */
    previousEntries: json(),
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
