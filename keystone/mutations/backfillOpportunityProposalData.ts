import { PrismaClient } from "@prisma/client";
import {
  getProposalAnswer,
  isProposalDataEntries,
  upsertProposalEntry,
} from "../lib/opportunityProposalData";
import resolveFormDefinition from "./resolveFormDefinition";

type BackfillArgs = {
  limit?: number;
  dryRun?: boolean;
};

const PROPOSAL_DATA_KEYS = [
  "relevance",
  "requiresSpecialResources",
  "specialResourcesNotes",
  "datasetProvision",
  "datasetProvisionOther",
  "expectedDeliverables",
  "expectedDeliverablesOther",
  "anticipatedObstacles",
  "fieldResearchRequired",
  "fieldResearchTravelDetails",
  "requiredSoftware",
  "requiredSoftwareOther",
  "requiredHardware",
  "requiredHardwareOther",
  "additionalNotes",
  "internshipInterest",
] as const;

type LegacyRow = Partial<Record<(typeof PROPOSAL_DATA_KEYS)[number], unknown>> & {
  id: string;
};

function parseMultiselect(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v) => typeof v === "string");
  }
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter((v) => typeof v === "string");
      }
    } catch {
      // Legacy expectedDeliverables was free text before multiselect.
    }
  }
  return [];
}

function parseLegacyMultiselect(value: unknown): string[] {
  const parsed = parseMultiselect(value);
  if (parsed.length) return parsed;
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

function hasProposalContent(data: Record<string, unknown>): boolean {
  return PROPOSAL_DATA_KEYS.some((key) => {
    const value = data[key];
    if (Array.isArray(value)) return value.length > 0;
    return typeof value === "string" && value.trim().length > 0;
  });
}

function buildProposalDataFromLegacy(
  row: LegacyRow,
  opportunity: {
    issueRelevance?: string | null;
    specialConsiderations?: string | null;
  }
): Record<string, unknown> {
  const expectedDeliverables = parseMultiselect(row.expectedDeliverables);

  return {
    relevance:
      (typeof row.relevance === "string" ? row.relevance : "") ||
      opportunity.issueRelevance ||
      "",
    requiresSpecialResources:
      typeof row.requiresSpecialResources === "string"
        ? row.requiresSpecialResources
        : "",
    specialResourcesNotes:
      typeof row.specialResourcesNotes === "string"
        ? row.specialResourcesNotes
        : "",
    datasetProvision: parseLegacyMultiselect(row.datasetProvision),
    datasetProvisionOther:
      typeof row.datasetProvisionOther === "string"
        ? row.datasetProvisionOther
        : "",
    expectedDeliverables,
    expectedDeliverablesOther:
      typeof row.expectedDeliverablesOther === "string"
        ? row.expectedDeliverablesOther
        : typeof row.expectedDeliverables === "string" &&
            row.expectedDeliverables.trim() &&
            !expectedDeliverables.length
          ? row.expectedDeliverables
          : "",
    anticipatedObstacles:
      typeof row.anticipatedObstacles === "string"
        ? row.anticipatedObstacles
        : "",
    fieldResearchRequired:
      typeof row.fieldResearchRequired === "string"
        ? row.fieldResearchRequired
        : "",
    fieldResearchTravelDetails:
      typeof row.fieldResearchTravelDetails === "string"
        ? row.fieldResearchTravelDetails
        : "",
    requiredSoftware: parseMultiselect(row.requiredSoftware),
    requiredSoftwareOther:
      typeof row.requiredSoftwareOther === "string"
        ? row.requiredSoftwareOther
        : "",
    requiredHardware: parseMultiselect(row.requiredHardware),
    requiredHardwareOther:
      typeof row.requiredHardwareOther === "string"
        ? row.requiredHardwareOther
        : "",
    additionalNotes:
      (typeof row.additionalNotes === "string" ? row.additionalNotes : "") ||
      opportunity.specialConsiderations ||
      "",
    internshipInterest:
      typeof row.internshipInterest === "string" ? row.internshipInterest : "",
  };
}

async function fetchLegacyColumns(
  prisma: PrismaClient,
  ids: string[]
): Promise<Map<string, LegacyRow>> {
  const map = new Map<string, LegacyRow>();
  if (!ids.length) return map;

  const placeholders = ids.map(() => "?").join(", ");
  const sql = `
    SELECT
      id,
      relevance,
      requiresSpecialResources,
      specialResourcesNotes,
      datasetProvision,
      datasetProvisionOther,
      expectedDeliverables,
      expectedDeliverablesOther,
      anticipatedObstacles,
      fieldResearchRequired,
      fieldResearchTravelDetails,
      requiredSoftware,
      requiredSoftwareOther,
      requiredHardware,
      requiredHardwareOther,
      additionalNotes,
      internshipInterest
    FROM Opportunity
    WHERE id IN (${placeholders})
  `;

  try {
    const rows = (await prisma.$queryRawUnsafe(sql, ...ids)) as LegacyRow[];
    for (const row of rows) {
      map.set(row.id, row);
    }
  } catch {
    // Columns may already be dropped after prisma db push — fall back to
    // still-queryable Keystone fields only.
  }

  return map;
}

function isLegacyFlatWithContent(data: unknown): data is Record<string, unknown> {
  return (
    !!data &&
    typeof data === "object" &&
    !Array.isArray(data) &&
    hasProposalContent(data as Record<string, unknown>)
  );
}

export default async function backfillOpportunityProposalData(
  _root: unknown,
  args: BackfillArgs,
  context: any
): Promise<number> {
  const limit = Math.min(Math.max(args?.limit ?? 200, 1), 1000);
  const dryRun = args?.dryRun ?? false;
  const prisma: PrismaClient = context.prisma;

  const formDefinition = await resolveFormDefinition(
    null,
    { key: "opportunity" },
    context
  );
  const formDefinitionId = formDefinition?.id;
  if (!formDefinitionId) {
    throw new Error(
      "backfillOpportunityProposalData: no published FormDefinition for key=opportunity"
    );
  }

  const opportunities = await context.sudo().query.Opportunity.findMany({
    take: limit,
    query: `
      id
      proposalData
      issueRelevance
      specialConsiderations
    `,
  });

  const targets = (opportunities || []).filter((opp: any) => {
    if (!opp?.id) return false;
    const data = opp.proposalData;
    // Already in entry shape with content — skip.
    if (isProposalDataEntries(data)) {
      return !hasProposalContent(getProposalAnswer(data));
    }
    // Legacy flat with content → wrap; empty/missing → rebuild from columns.
    return true;
  });

  if (!targets.length) return 0;

  const needLegacyRebuild = targets.filter(
    (opp: any) => !isLegacyFlatWithContent(opp.proposalData)
  );

  const legacyById = await fetchLegacyColumns(
    prisma,
    needLegacyRebuild.map((opp: { id: string }) => opp.id)
  );

  let updated = 0;

  for (const opp of targets) {
    const data = opp.proposalData;
    let answer: Record<string, unknown>;

    if (isLegacyFlatWithContent(data)) {
      // Wrap existing flat proposalData as-is.
      answer = data;
    } else {
      const legacy = legacyById.get(opp.id) || { id: opp.id };
      answer = buildProposalDataFromLegacy(legacy, opp);
      if (!hasProposalContent(answer)) continue;
    }

    const proposalData = upsertProposalEntry(
      isProposalDataEntries(data) ? data : undefined,
      formDefinitionId,
      answer
    );

    if (!dryRun) {
      await context.db.Opportunity.updateOne({
        where: { id: opp.id },
        data: { proposalData },
      });
    }
    updated += 1;
  }

  return updated;
}
