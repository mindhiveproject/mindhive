import { useMemo, useState } from "react";
import Link from "next/link";
import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";
import { useMutation, useQuery } from "@apollo/client";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { AgGridReact } from "ag-grid-react";

import { ADMIN_MILESTONES } from "../../../Queries/Milestone";
import {
  SEED_MISSING_MILESTONES,
  BACKFILL_LINK_ACTION_CARDS_TO_MILESTONES,
  BACKFILL_MILESTONE_STATUS,
} from "../../../Mutations/Milestone";
import {
  PrimaryButton,
  SecondaryButton,
} from "../Forms/EditorPanelStyles";

const BASELINE_KEYS = [
  "SUBMITTED_AS_PROPOSAL",
  "PEER_REVIEW",
  "DATA_COLLECTION",
  "PROJECT_REPORT",
];

const Shell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 32px clamp(16px, 6vw, 64px);
  background-color: #f7f9f8;
  min-height: 100vh;
  border-radius: 32px 0 0 32px;

  h1 {
    margin: 0;
    font-family: "Lato", sans-serif;
    font-size: clamp(28px, 4vw, 40px);
    font-weight: 600;
    color: #171717;
  }

  p.intro {
    margin: 0;
    color: #5f6871;
    font-size: 14px;
    max-width: 720px;
  }
`;

const GridShell = styled.div`
  width: 100%;
  height: 520px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0px 4px 24px rgba(0, 0, 0, 0.05);

  .ag-theme-quartz .milestone-inactive {
    color: #888;
  }

  .ag-theme-quartz .milestone-key {
    font-family: "Nunito", sans-serif;
    font-weight: 600;
    color: #171717;
  }

  .ag-theme-quartz .milestone-form-pattern {
    font-family: "Nunito", sans-serif;
    font-size: 12px;
    color: #336f8a;
  }

  .ag-theme-quartz .milestone-edit-link {
    color: #336f8a;
    font-weight: 600;
    font-family: "Nunito", sans-serif;
    font-size: 13px;
    text-decoration: none;
  }
`;

const SeedPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px 24px;
  border-radius: 16px;
  background: #eef5f9;
  border: 1px solid #cfdfe7;

  h2 {
    margin: 0;
    font-family: "Lato", sans-serif;
    font-size: 18px;
    color: #171717;
  }

  p {
    margin: 0;
    color: #5f6871;
    font-size: 14px;
    line-height: 1.5;
  }

  .actions {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .feedback {
    color: #1d6b3a;
    font-size: 13px;
  }

  .error {
    color: #871b16;
    font-size: 13px;
  }

  ul {
    margin: 0;
    padding-left: 18px;
    color: #5f6871;
    font-size: 13px;
  }
`;

const FilterBar = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;

  label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 12px;
    color: #5f6871;
    font-family: "Nunito", sans-serif;
    font-weight: 600;
  }

  select {
    border: 1px solid #d3dae0;
    border-radius: 100px;
    padding: 8px 16px;
    background: #ffffff;
    font-family: "Lato", sans-serif;
    font-size: 13px;
    color: #171717;
    min-width: 180px;
  }
`;

function boolLabel(value, t) {
  return value
    ? t("adminMilestones.yes", {}, { default: "Yes" })
    : t("adminMilestones.no", {}, { default: "No" });
}

function EditLinkRenderer({ data, t }) {
  if (data?.scope !== "global" || !data?.id) return "—";
  return (
    <Link
      href={{
        pathname: "/dashboard/admin-milestones",
        query: { id: data.id },
      }}
      className="milestone-edit-link"
    >
      {t("adminMilestones.edit", {}, { default: "Edit" })}
    </Link>
  );
}

export default function ListPage() {
  const { t } = useTranslation("dashboard");
  const [scopeFilter, setScopeFilter] = useState("global");

  const { data, loading, error } = useQuery(ADMIN_MILESTONES, {
    fetchPolicy: "cache-and-network",
  });

  const allRows = useMemo(() => data?.milestones || [], [data]);

  const rows = useMemo(() => {
    return allRows.filter((r) => {
      if (scopeFilter && r.scope !== scopeFilter) return false;
      return true;
    });
  }, [allRows, scopeFilter]);

  const [
    seedMissing,
    { loading: seeding, data: seedData, error: seedError, reset: resetSeed },
  ] = useMutation(SEED_MISSING_MILESTONES, {
    refetchQueries: [{ query: ADMIN_MILESTONES }],
    awaitRefetchQueries: true,
  });

  const existingKeys = useMemo(() => {
    const seen = new Set();
    for (const r of allRows) seen.add(r.key);
    return seen;
  }, [allRows]);

  const missingBaselines = useMemo(
    () => BASELINE_KEYS.filter((k) => !existingKeys.has(k)),
    [existingKeys]
  );

  const handleSeedMissing = async () => {
    try {
      await seedMissing();
    } catch {
      // Apollo populates seedError.
    }
  };

  const [
    backfillCardLinks,
    { loading: backfillingLinks, data: backfillLinksData, error: backfillLinksError },
  ] = useMutation(BACKFILL_LINK_ACTION_CARDS_TO_MILESTONES, {
    refetchQueries: [{ query: ADMIN_MILESTONES }],
  });

  const [
    backfillStatus,
    { loading: backfillingStatus, data: backfillStatusData, error: backfillStatusError },
  ] = useMutation(BACKFILL_MILESTONE_STATUS, {
    refetchQueries: [{ query: ADMIN_MILESTONES }],
  });

  const handleBackfillLinks = async () => {
    try {
      await backfillCardLinks({ variables: { dryRun: false } });
    } catch {
      // Apollo populates backfillLinksError.
    }
  };

  const handleBackfillStatus = async () => {
    try {
      await backfillStatus({ variables: { dryRun: false } });
    } catch {
      // Apollo populates backfillStatusError.
    }
  };

  const backfillLinksCount =
    backfillLinksData?.backfillLinkActionCardsToMilestones ?? null;
  const backfillStatusCount = backfillStatusData?.backfillMilestoneStatus ?? null;

  const seedCount = seedData?.seedMissingMilestones?.length || 0;
  const seededKeys =
    seedData?.seedMissingMilestones?.map((m) => m.key).join(", ") || "";

  const columnDefs = useMemo(
    () => [
      {
        field: "key",
        headerName: t("adminMilestones.colKey", {}, { default: "Key" }),
        filter: true,
        sortable: true,
        minWidth: 180,
        cellClass: "milestone-key",
      },
      {
        field: "title",
        headerName: t("adminMilestones.colTitle", {}, { default: "Title" }),
        filter: true,
        sortable: true,
        flex: 1,
        minWidth: 160,
      },
      {
        field: "scope",
        headerName: t("adminMilestones.colScope", {}, { default: "Scope" }),
        filter: true,
        sortable: true,
        width: 110,
      },
      {
        field: "actionCardType",
        headerName: t("adminMilestones.colActionCard", {}, { default: "Action card" }),
        filter: true,
        sortable: true,
        minWidth: 150,
        valueFormatter: (p) => p.value || "—",
      },
      {
        field: "statusTarget",
        headerName: t("adminMilestones.colStatusTarget", {}, { default: "Status target" }),
        filter: true,
        sortable: true,
        width: 130,
      },
      {
        field: "formDefinitionKeyPattern",
        headerName: t("adminMilestones.colFormPattern", {}, { default: "Form key pattern" }),
        filter: true,
        sortable: true,
        minWidth: 220,
        cellClass: "milestone-form-pattern",
        valueFormatter: (p) => p.value || "—",
      },
      {
        field: "isActive",
        headerName: t("adminMilestones.colActive", {}, { default: "Active" }),
        filter: true,
        sortable: true,
        width: 100,
        valueFormatter: (p) => boolLabel(p.value, t),
      },
      {
        field: "showInFeedbackCenter",
        headerName: t("adminMilestones.colFeedbackCenter", {}, { default: "Feedback center" }),
        filter: true,
        sortable: true,
        width: 150,
        valueFormatter: (p) => boolLabel(p.value, t),
      },
      {
        field: "actions",
        headerName: t("adminMilestones.colActions", {}, { default: "Actions" }),
        sortable: false,
        filter: false,
        width: 100,
        pinned: "right",
        cellRenderer: (params) => (
          <EditLinkRenderer data={params.data} t={t} />
        ),
      },
    ],
    [t]
  );

  const defaultColDef = useMemo(
    () => ({
      resizable: true,
      suppressMovable: false,
    }),
    []
  );

  const rowClassRules = useMemo(
    () => ({
      "milestone-inactive": (params) => params.data && !params.data.isActive,
    }),
    []
  );

  return (
    <Shell>
      <h1>{t("adminMilestones.pageTitle", {}, { default: "Milestones" })}</h1>

      {missingBaselines.length > 0 ? (
        <SeedPanel>
          <h2>
            {t("adminMilestones.seedPanelTitle", {}, { default: "Seed default milestones" })}
          </h2>
          <p>
            {missingBaselines.length === BASELINE_KEYS.length
              ? t(
                  "adminMilestones.seedPanelAllMissing",
                  {},
                  {
                    default:
                      "Nothing seeded yet. Click below to install the four baseline milestones (Proposal Feedback, Peer Feedback, Data Collection, Project Report).",
                  }
                )
              : t(
                  "adminMilestones.seedPanelSomeMissing",
                  {},
                  {
                    default:
                      "Some default milestones are missing. Clicking below will only install the ones that don't already exist — your edited milestones stay untouched.",
                  }
                )}
          </p>
          <ul>
            {missingBaselines.map((k) => (
              <li key={k}>
                <code>{k}</code>
              </li>
            ))}
          </ul>
          <div className="actions">
            <PrimaryButton
              type="button"
              onClick={handleSeedMissing}
              disabled={seeding}
            >
              {seeding
                ? t("adminMilestones.seeding", {}, { default: "Seeding…" })
                : t(
                    missingBaselines.length === 1
                      ? "adminMilestones.seedButton"
                      : "adminMilestones.seedButton_plural",
                    { count: missingBaselines.length },
                    {
                      default:
                        missingBaselines.length === 1
                          ? "Seed {{count}} missing milestone"
                          : "Seed {{count}} missing milestones",
                    }
                  )}
            </PrimaryButton>
            {seedError ? (
              <span className="error">
                {seedError.message?.replace(/^Error: /, "") || String(seedError)}
              </span>
            ) : null}
          </div>
        </SeedPanel>
      ) : null}

      {seedCount > 0 ? (
        <SeedPanel style={{ background: "#e9f5ec", borderColor: "#a9d3b5" }}>
          <p className="feedback">
            {t(
              seedCount === 1
                ? "adminMilestones.seedSuccess"
                : "adminMilestones.seedSuccess_plural",
              { count: seedCount, keys: seededKeys },
              {
                default:
                  seedCount === 1
                    ? "Seeded {{count}} milestone: {{keys}}."
                    : "Seeded {{count}} milestones: {{keys}}.",
              }
            )}
          </p>
          <div className="actions">
            <SecondaryButton type="button" onClick={() => resetSeed()}>
              {t("adminMilestones.dismiss", {}, { default: "Dismiss" })}
            </SecondaryButton>
          </div>
        </SeedPanel>
      ) : null}

      <SeedPanel style={{ background: "#f5f0eb", borderColor: "#e0d4c8" }}>
        <h2>
          {t("adminMilestones.backfillPanelTitle", {}, { default: "Backfill existing boards" })}
        </h2>
        <p>
          {t(
            "adminMilestones.backfillPanelBody",
            {},
            {
              default:
                "Link action cards on class templates to global milestones and copy legacy board status columns into milestoneStatus JSON.",
            }
          )}
        </p>
        <div className="actions">
          <SecondaryButton
            type="button"
            onClick={handleBackfillLinks}
            disabled={backfillingLinks || backfillingStatus}
          >
            {backfillingLinks
              ? t("adminMilestones.backfilling", {}, { default: "Running…" })
              : t("adminMilestones.backfillLinksButton", {}, { default: "Link action cards" })}
          </SecondaryButton>
          <SecondaryButton
            type="button"
            onClick={handleBackfillStatus}
            disabled={backfillingLinks || backfillingStatus}
          >
            {backfillingStatus
              ? t("adminMilestones.backfilling", {}, { default: "Running…" })
              : t("adminMilestones.backfillStatusButton", {}, { default: "Backfill milestone status" })}
          </SecondaryButton>
        </div>
        {backfillLinksCount != null ? (
          <p className="feedback">
            {t(
              "adminMilestones.backfillLinksSuccess",
              { count: backfillLinksCount },
              { default: "Linked {{count}} action cards to milestones." }
            )}
          </p>
        ) : null}
        {backfillStatusCount != null ? (
          <p className="feedback">
            {t(
              "adminMilestones.backfillStatusSuccess",
              { count: backfillStatusCount },
              { default: "Updated milestone status on {{count}} boards." }
            )}
          </p>
        ) : null}
        {backfillLinksError ? (
          <span className="error">
            {backfillLinksError.message?.replace(/^Error: /, "") ||
              String(backfillLinksError)}
          </span>
        ) : null}
        {backfillStatusError ? (
          <span className="error">
            {backfillStatusError.message?.replace(/^Error: /, "") ||
              String(backfillStatusError)}
          </span>
        ) : null}
      </SeedPanel>

      <p className="intro">
        {t(
          "adminMilestones.intro",
          {},
          {
            default:
              "Global review steps used across project boards. Edit titles, visibility, and review form key patterns. Template-scoped milestones are listed for reference.",
          }
        )}
      </p>

      <FilterBar>
        <label>
          {t("adminMilestones.filterScope", {}, { default: "Scope" })}
          <select
            value={scopeFilter}
            onChange={(e) => setScopeFilter(e.target.value)}
          >
            <option value="">
              {t("adminMilestones.filterScopeAll", {}, { default: "All" })}
            </option>
            <option value="global">
              {t("adminMilestones.filterScopeGlobal", {}, { default: "Global" })}
            </option>
            <option value="template">
              {t("adminMilestones.filterScopeTemplate", {}, { default: "Template" })}
            </option>
          </select>
        </label>
        {scopeFilter && (
          <SecondaryButton type="button" onClick={() => setScopeFilter("")}>
            {t("adminMilestones.clearFilters", {}, { default: "Clear filters" })}
          </SecondaryButton>
        )}
      </FilterBar>

      {loading && rows.length === 0 ? (
        <p>{t("adminMilestones.loading", {}, { default: "Loading…" })}</p>
      ) : null}
      {error ? (
        <p style={{ color: "#871b16" }}>
          {t(
            "adminMilestones.loadError",
            { message: error.message },
            { default: "Couldn't load milestones: {{message}}" }
          )}
        </p>
      ) : null}
      {!loading && rows.length === 0 ? (
        <p>{t("adminMilestones.empty", {}, { default: "No milestones yet. Use the seed panel above to install defaults." })}</p>
      ) : null}

      {rows.length > 0 ? (
        <GridShell className="ag-theme-quartz">
          <AgGridReact
            rowData={rows}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            rowClassRules={rowClassRules}
            pagination
            paginationPageSize={50}
            paginationPageSizeSelector={[20, 50, 100]}
            autoSizeStrategy={{ type: "fitGridWidth", defaultMinWidth: 100 }}
          />
        </GridShell>
      ) : null}
    </Shell>
  );
}
