import { list } from "@keystone-6/core";
import {
  text,
  relationship,
  timestamp,
  select,
  integer,
  checkbox,
  json,
} from "@keystone-6/core/fields";
import { permissions, rules, isSignedIn } from "../access";

// A single field within a FormCard. The `storage` flag splits the world
// in two: `column` writes to a typed column on the target entity (used
// for anything queried, filtered, sorted, or reported on); `json_bucket`
// writes to a json column on the same entity, keyed by `name`.
//
// All admin-added custom fields default to json_bucket — no DB migration
// is needed when the admin adds a new field. Fields seeded from the
// current hardcoded forms keep storage=column so existing queries and
// the matching algorithm keep working unchanged.
export const FormField = list({
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
      update: rules.formFieldMutate,
      delete: rules.formFieldMutate,
    },
  },
  fields: {
    card: relationship({
      ref: "FormCard.fields",
    }),
    // Machine name (snake_case). Used as the json_bucket key and as the
    // form-state key in the renderer. The admin UI enforces uniqueness
    // within a FormDefinition.
    name: text({ validation: { isRequired: true } }),
    fieldType: select({
      options: [
        { label: "Text", value: "text" },
        { label: "Textarea", value: "textarea" },
        { label: "Rich Text", value: "rich_text" },
        { label: "Number", value: "number" },
        { label: "Date", value: "date" },
        { label: "Select", value: "select" },
        { label: "Multiselect", value: "multiselect" },
        { label: "Checkbox", value: "checkbox" },
        { label: "Image", value: "image" },
        { label: "File", value: "file" },
        { label: "Video URL", value: "video_url" },
        { label: "Tag Multiselect", value: "tag_multiselect" },
        { label: "JSON Array", value: "json_array" },
        { label: "Read-only HTML", value: "read_only_html" },
      ],
      defaultValue: "text",
      validation: { isRequired: true },
    }),
    label: text(),
    labelI18n: json(),
    helperText: text({ ui: { displayMode: "textarea" } }),
    helperTextI18n: json(),
    placeholder: text(),
    placeholderI18n: json(),
    isRequired: checkbox({ defaultValue: false }),
    order: integer({ defaultValue: 0 }),
    storage: select({
      options: [
        { label: "Database Column", value: "column" },
        { label: "JSON Bucket", value: "json_bucket" },
      ],
      defaultValue: "json_bucket",
      validation: { isRequired: true },
    }),
    // Which entity this field writes to. "self" = the form's target
    // entity (Profile / Opportunity / Organization). "organization" =
    // the target entity's linked Organization, used for sponsor-account
    // forms where personal contact info lives on Profile and the
    // organization fields live on Organization.
    storageEntity: select({
      options: [
        { label: "Self (target entity)", value: "self" },
        { label: "Linked Organization", value: "organization" },
      ],
      defaultValue: "self",
    }),
    // When storage=column: the column name on the target entity (e.g.
    // "title", "status"). The renderer reads/writes entity[storageColumn].
    storageColumn: text(),
    // When storage=json_bucket: the json column on the target entity
    // (e.g. "extraDetails" for Opportunity, "info" for Profile). The
    // renderer keys the value by `name` inside that bucket.
    storageBucket: text(),
    // For select / multiselect: [{value, label, labelI18n, order}].
    options: json(),
    // {wordLimit, maxLength, min, max, pattern, allowedMimes, maxFileSize}
    validation: json(),
    defaultValue: json(),
    // Reserved for Tier-G conditional logic; ignored by the v1 renderer.
    showWhen: json(),
    // For json_array fields: schema describing one row's sub-fields.
    jsonArraySchema: json(),
    // Optional per-field role override (otherwise inherits from card).
    visibilityRoles: json(),
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
