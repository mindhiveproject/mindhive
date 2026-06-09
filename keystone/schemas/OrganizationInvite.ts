import { list } from "@keystone-6/core";
import {
  text,
  relationship,
  timestamp,
  select,
} from "@keystone-6/core/fields";
import { randomBytes } from "crypto";
import { isSignedIn } from "../access";
import { sendNotificationEmail } from "../lib/mail";

const frontendUrl = () =>
  (process.env.NODE_ENV === "development"
    ? process.env.FRONTEND_URL_DEV
    : process.env.FRONTEND_URL) || "https://mindhive.science";

export const OrganizationInvite = list({
  access: {
    operation: {
      query: isSignedIn,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn,
    },
  },
  fields: {
    // Invitee email — stored lowercase. Pre-fills the signup form when the
    // invitee follows the email link, but the token (not the email) is what
    // gates acceptance.
    email: text({
      validation: { isRequired: true },
      isFilterable: true,
      isIndexed: true,
      hooks: {
        resolveInput({ resolvedData }) {
          if (
            resolvedData.email &&
            typeof resolvedData.email === "string"
          ) {
            return resolvedData.email.toLowerCase().trim();
          }
          return resolvedData.email;
        },
      },
    }),

    // Cryptographically random single-use token. Only someone who received
    // the invite email can present this token at signup, so simply guessing
    // an invited email is no longer enough to join an organization.
    token: text({
      isIndexed: "unique",
      isFilterable: true,
      hooks: {
        resolveInput({ operation, resolvedData }) {
          if (operation === "create" && !resolvedData.token) {
            return randomBytes(32).toString("hex");
          }
          return resolvedData.token;
        },
      },
    }),
    organization: relationship({
      ref: "Organization.pendingInvites",
    }),
    invitedBy: relationship({
      ref: "Profile.organizationInvitesSent",
      hooks: {
        async resolveInput({ context, operation, inputData }) {
          if (operation === "create" && !inputData.invitedBy) {
            return { connect: { id: context.session.itemId } };
          }
          return inputData.invitedBy;
        },
      },
    }),
    status: select({
      options: [
        { label: "Pending", value: "pending" },
        { label: "Accepted", value: "accepted" },
        { label: "Revoked", value: "revoked" },
      ],
      defaultValue: "pending",
    }),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    acceptedAt: timestamp(),
  },
  hooks: {
    // Send a Postmark invite email when a fresh invite is created. Wrapped
    // in try/catch so a flaky email service can't break the mutation.
    async afterOperation({ operation, item, context }) {
      try {
        if (operation !== "create" || !item) return;
        const invite = await context.sudo().query.OrganizationInvite.findOne({
          where: { id: item.id },
          query: `
            email
            token
            organization { name id }
            invitedBy { firstName lastName username }
          `,
        });
        if (!invite?.email || !invite?.token) return;
        const inviterName =
          invite.invitedBy?.firstName ||
          invite.invitedBy?.username ||
          "A teammate";
        const orgName = invite.organization?.name || "their organization";
        // The invite link carries the token. Follow-the-link → sign up →
        // membership is granted via the token, not via email matching.
        const link = `${frontendUrl()}/signup/sponsor?invite=${invite.token}`;
        await sendNotificationEmail(
          invite.email,
          `You're invited to join ${orgName} on MindHive`,
          `${inviterName} invited you to join "${orgName}" on MindHive Connect. Click the link below to sign up — you'll be added to the organization automatically once your account is created. The link is single-use and tied to your invitation.`,
          link,
        );
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("OrganizationInvite email failed:", e);
      }
    },
  },
});
