import { list } from "@keystone-6/core";
import {
  text,
  relationship,
  timestamp,
  select,
  float,
} from "@keystone-6/core/fields";
import { rules, isSignedIn } from "../access";
import { sendNotificationEmail } from "../lib/mail";
import {
  pickStudentClassForRound,
  studentOpportunitiesUrl,
} from "../lib/connectRoundLinks";

const INACTIVE_MATCH_STATUSES = ["cancelled", "declined"];

/**
 * Resolve the set of student profile IDs that will be on this match after the
 * current create/update resolves. Handles connect / disconnect / set on the
 * many-to-many `students` field.
 */
async function resolveNextStudentIds({
  operation,
  resolvedData,
  item,
  context,
}: {
  operation: string;
  resolvedData: any;
  item: any;
  context: any;
}): Promise<string[]> {
  const studentsInput = resolvedData?.students;
  if (operation === "create") {
    const connected = studentsInput?.connect;
    if (!connected) return [];
    const ids: string[] = [];
    (Array.isArray(connected) ? connected : [connected]).forEach(
      (c: { id?: string }) => {
        if (c?.id) ids.push(c.id);
      },
    );
    return ids;
  }

  // Update: start from current join, then apply connect / disconnect / set.
  let currentIds: string[] = [];
  if (item?.id) {
    const current = await context.sudo().query.ConnectMatch.findOne({
      where: { id: item.id as string },
      query: "students { id }",
    });
    currentIds = (current?.students || []).map((s: { id: string }) => s.id);
  }

  if (studentsInput?.set) {
    const ids: string[] = [];
    (Array.isArray(studentsInput.set) ? studentsInput.set : [studentsInput.set]).forEach(
      (c: { id?: string }) => {
        if (c?.id) ids.push(c.id);
      },
    );
    return ids;
  }

  let next = new Set(currentIds);
  if (studentsInput?.connect) {
    const toAdd = Array.isArray(studentsInput.connect)
      ? studentsInput.connect
      : [studentsInput.connect];
    toAdd.forEach((c: { id?: string }) => {
      if (c?.id) next.add(c.id);
    });
  }
  if (studentsInput?.disconnect) {
    const toRemove = Array.isArray(studentsInput.disconnect)
      ? studentsInput.disconnect
      : [studentsInput.disconnect];
    toRemove.forEach((c: { id?: string }) => {
      if (c?.id) next.delete(c.id);
    });
  }
  return Array.from(next);
}

export const ConnectMatch = list({
  access: {
    operation: {
      query: isSignedIn,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn,
    },
    filter: {
      query: rules.connectMatchVisible,
      update: rules.connectMatchVisible,
      delete: rules.connectMatchVisible,
    },
  },
  hooks: {
    // Enforce uniqueness on (round, student, opportunity) across the many
    // students on a match. Prisma doesn't express compound-unique across
    // relation FKs through Keystone field decorators, so we guard at the
    // resolver layer. Cancelled/declined matches are ignored (same as
    // frontend isStudentInActiveMatch).
    async validateInput({ operation, resolvedData, item, addValidationError, context }) {
      if (operation !== "create" && operation !== "update") return;
      const nextRoundId =
        resolvedData?.round?.connect?.id ?? item?.roundId ?? null;
      const nextOpportunityId =
        resolvedData?.opportunity?.connect?.id ?? item?.opportunityId ?? null;
      const nextStudentIds = await resolveNextStudentIds({
        operation,
        resolvedData,
        item,
        context,
      });
      if (!nextRoundId || !nextOpportunityId || nextStudentIds.length === 0) {
        return;
      }

      for (const studentId of nextStudentIds) {
        const existing = await context.sudo().query.ConnectMatch.findMany({
          where: {
            round: { id: { equals: nextRoundId } },
            opportunity: { id: { equals: nextOpportunityId } },
            students: { some: { id: { equals: studentId } } },
            status: { notIn: INACTIVE_MATCH_STATUSES },
            ...(operation === "update" && item?.id
              ? { id: { not: { equals: item.id } } }
              : {}),
          },
          query: "id",
        });
        if (existing.length > 0) {
          addValidationError(
            "This student is already matched to that opportunity in this round.",
          );
          return;
        }
      }
    },
    // Notify each matched student when the match becomes active (e.g. when a
    // teacher publishes a round). Best-effort — swallows errors so a flaky
    // email service can't break the mutation.
    async afterOperation({ operation, item, originalItem, context }) {
      try {
        if (!item) return;
        const becameActive =
          item.status === "active" &&
          (operation === "create" || originalItem?.status !== "active");
        if (!becameActive) return;
        const match = await context.sudo().query.ConnectMatch.findOne({
          where: { id: item.id as string },
          query: `
            students {
              email
              firstName
              username
              studentIn { id code }
            }
            opportunity { title }
            round {
              id
              title
              classNetwork {
                classes { id code }
              }
            }
          `,
        });
        const students = match?.students || [];
        if (!students.length) return;
        const oppTitle = match?.opportunity?.title || "an opportunity";
        const roundTitle = match?.round?.title || "your matching round";
        const networkClasses = match?.round?.classNetwork?.classes;
        for (const student of students) {
          const email = student?.email;
          if (!email) continue;
          const studentName =
            student?.firstName || student?.username || "there";
          const targetClass = pickStudentClassForRound(
            student?.studentIn,
            networkClasses,
          );
          const dashboardUrl = studentOpportunitiesUrl(
            targetClass?.code,
            match?.round?.id,
          );
          await sendNotificationEmail(
            email,
            `You're matched: ${oppTitle}`,
            `Hi ${studentName}, your match for "${roundTitle}" is now active — you've been placed on "${oppTitle}". Open your dashboard for details, and remember to rate the experience when the project wraps up.`,
            dashboardUrl,
          );
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("ConnectMatch notification email failed:", e);
      }
    },
  },
  fields: {
    round: relationship({
      ref: "ConnectRound.matches",
    }),
    classNetwork: relationship({
      ref: "ClassNetwork.matches",
    }),
    opportunity: relationship({
      ref: "Opportunity.matches",
    }),
    students: relationship({
      ref: "Profile.connectMatches",
      many: true,
    }),

    status: select({
      options: [
        { label: "Proposed", value: "proposed" },
        { label: "Active", value: "active" },
        { label: "Completed", value: "completed" },
        { label: "Declined", value: "declined" },
        { label: "Cancelled", value: "cancelled" },
      ],
      defaultValue: "proposed",
    }),

    matchScore: float(),

    teacherNotes: text({ ui: { displayMode: "textarea" } }),

    ratings: relationship({
      ref: "ConnectRating.match",
      many: true,
    }),

    createdBy: relationship({
      ref: "Profile.connectMatchesCreated",
      hooks: {
        async resolveInput({ context, operation, inputData }) {
          if (operation === "create" && !inputData.createdBy) {
            return { connect: { id: context.session.itemId } };
          }
          return inputData.createdBy;
        },
      },
    }),

    proposedAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    activatedAt: timestamp(),
    completedAt: timestamp(),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    updatedAt: timestamp(),
  },
});
