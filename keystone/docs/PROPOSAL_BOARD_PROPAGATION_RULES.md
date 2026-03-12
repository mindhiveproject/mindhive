# Proposal Board Propagation – Rules

*last updated: Mar 8th 2026 (consolidated class/resources/assignments propagation)*

## Scope

When a **template** proposal board (with `prototypeFor` clones) is edited, propagation syncs structure and template-owned fields to all **clone** boards. Student-owned fields on existing clone cards are preserved.

## Matching (backend)

- **Sections**: By **position index** (template and clone sections ordered by `position`; clone section at index `i` corresponds to template section at index `i`).
- **Cards**: By **position index** within each section (same ordering). No publicId used in matching.

## Template-owned (propagate to clones)

### Sections

- Add/delete sections so clone section list matches template. Update `title`, `description`, `position`, and `publicId` when creating/updating.

### Cards

- **Existing clone cards**: Sync `title`, `description`, `type`, `shareType`, `position`, `publicId`, relations (`resources`, `assignments`, `studies`, `tasks`), and **settings** (merged; see below). **Do not** overwrite `content` unless see below.
- **Content**: Overwrite clone card `content` only when the template card id is in `cardIdsWithContentUpdate` (teacher changed the placeholder in this run). Otherwise preserve student’s content.
- **Settings**: On existing clone cards, merge template card settings into clone settings. Add or update any key from the template; **only `settings.status`** is never overwritten (student progress status is preserved). All other setting keys (e.g. `includeInReport`, `includeInReviewSteps`) come from the template.
- **New clone cards** (card added on template): Create with template’s title, description, type, shareType, position, content, settings (status "Not started"), publicId, and relations.

## Student-owned (never overwrite on existing clones)

- **Card**: `content` (unless in `cardIdsWithContentUpdate`), **`settings.status`** (progress status on the card), `internalContent`, `revisedContent`, `comment`, `assignedTo`. Do not overwrite these for existing clone cards.
- **Board**: Clone board metadata (author, usedInClass, etc.) is unchanged.

## Triggers

- Frontend calls `applyTemplateBoardChanges(templateBoardId, cardIdsWithContentUpdate?)` after section/card structural changes or card save. Optional `cardIdsWithContentUpdate`: template card ids for which the teacher changed the content field (so clones get the new placeholder).
- **Auto-update on**: Propagate after each section/card change or card save. **Auto-update off**: User clicks “Save & Update student boards” to propagate once.

## Backend

- **Mutation**: `applyTemplateBoardChanges(templateBoardId: ID!, cardIdsWithContentUpdate: [ID!])`. Implemented in `keystone/mutations/applyTemplateBoardChanges.ts` and `keystone/mutations/utils/boardPropagation.ts`.
- **Idempotent**: Same template state → same clone state. Match by index; no publicId required for existing data.

### Class templates, student boards, resources & assignments

When a `ProposalBoard` is used as a **class template** (`Class.templateProposal` / `ProposalBoard.templateForClasses`) and cloned into **student boards** (`Class.studentProposals` with `clonedFrom` set), the same propagation rules above apply, with additional mutations that wire up resources and assignments:

- `copyProposalBoard.ts` – creates initial clone boards (student boards) from a template, copying sections/cards and:
  - connecting **resources/studies/tasks** by reusing the same IDs as the template;
  - for **assignments**: if the source board is a class template, reuse the same assignment IDs; otherwise create new assignments linked to the new cards.
- `setResourceTemplateCards.ts` – sets which **template cards** a `Resource` is linked to for a given class, then propagates that link to matching cards on all student boards for that class (match by card `publicId`, or section `publicId` + `position`, or section/card index via `templateCloneMatch.ts`).
- `setAssignmentTemplateCards.ts` – same as above but for `Assignment`.
- `linkAssignmentToTemplateCard.ts` / `unlinkAssignmentFromTemplateCards.ts` – re‑link or fully unlink a single assignment from the class template board and all corresponding cloned cards on student boards.

Supporting utilities:

- `keystone/mutations/utils/boardPropagation.ts` – core logic for:
  - `getTemplateAndClones` (loads template + all boards with `clonedFrom = templateBoardId`),
  - `syncSectionsToClone` (section add/update/delete by index),
  - `syncCardsToClone` (card add/update/delete by index, template‑owned vs student‑owned fields),
  - `applyTemplateToClones` (runs both helpers for all clones).
- `keystone/mutations/utils/templateCloneMatch.ts` – index‑based matching helpers used when publicIds are missing:
  - `getTemplateSectionAndCardIndices` – finds a template card’s `(sectionIndex, cardIndex)` on the template board (ordered by `position`),
  - `getCloneCardAtIndices` – returns the clone card at the same indices on a student board.

These functions together ensure:

- Board structure and template‑owned card fields stay aligned between template and all clones.
- Resources and assignments stay linked to the **same logical cards** across the template and every student board in a class, even when some cards lack `publicId` and must be matched by section/card index.
