import { list } from "@keystone-6/core";
import {
  text,
  relationship,
  timestamp,
  select,
  integer,
} from "@keystone-6/core/fields";
import { permissions, rules, isSignedIn } from "../access";

// The four consumer surfaces admin-defined forms drive today. Purely
// UX-facing: `surface` is a filter / grouping / picker aid in the admin
// UI. The load-bearing identifier is still `key`, which the resolver
// and validator use. When adding a fifth surface, extend this list AND
// teach inferSurfaceFromKey to recognise its key pattern.
export const SURFACE_OPTIONS = [
  { label: "Individual profile", value: "profile_individual" },
  { label: "Organization profile", value: "profile_organization" },
  { label: "Opportunity", value: "opportunity" },
  { label: "Feedback (review)", value: "feedback" },
] as const;

const SURFACE_VALUES = new Set(SURFACE_OPTIONS.map((o) => o.value));

// Backfill helper — resolves the surface for a given key using the
// current naming conventions. Used by the resolveInput hook to keep
// `surface` populated automatically as rows are created / updated,
// so admins never see a blank column for legacy rows.
export function inferSurfaceFromKey(
  key: string | null | undefined
): string | null {
  if (!key) return null;
  if (key === "profile_individual") return "profile_individual";
  if (key === "profile_organization") return "profile_organization";
  if (key === "opportunity") return "opportunity";
  if (key.startsWith("review_")) return "feedback";
  return null;
}

// Connect customizable forms — top-level "form definition" container.
//
// One row per (key, scope, version). Multiple versions can coexist; the
// renderer always picks the most-specific *published* row at lookup
// time (project_board > class_network > organization > global). Old
// published versions remain readable as `archived` so historical
// submissions can still be matched against the form they were filled
// on if needed.
export const FormDefinition = list({
  access: {
    operation: {
      // Read is open — the renderer needs to load definitions for any
      // signed-in user filling out a form.
      query: () => true,
      create: ({ session }) =>
        !!session &&
        (permissions.canManageUsers({ session }) ||
          permissions.canManageForms({ session })),
      update: isSignedIn,
      delete: isSignedIn,
    },
    filter: {
      update: rules.formDefinitionMutate,
      delete: rules.formDefinitionMutate,
    },
  },
  fields: {
    // Machine key identifying which form this is: "opportunity",
    // "profile_individual", "profile_organization". Combined with scope
    // and version, uniquely identifies the row at the application layer.
    key: text({
      validation: { isRequired: true },
      isIndexed: true,
      isFilterable: true,
    }),
    title: text({ validation: { isRequired: true } }),
    description: text({ ui: { displayMode: "textarea" } }),
    scope: select({
      options: [
        { label: "Global", value: "global" },
        { label: "Organization", value: "organization" },
        { label: "Class Network", value: "class_network" },
        { label: "Project Board", value: "project_board" },
      ],
      defaultValue: "global",
      isFilterable: true,
    }),
    organization: relationship({ ref: "Organization" }),
    classNetwork: relationship({ ref: "ClassNetwork" }),
    // Set when scope=project_board. Used by templates + student boards
    // to have per-board custom review forms without polluting global.
    proposalBoard: relationship({ ref: "ProposalBoard" }),
    status: select({
      options: [
        { label: "Draft", value: "draft" },
        { label: "Published", value: "published" },
        { label: "Archived", value: "archived" },
      ],
      defaultValue: "draft",
      isFilterable: true,
    }),
    version: integer({ defaultValue: 1 }),
    // Consumer surface this form drives. Purely for admin UX: the
    // resolver/validator/consumer components still look at `key`. When
    // null, the resolveInput hook back-fills it from the current key
    // pattern via inferSurfaceFromKey.
    surface: select({
      options: SURFACE_OPTIONS.map((o) => ({ ...o })),
      isFilterable: true,
    }),
    cards: relationship({
      ref: "FormCard.definition",
      many: true,
    }),
    milestones: relationship({
      ref: "Milestone.formDefinition",
      many: true,
    }),
    createdBy: relationship({
      ref: "Profile.formDefinitionsCreated",
      hooks: {
        async resolveInput({ context, operation, inputData }) {
          if (operation === "create" && !inputData.createdBy) {
            return { connect: { id: context.session?.itemId } };
          }
          return inputData.createdBy;
        },
      },
    }),
    publishedAt: timestamp(),
    publishedBy: relationship({
      ref: "Profile.formDefinitionsPublished",
    }),
    changelog: text({ ui: { displayMode: "textarea" } }),
    createdAt: timestamp({ defaultValue: { kind: "now" } }),
    updatedAt: timestamp(),
  },
  hooks: {
    async resolveInput({ resolvedData, operation, item }) {
      const data: any = { ...resolvedData };
      if (operation === "update") {
        data.updatedAt = new Date();
      }
      // Back-fill `surface` from `key` whenever the row's key changes
      // or the surface is empty. Admin UI can still set surface
      // explicitly — we only overwrite when it's unset or when we can
      // recognise a canonical key pattern.
      const nextKey = data.key ?? item?.key;
      const nextSurface = data.surface ?? item?.surface;
      if (nextKey && (!nextSurface || !SURFACE_VALUES.has(nextSurface))) {
        const inferred = inferSurfaceFromKey(nextKey);
        if (inferred) data.surface = inferred;
      }
      return data;
    },
  },
});
