import { list } from "@keystone-6/core";
import {
  text,
  relationship,
  timestamp,
  select,
  checkbox,
  image,
} from "@keystone-6/core/fields";
import { rules, isSignedIn } from "../access";

export const Organization = list({
  access: {
    operation: {
      query: () => true, // browsing organizations is open
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn,
    },
    filter: {
      update: rules.connectOrganizationMutate,
      delete: rules.connectOrganizationMutate,
    },
  },
  fields: {
    name: text({
      validation: { isRequired: true },
      isIndexed: "unique",
      isFilterable: true,
    }),
    tagline: text(),
    department: text(),
    website: text(),
    location: text(),
    mission: text({ ui: { displayMode: "textarea" } }),
    primaryDomain: select({
      options: [
        { label: "Academic Institution", value: "academic" },
        { label: "Government Agency", value: "government" },
        { label: "Industry (Private / Start-Up)", value: "industry" },
        { label: "Nonprofit", value: "nonprofit" },
        { label: "Other", value: "other" },
      ],
    }),
    logo: image({ storage: "opportunity_covers" }),
    verified: checkbox({ defaultValue: false }),

    // Many-to-many: a Profile can belong to several Orgs, an Org has many
    // members. Any member can edit the Org for now (no owner gating yet).
    members: relationship({
      ref: "Profile.organizations",
      many: true,
    }),

    // One-to-many: each Opportunity has a single sponsoring Organization;
    // an Org can offer many Opportunities.
    opportunities: relationship({
      ref: "Opportunity.organization",
      many: true,
    }),

    // "Where can your organization help?" — interest tags previously stored
    // on Profile for org-type profiles.
    interests: relationship({
      ref: "Tag.organizations",
      many: true,
    }),

    // Pending invites to join this org (emails of users who haven't signed
    // up yet). Auto-promoted to members when those users complete signup.
    pendingInvites: relationship({
      ref: "OrganizationInvite.organization",
      many: true,
    }),

    // Audit-only: who first created the org record. Doesn't gate access.
    createdBy: relationship({
      ref: "Profile.organizationsCreated",
      hooks: {
        async resolveInput({ context, operation, inputData }) {
          if (operation === "create" && !inputData.createdBy) {
            return { connect: { id: context.session.itemId } };
          }
          return inputData.createdBy;
        },
      },
    }),

    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    updatedAt: timestamp(),
  },
});
