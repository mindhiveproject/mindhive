// Admin: list of all FormDefinition rows. Read-only for now — Phase 6b
// adds "+ New" / duplicate / archive actions.
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import styled from "styled-components";
import { useMutation, useQuery } from "@apollo/client";

import { ADMIN_FORM_DEFINITIONS } from "../../../Queries/FormDefinition";
import {
  DELETE_FORM_DEFINITION,
  DUPLICATE_FORM_DEFINITION,
  SEED_MISSING_FORMS,
  BACKFILL_PROJECT_BOARD_FORM_SCOPE,
} from "../../../Mutations/FormDefinition";
import NewDefinitionForm from "./NewDefinitionForm";
import { PrimaryButton, SecondaryButton } from "./EditorPanelStyles";

const SURFACE_LABEL = {
  profile_individual: "Individual profile",
  profile_organization: "Organization profile",
  opportunity: "Opportunity",
  feedback: "Feedback",
};

// Keys are lowercase everywhere post-unification. If you add a new
// baseline key here, also add its seed data in
// keystone/mutations/seedData/ and the seedMissingForms mutation.
const BASELINE_KEYS = [
  "opportunity",
  "profile_individual",
  "profile_organization",
  "review_submitted_as_proposal_mindhive",
  "review_peer_review_mindhive",
  "review_project_report_mindhive",
  "review_submitted_as_proposal_youquantified",
  "review_peer_review_youquantified",
  "review_project_report_youquantified",
  "review_submitted_as_proposal_nyu_cusp",
  "review_peer_review_nyu_cusp",
  "review_project_report_nyu_cusp",
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

const Table = styled.table`
  width: 100%;
  background: #ffffff;
  border-radius: 16px;
  border-collapse: separate;
  border-spacing: 0;
  overflow: hidden;
  box-shadow: 0px 4px 24px rgba(0, 0, 0, 0.05);

  th,
  td {
    padding: 12px 16px;
    border-bottom: 1px solid #eef1f2;
    text-align: left;
    font-size: 14px;
    vertical-align: middle;
  }

  th {
    background: #f7f9f8;
    color: #5f6871;
    font-weight: 600;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  tr:last-child td {
    border-bottom: none;
  }

  tr.muted td {
    color: #888;
  }

  td.key {
    font-family: "Nunito", sans-serif;
    font-weight: 600;
    color: #171717;
  }

  td.actions {
    white-space: nowrap;
  }

  td.actions a,
  td.actions button {
    color: #336f8a;
    text-decoration: none;
    font-weight: 600;
    margin-right: 12px;
    background: none;
    border: none;
    cursor: pointer;
    font-family: "Nunito", sans-serif;
    font-size: 13px;
    padding: 0;
  }

  td.actions button.danger {
    color: #c0392b;
  }
`;

const TopRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
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

  select,
  input {
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

const StatusPill = styled.span`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 100px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: ${({ $status }) =>
    $status === "published" ? "#1d6b3a" :
    $status === "draft" ? "#8a6d3b" :
    "#5f6871"};
  color: #ffffff;
`;

function fmtDate(s) {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleDateString();
  } catch {
    return s;
  }
}

export default function ListPage() {
  const router = useRouter();
  const [newOpen, setNewOpen] = useState(false);
  const [keyFilter, setKeyFilter] = useState("");
  const [scopeFilter, setScopeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [surfaceFilter, setSurfaceFilter] = useState("");
  const { data, loading, error } = useQuery(ADMIN_FORM_DEFINITIONS, {
    fetchPolicy: "cache-and-network",
  });

  const allRows = useMemo(() => data?.formDefinitions || [], [data]);

  const keyOptions = useMemo(() => {
    const seen = new Set();
    for (const r of allRows) seen.add(r.key);
    return Array.from(seen).sort();
  }, [allRows]);

  const rows = useMemo(() => {
    return allRows.filter((r) => {
      if (keyFilter && r.key !== keyFilter) return false;
      if (scopeFilter && r.scope !== scopeFilter) return false;
      if (statusFilter && r.status !== statusFilter) return false;
      if (surfaceFilter && r.surface !== surfaceFilter) return false;
      return true;
    });
  }, [allRows, keyFilter, scopeFilter, statusFilter, surfaceFilter]);

  const [duplicateDef, { loading: duplicating }] = useMutation(
    DUPLICATE_FORM_DEFINITION,
    {
      refetchQueries: [{ query: ADMIN_FORM_DEFINITIONS }],
      awaitRefetchQueries: true,
    }
  );
  const [deleteDef, { loading: deleting }] = useMutation(
    DELETE_FORM_DEFINITION,
    {
      refetchQueries: [{ query: ADMIN_FORM_DEFINITIONS }],
      awaitRefetchQueries: true,
    }
  );
  const [
    seedMissing,
    { loading: seeding, data: seedData, error: seedError, reset: resetSeed },
  ] = useMutation(SEED_MISSING_FORMS, {
    refetchQueries: [{ query: ADMIN_FORM_DEFINITIONS }],
    awaitRefetchQueries: true,
  });

  const [
    runBackfill,
    { loading: backfilling, data: backfillData, error: backfillError, reset: resetBackfill },
  ] = useMutation(BACKFILL_PROJECT_BOARD_FORM_SCOPE, {
    refetchQueries: [{ query: ADMIN_FORM_DEFINITIONS }],
    awaitRefetchQueries: true,
  });

  const [backfillPanelOpen, setBackfillPanelOpen] = useState(false);
  const [backfillMode, setBackfillMode] = useState(null); // "preview" | "applied"

  const backfillChanges = backfillData?.backfillProjectBoardFormScope || [];

  const handleBackfillPreview = async () => {
    try {
      resetBackfill();
      await runBackfill({ variables: { dryRun: true } });
      setBackfillMode("preview");
    } catch {}
  };
  const handleBackfillApply = async () => {
    try {
      resetBackfill();
      await runBackfill({ variables: { dryRun: false } });
      setBackfillMode("applied");
    } catch {}
  };

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
      // Apollo populates seedError; rendered below.
    }
  };

  const handleDuplicate = async (row) => {
    const res = await duplicateDef({ variables: { id: row.id } });
    const newId = res?.data?.duplicateFormDefinition?.id;
    if (newId) {
      router.push({
        pathname: "/dashboard/admin-forms",
        query: { id: newId },
      });
    }
  };

  const handleDelete = async (row) => {
    if (
      !window.confirm(
        `Delete "${row.title}" (v${row.version})? This cannot be undone; all cards and fields are removed.`
      )
    ) {
      return;
    }
    await deleteDef({ variables: { id: row.id } });
  };

  return (
    <Shell>
      <TopRow>
        <h1>Form definitions</h1>
        <PrimaryButton type="button" onClick={() => setNewOpen((v) => !v)}>
          {newOpen ? "Close form" : "+ New definition"}
        </PrimaryButton>
      </TopRow>
      <NewDefinitionForm open={newOpen} onClose={() => setNewOpen(false)} />

      {missingBaselines.length > 0 ? (
        <SeedPanel>
          <h2>Seed default forms</h2>
          <p>
            {missingBaselines.length === BASELINE_KEYS.length
              ? "Nothing seeded yet. Click below to install the default forms (Opportunity, Profile — individual, Profile — organization, and review forms for proposal, peer, and project report across MindHive, YouQuantified, and NYU CUSP). They publish as version 1 immediately."
              : "Some default forms are missing. Clicking below will only install the ones that don't already exist — your edited definitions stay untouched."}
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
              {seeding ? "Seeding…" : `Seed ${missingBaselines.length} missing form${missingBaselines.length === 1 ? "" : "s"}`}
            </PrimaryButton>
            {seedError ? (
              <span className="error">
                {seedError.message?.replace(/^Error: /, "") ||
                  String(seedError)}
              </span>
            ) : null}
          </div>
        </SeedPanel>
      ) : null}

      {seedData?.seedMissingForms?.length > 0 ? (
        <SeedPanel style={{ background: "#e9f5ec", borderColor: "#a9d3b5" }}>
          <p className="feedback">
            Seeded {seedData.seedMissingForms.length} form
            {seedData.seedMissingForms.length === 1 ? "" : "s"}:{" "}
            {seedData.seedMissingForms.map((d) => d.key).join(", ")}.
          </p>
          <div className="actions">
            <SecondaryButton type="button" onClick={() => resetSeed()}>
              Dismiss
            </SecondaryButton>
          </div>
        </SeedPanel>
      ) : null}

      {/* Admin backfill: project-board scope migration. */}
      <SeedPanel
        style={{
          background: backfillPanelOpen ? "#fff8e6" : "#f7f9f8",
          borderColor: backfillPanelOpen ? "#f0d39a" : "#d3dae0",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2 style={{ margin: 0 }}>Backfill: project-board form scope</h2>
            <p style={{ margin: "4px 0 0" }}>
              Legacy auto-provisioned template-milestone forms live at
              scope=global with unique keys. This migration relocates them
              to scope=project_board with the correct proposalBoard set.
              Idempotent + reversible via Keystone admin.
            </p>
          </div>
          <SecondaryButton
            type="button"
            onClick={() => {
              setBackfillPanelOpen((v) => !v);
              if (!backfillPanelOpen) {
                resetBackfill();
                setBackfillMode(null);
              }
            }}
          >
            {backfillPanelOpen ? "Close" : "Show tool"}
          </SecondaryButton>
        </div>

        {backfillPanelOpen ? (
          <>
            <div className="actions">
              <PrimaryButton
                type="button"
                onClick={handleBackfillPreview}
                disabled={backfilling}
              >
                {backfilling && backfillMode !== "applied"
                  ? "Previewing…"
                  : "Preview changes (dry-run)"}
              </PrimaryButton>
              <PrimaryButton
                type="button"
                onClick={handleBackfillApply}
                disabled={
                  backfilling || backfillMode !== "preview" ||
                  backfillChanges.length === 0
                }
                style={{ background: "#8a6d3b" }}
              >
                {backfilling && backfillMode === "applied"
                  ? "Applying…"
                  : "Apply"}
              </PrimaryButton>
              {backfillError ? (
                <span className="error">
                  {backfillError.message?.replace(/^Error: /, "") ||
                    String(backfillError)}
                </span>
              ) : null}
            </div>
            {backfillChanges.length > 0 ? (
              <ul style={{ marginTop: 6, paddingLeft: 20 }}>
                {backfillChanges.map((line, i) => (
                  <li
                    key={i}
                    style={{
                      fontFamily:
                        i === 0 ? "inherit" : "'Nunito', monospace",
                      fontSize: 13,
                      color: i === 0 ? "#171717" : "#5f6871",
                      marginBottom: 2,
                    }}
                  >
                    {line}
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        ) : null}
      </SeedPanel>

      <p className="intro">
        Customize the Profile and Opportunity forms across MindHive Connect.
        Edit a definition to change which fields appear, in what order, with
        what labels and validation. Publish a draft to make it live.
      </p>
      <FilterBar>
        <label>
          Surface
          <select
            value={surfaceFilter}
            onChange={(e) => setSurfaceFilter(e.target.value)}
          >
            <option value="">All</option>
            <option value="profile_individual">Individual profile</option>
            <option value="profile_organization">Organization profile</option>
            <option value="opportunity">Opportunity</option>
            <option value="feedback">Feedback (review)</option>
          </select>
        </label>
        <label>
          Key
          <select
            value={keyFilter}
            onChange={(e) => setKeyFilter(e.target.value)}
          >
            <option value="">All</option>
            {keyOptions.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </label>
        <label>
          Scope
          <select
            value={scopeFilter}
            onChange={(e) => setScopeFilter(e.target.value)}
          >
            <option value="">All</option>
            <option value="global">Global</option>
            <option value="organization">Organization</option>
            <option value="class_network">Class network</option>
            <option value="project_board">Project board</option>
          </select>
        </label>
        <label>
          Status
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        {(keyFilter || scopeFilter || statusFilter || surfaceFilter) && (
          <SecondaryButton
            type="button"
            onClick={() => {
              setKeyFilter("");
              setScopeFilter("");
              setSurfaceFilter("");
              setStatusFilter("");
            }}
          >
            Clear filters
          </SecondaryButton>
        )}
      </FilterBar>
      {loading && rows.length === 0 ? <p>Loading…</p> : null}
      {error ? (
        <p style={{ color: "#871b16" }}>
          Couldn't load definitions: {error.message}
        </p>
      ) : null}
      {!loading && rows.length === 0 ? (
        <p>No form definitions yet. Seed them with the seed mutations.</p>
      ) : null}
      {rows.length > 0 ? (
        <Table>
          <thead>
            <tr>
              <th>Surface</th>
              <th>Key</th>
              <th>Title</th>
              <th>Scope</th>
              <th>Version</th>
              <th>Status</th>
              <th>Published</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={r.status === "archived" ? "muted" : ""}>
                <td>{SURFACE_LABEL[r.surface] || "—"}</td>
                <td className="key">{r.key}</td>
                <td>{r.title}</td>
                <td>
                  {r.scope === "organization" && r.organization?.name
                    ? `org: ${r.organization.name}`
                    : r.scope === "class_network" && r.classNetwork?.title
                      ? `network: ${r.classNetwork.title}`
                      : r.scope === "project_board" && r.proposalBoard?.title
                        ? `board: ${r.proposalBoard.title}`
                        : r.scope}
                </td>
                <td>v{r.version}</td>
                <td>
                  <StatusPill $status={r.status}>{r.status}</StatusPill>
                </td>
                <td>{fmtDate(r.publishedAt)}</td>
                <td className="actions">
                  <Link
                    href={{
                      pathname: "/dashboard/admin-forms",
                      query: { id: r.id },
                    }}
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDuplicate(r)}
                    disabled={duplicating}
                  >
                    Duplicate
                  </button>
                  <button
                    type="button"
                    className="danger"
                    onClick={() => handleDelete(r)}
                    disabled={deleting}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : null}
    </Shell>
  );
}
