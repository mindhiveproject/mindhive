import { list } from "@keystone-6/core";
import {
  text,
  relationship,
  timestamp,
  select,
  integer,
  json,
} from "@keystone-6/core/fields";
import { permissions, rules, isSignedIn } from "../access";
import { CARD_TYPE_OPTIONS } from "./FormField";

// A visual section ("card") within a FormDefinition. Cards group related
// fields and provide the unit at which an admin can hide/show, reorder,
// or gate by entity status or viewer role.
//
// Two special card types — members_panel and interest_selector — are
// rendered by dedicated components (not as field grids). Their position
// in the card order is still admin-controlled, but their internals are
// not editable as `FormField` rows.
export const FormCard = list({
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
      update: rules.formCardMutate,
      delete: rules.formCardMutate,
    },
  },
  fields: {
    definition: relationship({
      ref: "FormDefinition.cards",
    }),
    cardType: select({
      options: CARD_TYPE_OPTIONS.map((o) => ({ ...o })),
      defaultValue: "fields",
    }),
    // Plain-text fallback label (used when no i18n entry matches the
    // viewer's locale). titleI18n holds the localized variants.
    title: text(),
    titleI18n: json(),
    description: text({ ui: { displayMode: "textarea" } }),
    descriptionI18n: json(),
    // Array of entity-status values for which this card is visible.
    // Empty/null means "always visible". The renderer compares against
    // entity.status (e.g. Opportunity.status: "draft" / "published" / ...).
    visibleWhenStatus: json(),
    // Array of role strings (sponsor / mentor / teacher / student /
    // scientist / admin). Empty/null = visible to everyone.
    roleVisibility: json(),
    order: integer({ defaultValue: 0 }),
    fields: relationship({
      ref: "FormField.card",
      many: true,
    }),
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
