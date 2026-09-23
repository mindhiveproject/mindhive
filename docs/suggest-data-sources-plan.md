# Suggesting data sources in reviews (Option A) — plan

Status: **planned, not built.**

Reviewers already suggest public tasks/surveys to a board owner through a `task_selector` field in the review form. This adds the same thing for data sources: a second dropdown that stores `DataSourceBlock` ids in `Review.content`. No accept flow, no new model, no Prisma migration (`FormField.fieldType` is a plain Keystone `select`, so a new option is a code-only change).

## Gating (requirement)

The dropdown is only shown when the class enables physiological data (`class.settings.physiologicalDataEnabled === true`, toggled in `Dashboard/TeacherClasses/ClassPage/Settings.js`).

- Use the **board owner's class**, not the reviewer's. `PROPOSAL_REVIEWS_QUERY` already fetches `usedInClass { id settings }`, so `UserReview` has it as `project.usedInClass.settings`. No new query.
- Builder.js gates on `study.classes` (any class with the flag), not `board.usedInClass`. Check on a real student board that `usedInClass` is set; if it is not, fall back to the study's classes like Builder does.
- Hide the field at render time in `UserReview.js` (filter `dataSourceSelector` items out of the content handed to `Questions`), not in the form definition. The definition stays the same for every class and the gate follows the class setting.
- Do not gate the owner's `Feedback/Board.js` list. It only renders when answers exist.

## Changes

**Keystone**
1. `schemas/FormField.ts`: add `{ label: "Data Source Selector", value: "data_source_selector" }` to `FIELD_TYPE_OPTIONS`. `formValidation.ts` picks it up automatically.
2. `mutations/seedData/reviewForms/buildReviewFormSeed.ts`: add `fieldDataSourceSelector(name)` next to `fieldTaskSelector`.
3. `mutations/seedData/reviewForms/mindhive.ts`: add `fieldDataSourceSelector("4b")` after `fieldTaskSelector("4")` in the proposal review card (and any other review form that has a task selector).
4. Already-seeded and board-forked definitions (`forkReviewFormForBoard`, `saveBoardReviewFormDefinition`, `cloneFormDefinitionForClass`) will not get the field from the seed. Decide: re-run the review-form seed, plus a one-off script in `keystone/scripts/` to append the field to existing published definitions.

**Frontend**
5. New `Dashboard/Review/ProjectReview/Review/DataSourceSelector.js`, modelled on `TaskSelector.js`: multi-select Dropdown over `DATA_SOURCE_BLOCKS` (published only), stores ids, placeholder `reviewDetail.addDataSourceSuggestion`.
6. `Forms/DefinitionForm/fields/DataSourceSelectorField.js` (copy of `TaskSelectorField.js`) and register `data_source_selector` in `fields/index.js`.
7. `Review/MilestoneReviewForm.js`: map `data_source_selector -> "dataSourceSelector"` in `FIELD_TYPE_TO_RESPONSE`, and set `item.answer = []` like task_selector (l.77).
8. `Review/Question.js`: `dataSourceSelector` branch next to `taskSelector` (l.66).
9. `Review/Template.js`: legacy fallback template has a hardcoded `taskSelector` item (`name: "4"`); add the data source item only if the legacy path is still reachable.
10. `Review/UserReview.js`: filter out `dataSourceSelector` items when `!project?.usedInClass?.settings?.physiologicalDataEnabled`.
11. `Feedback/Board.js`: read `dataSourceSelector` answers (l.125-133 pattern, but without the `[0]` shortcut), render a "Suggested data sources" list, and add `dataSourceSelector` to the `.filter` that hides it from the comment cards (l.254).
12. `ProjectReview/Comments/Board.js` l.198: add `dataSourceSelector` to the same exclusion filter.
13. Form editors: add the new type to `Forms/TeacherFormWizard/QuestionEditor.js` (l.50), `TeacherFormWizard/TypeIcons.js` (l.155) and `Dashboard/Admin/Forms/FieldEditor.js` (l.42) only if teachers or admins should be able to add it to their own forms. Otherwise skip.
14. Locales: `reviewDetail.addDataSourceSuggestion` and `review.suggestedDataSources` in `en-us/builder.json`, then the other locale files (they mirror `addTaskSuggestion` / `suggestedTasks`, l.~1763-1767).

## Open questions

- **Where does a suggested data source link to?** Tasks link to `/dashboard/discover/tasks?name=slug`. Check for a browse/detail page for `DataSourceBlock`. If none, use a preview popover or modal showing title, description and `requirementLabel`.
- **Favorite button.** Tasks get `ManageFavorite`. `DataSourceBlock.favoritedBy` exists, so the equivalent is possible if wanted.
- **Unpublished blocks** never appear in the dropdown (query filters `published: true`).
- **Old reviews.** Reviews saved before the field existed have no such item in `content`. `mergeReviewContentWithTemplate` / `reviewContentFromFormDefinition` should add an empty one. Verify.
- **Permissions.** `Review` access is open, so nothing to change (and nothing enforces who can suggest).

## Out of scope (Option B, later if needed)

A `ProposalCard` relation to `DataSourceBlock` so a teacher template can pre-seed a suggested data source that propagates to student boards. Needs a Prisma migration and template-propagation changes.
