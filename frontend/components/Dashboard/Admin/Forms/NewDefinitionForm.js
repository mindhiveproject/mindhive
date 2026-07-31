// Two-step "+ New form definition" wizard. Step 1 picks the consumer
// surface (individual profile / organization profile / opportunity /
// feedback). Step 2 collects surface-specific inputs and composes the
// key admins used to have to remember and type by hand.
//
// The key remains the load-bearing identifier internally — this
// wizard just guides admins to always produce well-formed ones.
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import { Dropdown } from "semantic-ui-react";
import styled from "styled-components";

import { CREATE_FORM_DEFINITION } from "../../../Mutations/FormDefinition";
import { ADMIN_FORM_DEFINITIONS } from "../../../Queries/FormDefinition";
import { ALL_ORGANIZATIONS_LITE } from "../../../Queries/Organization";
import { GET_ALL_NETWORKS } from "../../../Queries/ClassNetwork";
import { TEMPLATE_PROPOSAL_BOARDS_LITE } from "../../../Queries/Proposal";
import {
  FieldRow,
  PrimaryButton,
  SecondaryButton,
} from "./EditorPanelStyles";

const Shell = styled.div`
  display: ${({ $open }) => ($open ? "flex" : "none")};
  flex-direction: column;
  gap: 20px;
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0px 4px 24px rgba(0, 0, 0, 0.05);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;

  h2 {
    margin: 0;
    font-family: "Lato", sans-serif;
    font-size: 18px;
    color: #171717;
  }
`;

const SurfaceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
`;

const SurfaceTile = styled.button`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px 18px;
  border-radius: 12px;
  border: 2px solid
    ${({ $active }) => ($active ? "#336f8a" : "#d3dae0")};
  background: ${({ $active }) => ($active ? "#eef5f9" : "#ffffff")};
  cursor: pointer;
  text-align: left;
  font-family: inherit;

  .surface-label {
    font-family: "Lato", sans-serif;
    font-size: 15px;
    font-weight: 600;
    color: #171717;
  }

  .surface-hint {
    font-family: "Lato", sans-serif;
    font-size: 12px;
    color: #5f6871;
    line-height: 1.4;
  }

  &:hover {
    border-color: #336f8a;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
`;

const KeyPreview = styled.div`
  padding: 10px 14px;
  border-radius: 8px;
  background: #f7f9f8;
  border: 1px dashed #d3dae0;
  font-family: "Nunito", monospace;
  font-size: 13px;
  color: #171717;

  strong {
    color: #336f8a;
  }
`;

const SURFACES = [
  {
    value: "profile_individual",
    label: "Individual profile",
    hint: "The About page of an individual account (student / teacher / mentor).",
  },
  {
    value: "profile_organization",
    label: "Organization profile",
    hint: "The About page of a sponsor account — writes to both Profile and linked Organization.",
  },
  {
    value: "opportunity",
    label: "Opportunity",
    hint: "The mentor's Opportunity editor in Connect.",
  },
  {
    value: "feedback",
    label: "Feedback (review)",
    hint: "A milestone review form. One key per (stage × curriculum) pair.",
  },
];

// Preset stage + curriculum options for the feedback wizard. The
// dropdowns allow additions — admins can type a brand-new stage or
// curriculum and the wizard normalises it into the naming convention
// used by the resolver (stage → UPPER_SNAKE, curriculum → lower_snake).
const DEFAULT_STAGE_OPTIONS = [
  { key: "submitted_as_proposal", value: "submitted_as_proposal", text: "Submitted as proposal" },
  { key: "peer_review", value: "peer_review", text: "Peer review" },
  { key: "project_report", value: "project_report", text: "Project report" },
];

const DEFAULT_CURRICULUM_OPTIONS = [
  { key: "mindhive", value: "mindhive", text: "MindHive" },
  { key: "youquantified", value: "youquantified", text: "YouQuantified" },
  { key: "nyu_cusp", value: "nyu_cusp", text: "NYU CUSP" },
];

function normalizeStage(input) {
  // Stages are lowercase snake_case, matching how slugifyMilestoneKey
  // (keystone/mutations/resolveMilestonesForBoard.ts) slugifies template
  // milestone titles. Keeps composed keys like
  // `review_brainstorm_mindhive` consistent whether they came from the
  // seed, the wizard, or a template-milestone auto-creation.
  if (!input) return "";
  return String(input)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizeCurriculum(input) {
  if (!input) return "";
  return String(input)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

const KEY_FOR_SURFACE = {
  profile_individual: "profile_individual",
  profile_organization: "profile_organization",
  opportunity: "opportunity",
};

function composedKey(surface, stage, curriculum) {
  if (surface !== "feedback") return KEY_FOR_SURFACE[surface] || "";
  if (!stage || !curriculum) return "";
  return `review_${stage}_${curriculum}`;
}

function suggestedTitle(surface, stage, curriculum, stageOpts, currOpts) {
  const surfaceLabel = SURFACES.find((s) => s.value === surface)?.label || "";
  if (surface !== "feedback") return surfaceLabel;
  const stageLabel =
    stageOpts.find((o) => o.value === stage)?.text || stage || "";
  const currLabel =
    currOpts.find((o) => o.value === curriculum)?.text || curriculum || "";
  if (!stageLabel || !currLabel) return surfaceLabel;
  return `${currLabel} — ${stageLabel}`;
}

export default function NewDefinitionForm({ open, onClose }) {
  const router = useRouter();
  const [surface, setSurface] = useState(null);
  const [title, setTitle] = useState("");
  const [scope, setScope] = useState("global");
  const [organizationId, setOrganizationId] = useState(null);
  const [classNetworkId, setClassNetworkId] = useState(null);
  const [proposalBoardId, setProposalBoardId] = useState(null);
  const [reviewStage, setReviewStage] = useState(null);
  const [reviewCurriculum, setReviewCurriculum] = useState(null);
  const [stageOptions, setStageOptions] = useState(DEFAULT_STAGE_OPTIONS);
  const [curriculumOptions, setCurriculumOptions] = useState(
    DEFAULT_CURRICULUM_OPTIONS
  );
  const [titleTouched, setTitleTouched] = useState(false);
  const [error, setError] = useState(null);

  const { data: orgsData, loading: orgsLoading } = useQuery(
    ALL_ORGANIZATIONS_LITE,
    { skip: !open || scope !== "organization" }
  );
  const { data: netsData, loading: netsLoading } = useQuery(
    GET_ALL_NETWORKS,
    { skip: !open || scope !== "class_network" }
  );
  const { data: boardsData, loading: boardsLoading } = useQuery(
    TEMPLATE_PROPOSAL_BOARDS_LITE,
    { skip: !open || scope !== "project_board" }
  );

  const orgOptions = useMemo(() => {
    const list = orgsData?.organizations || [];
    return list.map((o) => ({ key: o.id, value: o.id, text: o.name }));
  }, [orgsData]);
  const netOptions = useMemo(() => {
    const list = netsData?.classNetworks || [];
    return list.map((n) => ({ key: n.id, value: n.id, text: n.title }));
  }, [netsData]);
  const boardOptions = useMemo(() => {
    const list = boardsData?.proposalBoards || [];
    return list.map((b) => ({
      key: b.id,
      value: b.id,
      text: b.title || "(untitled board)",
    }));
  }, [boardsData]);

  const key = composedKey(surface, reviewStage, reviewCurriculum);
  const autoTitle = suggestedTitle(
    surface,
    reviewStage,
    reviewCurriculum,
    stageOptions,
    curriculumOptions
  );
  const effectiveTitle = titleTouched ? title : autoTitle;

  const handleAddStage = (_, { value: raw }) => {
    const normalized = normalizeStage(raw);
    if (!normalized) return;
    if (stageOptions.some((o) => o.value === normalized)) return;
    setStageOptions((prev) => [
      ...prev,
      { key: normalized, value: normalized, text: normalized },
    ]);
  };
  const handleChangeStage = (_, { value: raw }) => {
    const normalized = normalizeStage(raw);
    setReviewStage(normalized || null);
  };

  const handleAddCurriculum = (_, { value: raw }) => {
    const normalized = normalizeCurriculum(raw);
    if (!normalized) return;
    if (curriculumOptions.some((o) => o.value === normalized)) return;
    setCurriculumOptions((prev) => [
      ...prev,
      { key: normalized, value: normalized, text: normalized },
    ]);
  };
  const handleChangeCurriculum = (_, { value: raw }) => {
    const normalized = normalizeCurriculum(raw);
    setReviewCurriculum(normalized || null);
  };

  const [createDefinition, { loading }] = useMutation(
    CREATE_FORM_DEFINITION,
    {
      refetchQueries: [{ query: ADMIN_FORM_DEFINITIONS }],
      awaitRefetchQueries: true,
    }
  );

  const handleCreate = async () => {
    setError(null);
    if (!surface) {
      setError("Pick a surface first.");
      return;
    }
    if (surface === "feedback" && (!reviewStage || !reviewCurriculum)) {
      setError("Feedback forms need both a stage and a curriculum.");
      return;
    }
    if (!effectiveTitle.trim()) {
      setError("Title is required.");
      return;
    }
    if (scope === "organization" && !organizationId) {
      setError("Pick an organization for this scope.");
      return;
    }
    if (scope === "class_network" && !classNetworkId) {
      setError("Pick a class network for this scope.");
      return;
    }
    if (scope === "project_board" && !proposalBoardId) {
      setError("Pick a template board for this scope.");
      return;
    }
    const input = {
      key,
      title: effectiveTitle.trim(),
      surface,
      scope,
      status: "draft",
      version: 1,
    };
    if (scope === "organization" && organizationId) {
      input.organization = { connect: { id: organizationId } };
    }
    if (scope === "class_network" && classNetworkId) {
      input.classNetwork = { connect: { id: classNetworkId } };
    }
    if (scope === "project_board" && proposalBoardId) {
      input.proposalBoard = { connect: { id: proposalBoardId } };
    }
    try {
      const res = await createDefinition({ variables: { input } });
      const id = res?.data?.createFormDefinition?.id;
      if (id) {
        router.push({
          pathname: "/dashboard/admin-forms",
          query: { id },
        });
      }
    } catch (e) {
      setError(e?.message || "Failed to create.");
    }
  };

  const surfaceIsFeedback = surface === "feedback";

  return (
    <Shell $open={open}>
      <Header>
        <h2>New form definition</h2>
        <SecondaryButton type="button" onClick={onClose}>
          Cancel
        </SecondaryButton>
      </Header>

      <div>
        <div style={{ fontSize: 13, color: "#5f6871", marginBottom: 8 }}>
          Step 1 — pick a surface
        </div>
        <SurfaceGrid>
          {SURFACES.map((s) => (
            <SurfaceTile
              key={s.value}
              type="button"
              $active={surface === s.value}
              onClick={() => setSurface(s.value)}
            >
              <span className="surface-label">{s.label}</span>
              <span className="surface-hint">{s.hint}</span>
            </SurfaceTile>
          ))}
        </SurfaceGrid>
      </div>

      {surface ? (
        <>
          <div style={{ fontSize: 13, color: "#5f6871" }}>
            Step 2 — details
          </div>
          <Grid>
            {surfaceIsFeedback ? (
              <>
                <FieldRow>
                  <span className="label-text">Stage</span>
                  <span className="hint">
                    Pick one, or type a new one (normalized to{" "}
                    <code>lower_snake_case</code>).
                  </span>
                  <Dropdown
                    selection
                    search
                    allowAdditions
                    additionLabel="Use custom stage: "
                    noResultsMessage="Type a new stage name and hit Enter."
                    placeholder="Pick or type a stage…"
                    options={stageOptions}
                    value={reviewStage}
                    onAddItem={handleAddStage}
                    onChange={handleChangeStage}
                  />
                </FieldRow>
                <FieldRow>
                  <span className="label-text">Curriculum</span>
                  <span className="hint">
                    Pick one, or type a new curriculum name (normalized to{" "}
                    <code>lower_snake_case</code>).
                  </span>
                  <Dropdown
                    selection
                    search
                    allowAdditions
                    additionLabel="Use custom curriculum: "
                    noResultsMessage="Type a new curriculum name and hit Enter."
                    placeholder="Pick or type a curriculum…"
                    options={curriculumOptions}
                    value={reviewCurriculum}
                    onAddItem={handleAddCurriculum}
                    onChange={handleChangeCurriculum}
                  />
                </FieldRow>
              </>
            ) : null}

            <FieldRow>
              <span className="label-text">Title</span>
              <span className="hint">
                Auto-suggested — override if you want a custom label.
              </span>
              <input
                type="text"
                value={effectiveTitle}
                onChange={(e) => {
                  setTitleTouched(true);
                  setTitle(e.target.value);
                }}
                placeholder={autoTitle}
              />
            </FieldRow>

            <FieldRow>
              <span className="label-text">Scope</span>
              <select
                value={scope}
                onChange={(e) => {
                  setScope(e.target.value);
                  setOrganizationId(null);
                  setClassNetworkId(null);
                  setProposalBoardId(null);
                }}
              >
                <option value="global">Global</option>
                <option value="organization">Organization</option>
                <option value="class_network">Class network</option>
                <option value="project_board">Project board (template)</option>
              </select>
              <span className="hint">
                project_board &gt; class_network &gt; organization &gt; global at
                resolve time. Student boards inherit forms scoped to the
                template they cloned from.
              </span>
            </FieldRow>

            {scope === "organization" ? (
              <FieldRow>
                <span className="label-text">Organization</span>
                <Dropdown
                  selection
                  search
                  openOnFocus={false}
                  loading={orgsLoading}
                  placeholder="Pick an organization…"
                  options={orgOptions}
                  value={organizationId}
                  onChange={(_, { value }) =>
                    setOrganizationId(value || null)
                  }
                />
              </FieldRow>
            ) : null}
            {scope === "class_network" ? (
              <FieldRow>
                <span className="label-text">Class network</span>
                <Dropdown
                  selection
                  search
                  openOnFocus={false}
                  loading={netsLoading}
                  placeholder="Pick a class network…"
                  options={netOptions}
                  value={classNetworkId}
                  onChange={(_, { value }) =>
                    setClassNetworkId(value || null)
                  }
                />
              </FieldRow>
            ) : null}
            {scope === "project_board" ? (
              <FieldRow>
                <span className="label-text">Template board</span>
                <span className="hint">
                  Only boards flagged as <code>isTemplate=true</code>.
                  Student clones inherit automatically via the resolver.
                </span>
                <Dropdown
                  selection
                  search
                  openOnFocus={false}
                  loading={boardsLoading}
                  placeholder="Pick a template board…"
                  options={boardOptions}
                  value={proposalBoardId}
                  onChange={(_, { value }) =>
                    setProposalBoardId(value || null)
                  }
                  noResultsMessage="No template boards found. Mark a proposal board's isTemplate flag in Keystone admin (or in the board's settings) to make it available here."
                />
              </FieldRow>
            ) : null}
          </Grid>

          <KeyPreview>
            Key that consumers will resolve:{" "}
            <strong>{key || "(fill in the fields above)"}</strong>
          </KeyPreview>
        </>
      ) : null}

      {error ? (
        <div style={{ color: "#871b16", fontSize: 13 }}>{error}</div>
      ) : null}

      <div>
        <PrimaryButton
          type="button"
          onClick={handleCreate}
          disabled={loading || !surface || !key}
        >
          {loading ? "Creating…" : "Create draft"}
        </PrimaryButton>
      </div>
    </Shell>
  );
}
