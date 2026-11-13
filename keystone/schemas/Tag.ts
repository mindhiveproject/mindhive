import { list } from "@keystone-6/core";
const { uniqueSlug } = require("../lib/uniqueSlug");
import {
  text,
  relationship,
  password,
  timestamp,
  select,
  integer,
  checkbox,
  json,
} from "@keystone-6/core/fields";

import { signedInWrites } from "../access";

export const Tag = list({
  access: {
    // Anyone may read; changes need a signed-in user.
    operation: signedInWrites,
  },
  fields: {
    title: text({ validation: { isRequired: true } }),
    slug: text({
      validation: { isRequired: true },
      isIndexed: "unique",
      isFilterable: true,
      hooks: {
        async resolveInput({ context, operation, inputData }) {
          if (operation === "create") {
            const { title } = inputData;
            if (title) {
              return uniqueSlug(context, "Tag", title);
            }
          } else {
            return inputData.slug;
          }
        },
      },
    }),
    description: text(),
    lessons: relationship({
      ref: "Lesson.tags",
      many: true,
    }),
    resources: relationship({
      ref: "Resource.tags",
      many: true,
    }),
    assignments: relationship({
      ref: "Assignment.tags",
      many: true,
    }),
    homeworks: relationship({
      ref: "Homework.tags",
      many: true,
    }),
    studies: relationship({
      ref: "Study.tags",
      many: true,
    }),
    specs: relationship({
      ref: "Spec.tags",
      many: true,
    }),
    level: select({
      options: [
        { label: "1", value: "1" },
        { label: "2", value: "2" },
        { label: "3", value: "3" },
      ],
      defaultValue: "1",
    }),
    parent: relationship({
      ref: "Tag.children",
    }),
    children: relationship({
      ref: "Tag.parent",
      many: true,
    }),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    updatedAt: timestamp(),
    profiles: relationship({
      ref: "Profile.interests",
      many: true,
    }),
    // Organizations that picked this tag as one of their areas of focus
    // ("Where can your organization help?"). Mirrors Profile.interests.
    organizations: relationship({
      ref: "Organization.interests",
      many: true,
    }),
  },
});
