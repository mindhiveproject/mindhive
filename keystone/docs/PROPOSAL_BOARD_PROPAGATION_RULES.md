# Proposal Board Propagation – Rules

*last updated: Feb 19th 2026 by Franck Porteous*

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
