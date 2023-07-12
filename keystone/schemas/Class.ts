import { list } from "@keystone-6/core";
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

export const Class = list({
  access: {
    operation: {
      query: () => true,
      create: () => true,
      update: () => true,
      delete: () => true,
    },
  },
  fields: {
    code: text({ isIndexed: "unique" }),
    title: text({ validation: { isRequired: true } }),
    description: text(),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    updatedAt: timestamp(),
    settings: json(),
    mentors: relationship({
      ref: "Profile.mentorIn",
      many: true,
    }),
    students: relationship({
      ref: "Profile.studentIn",
      many: true,
    }),
    networks: relationship({ ref: "ClassNetwork.classes", many: true }),
    creator: relationship({
      ref: "Profile.teacherIn",
      hooks: {
        async resolveInput({ context }) {
          return { connect: { id: context.session.itemId } };
        },
      },
    }),
    talks: relationship({
      ref: "Talk.classes",
      many: true,
    }),
    studies: relationship({
      ref: "Study.classes",
      many: true,
    }),
    assignments: relationship({
      ref: "Assignment.classes",
      many: true,
    }),
  },
});
