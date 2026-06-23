import { list } from "@keystone-6/core";
import {
  text,
  relationship,
  timestamp,
  select,
  integer,
} from "@keystone-6/core/fields";
import { permissions, rules, isSignedIn } from "../access";

// Connect customizable forms — top-level "form definition" container.
//
// One row per (key, scope, version). Multiple versions can coexist; the
// renderer always picks the most-specific *published* row at lookup time
// (class_network > organization > global). Old published versions remain
// readable as `archived` so historical submissions can still be matched
// against the form they were filled on if needed.
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
      ],
      defaultValue: "global",
      isFilterable: true,
    }),
    organization: relationship({ ref: "Organization" }),
    classNetwork: relationship({ ref: "ClassNetwork" }),
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
    cards: relationship({
      ref: "FormCard.definition",
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
    async resolveInput({ resolvedData, operation }) {
      if (operation === "update") {
        return { ...resolvedData, updatedAt: new Date() };
      }
      return resolvedData;
    },
  },
});
