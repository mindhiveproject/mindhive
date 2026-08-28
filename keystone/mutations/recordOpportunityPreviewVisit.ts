import { OPPORTUNITY_PREVIEW_VISIT } from "../schemas/Log";

const MIN_DWELL_MS = 1000;

function toIso(value: unknown): string | null {
  if (value == null) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return value.toISOString();
  }
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

/**
 * Record a student opportunity preview session as a Log row.
 * Access checks run here; the write uses sudo so Log.create cannot be
 * spoofed via the public createLog mutation.
 */
async function recordOpportunityPreviewVisit(
  _root: unknown,
  {
    opportunityId,
    classId,
    roundId,
    openAt,
    closeAt,
  }: {
    opportunityId: string;
    classId: string;
    roundId: string;
    openAt: Date | string;
    closeAt: Date | string;
  },
  context: any
): Promise<any> {
  const sessionId = context.session?.itemId;
  if (!sessionId) {
    throw new Error("You must be signed in to record a preview visit.");
  }

  const oppId = opportunityId == null ? "" : String(opportunityId);
  const clsId = classId == null ? "" : String(classId);
  const rndId = roundId == null ? "" : String(roundId);
  if (!oppId || !clsId || !rndId) {
    throw new Error("opportunityId, classId, and roundId are required.");
  }

  const openIso = toIso(openAt);
  const closeIso = toIso(closeAt);
  if (!openIso || !closeIso) {
    throw new Error("openAt and closeAt must be valid dates.");
  }

  const dwellMs = new Date(closeIso).getTime() - new Date(openIso).getTime();
  if (dwellMs < MIN_DWELL_MS) {
    throw new Error(
      `Preview dwell must be at least ${MIN_DWELL_MS}ms (got ${dwellMs}ms).`
    );
  }

  const klass = await context.sudo().query.Class.findOne({
    where: { id: clsId },
    query: `
      id
      students { id }
      networks { id }
    `,
  });
  if (!klass) {
    throw new Error("Class not found.");
  }

  const isStudent = (klass.students || []).some(
    (s: { id?: string }) => s?.id === sessionId
  );
  if (!isStudent) {
    throw new Error("Only students in this class can record preview visits.");
  }

  const round = await context.sudo().query.ConnectRound.findOne({
    where: { id: rndId },
    query: `
      id
      status
      classNetwork { id classes { id } }
      opportunities { id }
    `,
  });
  if (!round) {
    throw new Error("Matching round not found.");
  }
  if (round.status === "draft") {
    throw new Error("Cannot record preview visits for a draft round.");
  }

  const networkClassIds = (round.classNetwork?.classes || []).map(
    (c: { id?: string }) => c?.id
  );
  if (!networkClassIds.includes(clsId)) {
    throw new Error("This class is not linked to the round's network.");
  }

  // Class may also appear via klass.networks — already checked via round network.
  const opportunityOnRound = (round.opportunities || []).some(
    (o: { id?: string }) => o?.id === oppId
  );
  if (!opportunityOnRound) {
    throw new Error("Opportunity is not on this matching round.");
  }

  return context.sudo().db.Log.createOne({
    data: {
      event: OPPORTUNITY_PREVIEW_VISIT,
      user: { connect: { id: sessionId } },
      class: { connect: { id: clsId } },
      opportunity: { connect: { id: oppId } },
      content: {
        roundId: rndId,
        openAt: openIso,
        closeAt: closeIso,
        dwellMs,
      },
      createdAt: new Date(),
    },
  });
}

export default recordOpportunityPreviewVisit;
