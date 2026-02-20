# Proposal Board Propagation – Current Behavior

## Overview

Template → clone propagation is **centralized in the backend**. The frontend calls `applyTemplateBoardChanges(templateBoardId, cardIdsWithContentUpdate?)`; the backend syncs sections and cards to all boards where `clonedFrom.id === templateBoardId`.

*last updated: Feb 19th 2026 by Franck Porteous*

## Backend

| Component | Role |
|-----------|------|
| `applyTemplateBoardChanges` | Mutation: accepts `templateBoardId` and optional `cardIdsWithContentUpdate` (template card ids for which teacher changed content so clones get new placeholder). |
| `boardPropagation.ts` | `getTemplateAndClones`, `syncSectionsToClone`, `syncCardsToClone`, `applyTemplateToClones`. Match by position index; preserve student content/settings on existing clone cards unless in `cardIdsWithContentUpdate`. |
| `copyProposalBoard` | Initial clone creation only; no ongoing sync. |
| `linkAssignmentToTemplateCard` / `unlinkAssignmentFromTemplateCards` | Assignment ↔ template card link and propagation to clone cards by publicId/position. |

## Frontend

| Trigger | Action |
|---------|--------|
| Section add/delete/update, card add/delete/move | If auto-update on: call `propagateToClones()`. Else: user clicks “Save & Update student boards” (Header) to call it. |
| Card save (template) with “update all clones” | Call `propagateToClones({ contentChangedCardIds })`; `contentChangedCardIds` = `[cardId]` only if teacher changed the content field (so backend overwrites clone content for that card). |

Entry: `Proposal/Builder/Main.js` provides `propagateToClones(options)`; used by Header, Board, Section, and Card/Builder.

## What propagates

- **Sections**: Existence, order, title, description, publicId.
- **Cards**: Existence, order, section, title, description, type, shareType, position, publicId, resources, assignments, studies, tasks. For **existing** clone cards: content only if in `cardIdsWithContentUpdate`; settings never. New clone cards get template content and settings.

## What does not propagate (student-owned on clones)

- On **existing** clone cards: content (unless in `cardIdsWithContentUpdate`), settings, internalContent, revisedContent, comment, assignedTo. See `boardPropagation.ts` and RULES doc.

## Testing

- As teacher: edit template (sections, cards, card title/description/links). Turn auto-update on or click “Save & Update student boards”. Confirm clones match structure and template-owned fields; student content and status on clone cards unchanged unless teacher changed that card’s content and propagated.
