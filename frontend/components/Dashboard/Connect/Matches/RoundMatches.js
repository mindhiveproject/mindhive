import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";
import { Icon, Label } from "semantic-ui-react";
import { Container, Draggable } from "react-smooth-dnd";
import DropdownSelect from "../../../DesignSystem/DropdownSelect";
import AlgorithmInfoModal from "./AlgorithmInfoModal";

import { ROUND_MATCH_VIEW } from "../../../Queries/ConnectMatch";
import { MY_CONNECT_ROUNDS } from "../../../Queries/ConnectRound";
import {
  CREATE_MATCH,
  CREATE_MATCHES,
  UPDATE_MATCH,
  DELETE_MATCH,
  DELETE_MATCHES,
} from "../../../Mutations/ConnectMatch";
import { UPDATE_CONNECT_ROUND } from "../../../Mutations/ConnectRound";
import { runMatching, computeScore } from "./matchingAlgorithm";
import { ALGO_OPTIONS } from "../Rounds/roundFormConfig";
import NetworkGraph from "./NetworkGraph";
import Button from "../../../DesignSystem/Button";
import Chip from "../../../DesignSystem/Chip";

const BACK_CHEVRON = (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <path
      d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12l4.58-4.59z"
      fill="currentColor"
    />
  </svg>
);

const Shell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 32px clamp(16px, 6vw, 64px);
  padding-top: 0px;
  background-color: #f7f9f8;
  min-height: 100vh;
  border-radius: 32px 0 0 32px;
  scroll-padding-top: 126px;
`;

const TopBar = styled.header.attrs({ className: "Editor__TopBar" })`
  position: sticky;
  top: 70px;
  z-index: 5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 16px;
  margin: -8px calc(-1 * clamp(16px, 6vw, 64px)) 8px;
  padding: 10px clamp(16px, 6vw, 64px);
  background: rgba(247, 249, 248, 0.92);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(211, 218, 224, 0.85);
`;

const TopBarLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1 1 220px;
`;

const TitleRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1 1 auto;

  h1 {
    margin: 0;
    min-width: 0;
    max-width: 100%;
    font-family: "Inter", sans-serif;
    font-size: clamp(20px, 2.8vw, 26px);
    font-weight: 600;
    color: #171717;
    line-height: 1.25;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .meta {
    color: #5f6871;
    font-size: 13px;
  }
`;

const BackLink = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  padding: 0;
  background: none;
  border: none;
  border-radius: 8px;
  color: #336f8a;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: rgba(51, 111, 138, 0.08);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid #336f8a;
    outline-offset: 2px;
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  align-items: center;
  flex-wrap: wrap;
  flex: 0 0 auto;
`;

const Card = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0px 4px 24px rgba(0, 0, 0, 0.05);

  h2 {
    margin: 0;
    font-family: "Inter", sans-serif;
    font-size: 18px;
    color: #171717;
  }

  .helper {
    color: #5f6871;
    font-size: 14px;
  }
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const OpportunityCard = styled.div`
  border: 1px solid #d3dae0;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  .title {
    font-size: 16px;
    font-weight: 600;
    color: #171717;
  }

  .meta {
    color: #5f6871;
    font-size: 12px;
  }
`;

// Two-column workspace for teacher-curated rounds: students left,
// opportunities right. Falls back to a single stacked column on narrow
// viewports so nothing goes off-screen.
const SplitPane = styled.div`
  display: grid;
  grid-template-columns: minmax(260px, 340px) 1fr;
  gap: 24px;
  align-items: start;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const PaneColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
`;

const StickyPane = styled(PaneColumn)`
  /* On wide screens, keep the students column visible while scrolling the
     opportunities column. On narrow screens (where it collapses to a
     single-column layout) don't stick — it would obscure content. */
  @media (min-width: 901px) {
    position: sticky;
    top: 156px;
    max-height: calc(100vh - 180px);
    overflow-y: auto;
    padding-right: 4px;
  }
`;

const PaneHeader = styled.h3`
  margin: 0;
  font-family: "Inter", sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: #171717;
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;

const AssignedChip = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 10px;
  background: #eef5f9;
  border: 1px solid #d3dae0;
  color: #336f8a;
  font-size: 13px;

  .assigned-name {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-weight: 600;
    color: #171717;
  }

  .assigned-opp {
    font-size: 12px;
    color: #5f6871;
  }

  button.unassign {
    padding: 4px 10px;
    border-radius: 100px;
    border: 1px solid #e8c4c4;
    background: #fff;
    color: #b3261e;
    font-family: Inter, sans-serif;
    font-weight: 600;
    font-size: 12px;
    cursor: pointer;

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
`;

// Visual affordance for the drop zone inside each OpportunityCard when
// isCurated. The wrapping <Container> from react-smooth-dnd already handles
// the mechanics; this is just a hint so teachers see where to drop.
const DropZone = styled.div`
  border: 1px dashed #b6c6cd;
  border-radius: 10px;
  padding: 10px 14px;
  color: #5f6871;
  font-size: 12px;
  font-style: italic;
  text-align: center;
  background: #f7f9f8;

  &.full {
    border-color: #e8c4c4;
    color: #b3261e;
    background: #fff;
    font-style: normal;
  }
`;

const DraggableStudentChip = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 100px;
  border: 1px solid #d3dae0;
  background: #ffffff;
  color: #171717;
  font-size: 13px;
  cursor: grab;
  user-select: none;

  &:active {
    cursor: grabbing;
  }
`;

const MatchRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 10px;
  background: #f7f9f8;
  align-items: center;
  flex-wrap: wrap;

  .name {
    font-weight: 600;
    color: #171717;
    font-size: 14px;
  }

  .info {
    color: #5f6871;
    font-size: 12px;
  }

  .controls {
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

const STATUS_COLORS = {
  proposed: "yellow",
  active: "green",
  completed: "blue",
  declined: "red",
  cancelled: "grey",
};

const STATUS_OPTIONS = [
  { value: "proposed", label: "Proposed" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "declined", label: "Declined" },
  { value: "cancelled", label: "Cancelled" },
];

// Compact trigger style for the tiny per-match status dropdown so it fits
// inline with the status label and Remove button — DropdownSelect defaults
// to full-width and larger padding.
const COMPACT_STATUS_TRIGGER_STYLE = {
  padding: "4px 10px",
  fontSize: "12px",
  lineHeight: "16px",
  minWidth: "120px",
  width: "auto",
};

const ROUND_STATUS_LABELS = {
  draft: "Draft",
  preferences_open: "Preferences open",
  preferences_closed: "Preferences closed",
  matching: "Matching",
  published: "Published",
  archived: "Archived",
};

function displayName(profile) {
  if (!profile) return "Unknown";
  return (
    `${profile.firstName || ""} ${profile.lastName || ""}`.trim() ||
    profile.username
  );
}

export default function RoundMatches({ roundId }) {
  const router = useRouter();
  const { t } = useTranslation("connect");
  const { data, loading, refetch } = useQuery(ROUND_MATCH_VIEW, {
    variables: { roundId },
    fetchPolicy: "cache-and-network",
  });

  const round = data?.connectRound;
  const matches = round?.matches || [];
  const opportunities = round?.opportunities || [];
  const preferences = round?.preferences || [];

  const matchesByOpportunity = new Map();
  matches.forEach((m) => {
    const oppId = m.opportunity?.id;
    if (!oppId) return;
    if (!matchesByOpportunity.has(oppId)) {
      matchesByOpportunity.set(oppId, []);
    }
    matchesByOpportunity.get(oppId).push(m);
  });

  const studentsInMatches = new Set(matches.map((m) => m.student?.id).filter(Boolean));
  const studentsWithPrefs = preferences
    .filter((p) => p.status === "submitted")
    .map((p) => p.submitter);
  const unmatchedStudents = studentsWithPrefs.filter(
    (s) => s && !studentsInMatches.has(s.id)
  );

  // Preference index for teacher-curated ranking. Key: `${studentId}::${oppId}`
  // → the student's PreferenceItem for that opportunity (rank, starRating).
  // Only submitted preferences count — drafts are noise in the ranking.
  const prefIndex = new Map();
  preferences
    .filter((p) => p.status === "submitted")
    .forEach((p) => {
      const studentId = p.submitter?.id;
      if (!studentId) return;
      (p.items || []).forEach((it) => {
        const oppId = it.opportunity?.id;
        if (!oppId) return;
        prefIndex.set(`${studentId}::${oppId}`, it);
      });
    });

  const totalOpps = opportunities.length;
  // Score a (student, opportunity) pair the same way the auto-matchers do
  // (matchingAlgorithm.js:computeScore). Students with no submitted preference
  // for the opportunity get score 0 so they sort last.
  const scoreFor = (studentId, oppId) => {
    const item = prefIndex.get(`${studentId}::${oppId}`);
    return item ? computeScore(item, totalOpps) : 0;
  };
  const prefFor = (studentId, oppId) => prefIndex.get(`${studentId}::${oppId}`);

  const [createMatch, { loading: assigning }] = useMutation(CREATE_MATCH);
  const [createMatches, { loading: creating }] = useMutation(CREATE_MATCHES);
  const [deleteMatches, { loading: bulkDeleting }] = useMutation(DELETE_MATCHES);
  const [updateMatch] = useMutation(UPDATE_MATCH);
  const [deleteMatch] = useMutation(DELETE_MATCH);
  const [updateRound, { loading: publishing }] = useMutation(
    UPDATE_CONNECT_ROUND,
    {
      refetchQueries: [{ query: MY_CONNECT_ROUNDS }],
    }
  );

  const [opening, setOpening] = useState(false);
  const [running, setRunning] = useState(false);
  const [algoInfoOpen, setAlgoInfoOpen] = useState(false);

  const isDraft = round?.status === "draft";
  const isCurated = round?.matchingAlgorithm === "teacher_curated";
  const canPublish =
    round?.status === "matching" || round?.status === "preferences_closed";

  const handleOpenPreferences = async () => {
    if (
      !window.confirm(
        t("matchingRound.openConfirm", {}, {
          default:
            "Students in this network will see this round and can submit preferences. Continue?",
        })
      )
    ) {
      return;
    }
    setOpening(true);
    try {
      await updateRound({
        variables: {
          id: round.id,
          input: {
            status: "preferences_open",
            updatedAt: new Date().toISOString(),
          },
        },
      });
      await refetch();
    } finally {
      setOpening(false);
    }
  };

  const handleRunMatching = async () => {
    if (
      !window.confirm(
        "Run the matching algorithm? Existing proposed matches will be replaced."
      )
    ) {
      return;
    }
    setRunning(true);
    try {
      const { matches: newMatches } = runMatching(round, {
        includeDrafts: false,
      });

      const proposed = matches.filter((m) => m.status === "proposed");
      if (proposed.length) {
        await deleteMatches({
          variables: { where: proposed.map((m) => ({ id: m.id })) },
        });
      }

      if (newMatches.length) {
        await createMatches({
          variables: {
            data: newMatches.map((m) => ({
              round: { connect: { id: round.id } },
              classNetwork: round.classNetwork?.id
                ? { connect: { id: round.classNetwork.id } }
                : undefined,
              opportunity: { connect: { id: m.opportunityId } },
              student: { connect: { id: m.studentId } },
              status: "proposed",
              matchScore: m.score,
              proposedAt: new Date().toISOString(),
            })),
          },
        });
      }
      await refetch();
    } finally {
      setRunning(false);
    }
  };

  const handleClearProposed = async () => {
    const proposed = matches.filter((m) => m.status === "proposed");
    if (!proposed.length) return;
    if (
      !window.confirm(
        `Delete ${proposed.length} proposed match${proposed.length === 1 ? "" : "es"}?`
      )
    ) {
      return;
    }
    await deleteMatches({
      variables: { where: proposed.map((m) => ({ id: m.id })) },
    });
    await refetch();
  };

  const handlePublish = async () => {
    if (
      !window.confirm(
        "Publish matches? All proposed matches become active and the round status changes to 'published'."
      )
    ) {
      return;
    }
    const proposed = matches.filter((m) => m.status === "proposed");
    const now = new Date().toISOString();
    await Promise.all(
      proposed.map((m) =>
        updateMatch({
          variables: {
            id: m.id,
            input: { status: "active", activatedAt: now },
          },
        })
      )
    );
    await updateRound({
      variables: {
        id: round.id,
        input: {
          status: "published",
          publishedAt: now,
          updatedAt: now,
        },
      },
    });
    await refetch();
  };

  // Switch the round's matching algorithm from inside the Matches page.
  // Existing proposed/active matches are preserved — the algorithm change
  // only affects future "Run matching" runs and unlocks/hides the manual
  // assignment affordances. A teacher can start with stable_matching,
  // review the algorithm output, then flip to teacher_curated to hand-
  // adjust — no data loss either direction.
  const handleChangeAlgorithm = async (nextAlgorithm) => {
    if (!nextAlgorithm || nextAlgorithm === round?.matchingAlgorithm) return;
    const toCurated = nextAlgorithm === "teacher_curated";
    const message = toCurated
      ? t(
          "matchingRound.switchToCuratedConfirm",
          {},
          {
            default:
              "Switch to teacher-curated matching? Existing proposed matches stay; you can adjust them by hand from now on. Auto-matching is disabled until you switch back.",
          }
        )
      : t(
          "matchingRound.switchToAlgorithmConfirm",
          {},
          {
            default:
              "Switch to an automatic matching algorithm? Existing proposed matches stay in place; use 'Run matching' to replace them.",
          }
        );
    if (!window.confirm(message)) return;
    await updateRound({
      variables: {
        id: round.id,
        input: {
          matchingAlgorithm: nextAlgorithm,
          updatedAt: new Date().toISOString(),
        },
      },
    });
    await refetch();
  };

  const handleChangeStatus = async (matchId, newStatus) => {
    const now = new Date().toISOString();
    const extra = {};
    if (newStatus === "active") extra.activatedAt = now;
    if (newStatus === "completed") extra.completedAt = now;
    await updateMatch({
      variables: { id: matchId, input: { status: newStatus, ...extra } },
    });
    await refetch();
  };

  const handleDelete = async (matchId) => {
    if (!window.confirm("Remove this match?")) return;
    await deleteMatch({ variables: { id: matchId } });
    await refetch();
  };

  // Bulk fill an opportunity to capacity with its highest-ranked unmatched
  // students. Uses the same scoreFor() ranking as the manual dropdowns and
  // as the auto-matchers, so this is "run auto-matching for this one opp
  // only" scoped to the currently unmatched pool. Students with no submitted
  // preference for this opp are excluded (they'd add noise without signal).
  const handleProposeTopCandidates = async (opportunityId) => {
    const opp = opportunities.find((o) => o.id === opportunityId);
    if (!opp) return;
    const cap = opp.studentCapacity || 1;
    const currentCount = (matchesByOpportunity.get(opportunityId) || []).length;
    const slotsLeft = cap - currentCount;
    if (slotsLeft <= 0) return;

    const ranked = unmatchedStudents
      .filter((s) => !!prefFor(s.id, opportunityId))
      .map((s) => ({ student: s, score: scoreFor(s.id, opportunityId) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, slotsLeft);
    if (ranked.length === 0) {
      window.alert(
        t("matchingRound.noRankedCandidates", {}, {
          default:
            "No unmatched students ranked this opportunity. Assign one manually instead.",
        })
      );
      return;
    }
    if (
      !window.confirm(
        t("matchingRound.proposeTopConfirm", {
          count: ranked.length,
          title: opp.title,
        }, {
          default: `Propose the top ${ranked.length} candidate${ranked.length === 1 ? "" : "s"} for "${opp.title}"?`,
        })
      )
    ) {
      return;
    }
    // Sequential, not parallel: refetch after all inserts.
    for (const r of ranked) {
      await createMatch({
        variables: {
          input: {
            round: { connect: { id: round.id } },
            classNetwork: round.classNetwork?.id
              ? { connect: { id: round.classNetwork.id } }
              : undefined,
            opportunity: { connect: { id: opportunityId } },
            student: { connect: { id: r.student.id } },
            status: "proposed",
            matchScore: r.score,
            proposedAt: new Date().toISOString(),
          },
        },
      });
    }
    await refetch();
  };

  // Reassign an existing match to a different opportunity. Preferred over
  // delete + create because it preserves the match id (any teacherNotes,
  // status, activatedAt stay intact) and there's no window where the
  // student appears unmatched.
  const handleReassign = async (matchId, newOpportunityId) => {
    if (!matchId || !newOpportunityId) return;
    const opp = opportunities.find((o) => o.id === newOpportunityId);
    const cap = opp?.studentCapacity || 1;
    const currentCount = (matchesByOpportunity.get(newOpportunityId) || []).length;
    if (currentCount >= cap) {
      window.alert(
        t("matchingRound.capacityFull", {}, {
          default:
            "This opportunity is already at capacity. Remove an existing match first.",
        })
      );
      return;
    }
    await updateMatch({
      variables: {
        id: matchId,
        input: {
          opportunity: { connect: { id: newOpportunityId } },
        },
      },
    });
    await refetch();
  };

  // Manual assign for teacher-curated rounds. Capacity is enforced at the
  // callsite (the dropdown hides opportunities that are full), but we
  // re-check here as a safety net — the query result might be stale.
  const handleAssign = async (studentId, opportunityId) => {
    if (!studentId || !opportunityId) return;
    const opp = opportunities.find((o) => o.id === opportunityId);
    const cap = opp?.studentCapacity || 1;
    const currentCount = (matchesByOpportunity.get(opportunityId) || []).length;
    if (currentCount >= cap) {
      window.alert(
        t("matchingRound.capacityFull", {}, {
          default:
            "This opportunity is already at capacity. Remove an existing match first.",
        })
      );
      return;
    }
    // Guard against duplicate (round, student, opportunity) triples — the
    // schema doesn't enforce uniqueness so we check client-side.
    const duplicate = matches.some(
      (m) => m.student?.id === studentId && m.opportunity?.id === opportunityId
    );
    if (duplicate) return;

    await createMatch({
      variables: {
        input: {
          round: { connect: { id: round.id } },
          classNetwork: round.classNetwork?.id
            ? { connect: { id: round.classNetwork.id } }
            : undefined,
          opportunity: { connect: { id: opportunityId } },
          student: { connect: { id: studentId } },
          status: "proposed",
          proposedAt: new Date().toISOString(),
        },
      },
    });
    await refetch();
  };

  const handleBack = () => {
    router.replace({ pathname: "/dashboard/connect/matches" });
  };

  if (loading && !round) {
    return (
      <Shell>
        <p>Loading matches…</p>
      </Shell>
    );
  }
  if (!round) {
    return (
      <Shell>
        <p>Round not found.</p>
      </Shell>
    );
  }

  const proposedCount = matches.filter((m) => m.status === "proposed").length;
  const roundStatusLabel =
    ROUND_STATUS_LABELS[round.status] || round.status.replace(/_/g, " ");

  const pageTitle = `Matches · ${round.title}`;
  const backLabel = t("matchesRound.backLink", {}, {
    default: "Back to matches",
  });
  const busy = opening || publishing || running || creating || bulkDeleting;

  // Render one opportunity card. Extracted so the workspace layout can
  // place it inside a SplitPane column (isCurated mode) OR stacked full-
  // width (non-curated mode) without duplicating the JSX body.
  const renderOpportunityCard = (opp) => {
    const oppMatches = matchesByOpportunity.get(opp.id) || [];
    const cap = opp.studentCapacity || 1;
    const mentorName = displayName(opp.mentor);
    const hasCapacity = oppMatches.length < cap;
    // Only teacher-curated rounds get the manual assign affordance.
    // Options list = unmatched students, sorted by their preference
    // score for THIS opportunity (highest first).
    const assignOptions = isCurated
      ? [...unmatchedStudents]
          .sort((a, b) => {
            const scoreDiff = scoreFor(b.id, opp.id) - scoreFor(a.id, opp.id);
            if (scoreDiff !== 0) return scoreDiff;
            return displayName(a).localeCompare(displayName(b));
          })
          .map((s) => {
            const pref = prefFor(s.id, opp.id);
            const suffix = pref
              ? ` — rank ${pref.rank ?? "—"}, ${pref.starRating ?? 0}★`
              : ` — no preference`;
            return {
              value: s.id,
              label: `${displayName(s)}${suffix}`,
            };
          })
      : [];

    return (
      <OpportunityCard key={opp.id}>
        <div>
          <div className="title">{opp.title}</div>
          <div className="meta">
            By {mentorName} · Capacity {cap}
            {opp.teamSize > 1 && ` · Team of ${opp.teamSize}`}
            {" · "}
            {oppMatches.length} / {cap} assigned
          </div>
        </div>
        {isCurated ? (
          // Drop target for cross-container drag. groupName must match the
          // source Container on the left pane.
          <Container
            groupName="curatedMatching"
            orientation="vertical"
            // Accept when there's room, OR when the drop is a reassign
            // from THIS same opp (net-zero → we no-op in onDrop anyway,
            // but rejecting it would flash the "not allowed" cursor).
            shouldAcceptDrop={(_srcOpts, payload) => {
              if (assigning) return false;
              if (payload?.fromOppId === opp.id) return true;
              return hasCapacity;
            }}
            onDrop={({ addedIndex, payload }) => {
              // react-smooth-dnd fires onDrop on EVERY container in the
              // group, not just the target. `addedIndex` is a number only
              // on the container that actually received the drop; on the
              // rest it's null. Without this guard the drop would fan out
              // and create a match on every opportunity.
              if (addedIndex === null || addedIndex === undefined) return;
              if (!payload) return;
              if (typeof payload === "string") {
                // From the left pane: it's a studentId → new assignment.
                handleAssign(payload, opp.id);
                return;
              }
              // From another OpportunityCard: it's a { matchId, fromOppId }
              // → reassign the existing match instead of duplicating it.
              if (payload.matchId) {
                if (payload.fromOppId === opp.id) return; // no-op on same opp
                handleReassign(payload.matchId, opp.id);
              }
            }}
            // Emit a payload for the MatchRows so they can be dragged to
            // another opportunity. The receiver reads matchId + fromOppId
            // to decide between reassign and no-op.
            getChildPayload={(index) => {
              const m = oppMatches[index];
              if (!m) return null;
              return {
                matchId: m.id,
                fromOppId: opp.id,
                studentId: m.student?.id,
              };
            }}
            style={{ display: "flex", flexDirection: "column", gap: 8 }}
          >
            {oppMatches.map((m) => (
              <Draggable key={m.id}>
                <MatchRow>
                  <div>
                    <div className="name">{displayName(m.student)}</div>
                    <div className="info">
                      score{" "}
                      {typeof m.matchScore === "number"
                        ? m.matchScore.toFixed(0)
                        : "—"}
                    </div>
                  </div>
                  <div className="controls">
                    <Label
                      color={STATUS_COLORS[m.status] || "grey"}
                      size="tiny"
                    >
                      {m.status}
                    </Label>
                    <DropdownSelect
                      value={m.status}
                      onChange={(value) => handleChangeStatus(m.id, value)}
                      options={STATUS_OPTIONS}
                      triggerStyle={COMPACT_STATUS_TRIGGER_STYLE}
                      fitContent
                      ariaLabel={t("matchingRound.statusFor", { name: displayName(m.student) }, {
                        default: `Status for ${displayName(m.student)}`,
                      })}
                    />
                    <button
                      type="button"
                      onClick={() => handleDelete(m.id)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 100,
                        border: "1px solid #e8c4c4",
                        background: "#fff",
                        color: "#b3261e",
                        fontFamily: "Inter",
                        fontWeight: 600,
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </MatchRow>
              </Draggable>
            ))}
            <DropZone className={hasCapacity ? "" : "full"}>
              {hasCapacity
                ? t("matchingRound.dropHere", {}, {
                    default: "Drop a student here to assign",
                  })
                : t("matchingRound.capacityFullShort", {}, {
                    default: "Capacity full",
                  })}
            </DropZone>
          </Container>
        ) : oppMatches.length === 0 ? (
          <p className="helper">No matches yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {oppMatches.map((m) => (
              <MatchRow key={m.id}>
                <div>
                  <div className="name">{displayName(m.student)}</div>
                  <div className="info">
                    score{" "}
                    {typeof m.matchScore === "number"
                      ? m.matchScore.toFixed(0)
                      : "—"}
                  </div>
                </div>
                <div className="controls">
                  <Label
                    color={STATUS_COLORS[m.status] || "grey"}
                    size="tiny"
                  >
                    {m.status}
                  </Label>
                  <DropdownSelect
                    value={m.status}
                    onChange={(value) => handleChangeStatus(m.id, value)}
                    options={STATUS_OPTIONS}
                    triggerStyle={COMPACT_STATUS_TRIGGER_STYLE}
                    fitContent
                    ariaLabel={t("matchingRound.statusFor", { name: displayName(m.student) }, {
                      default: `Status for ${displayName(m.student)}`,
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => handleDelete(m.id)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 100,
                      border: "1px solid #e8c4c4",
                      background: "#fff",
                      color: "#b3261e",
                      fontFamily: "Inter",
                      fontWeight: 600,
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    Remove
                  </button>
                </div>
              </MatchRow>
            ))}
          </div>
        )}
        {isCurated && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              paddingTop: 4,
              flexWrap: "wrap",
            }}
          >
            <DropdownSelect
              value=""
              onChange={(value) => value && handleAssign(value, opp.id)}
              options={assignOptions}
              searchableSingle
              disabled={!hasCapacity || assigning || assignOptions.length === 0}
              placeholder={
                !hasCapacity
                  ? t("matchingRound.capacityFullShort", {}, {
                      default: "Capacity full",
                    })
                  : assignOptions.length === 0
                    ? t("matchingRound.noUnmatched", {}, {
                        default: "No unmatched students",
                      })
                    : t("matchingRound.assignStudent", {}, {
                        default: "+ Assign student",
                      })
              }
              ariaLabel={t("matchingRound.assignStudent", {}, {
                default: "+ Assign student",
              })}
              triggerStyle={{ minWidth: 220 }}
              fitContent
            />
            {/* Bulk fill this opportunity to capacity with its top
                unmatched candidates (by preference score). */}
            {hasCapacity &&
              unmatchedStudents.some((s) => !!prefFor(s.id, opp.id)) && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleProposeTopCandidates(opp.id)}
                  disabled={assigning}
                >
                  {t("matchingRound.proposeTopCandidates", {}, {
                    default: "Propose top candidates",
                  })}
                </Button>
              )}
          </div>
        )}
      </OpportunityCard>
    );
  };

  return (
    <Shell>
      <TopBar>
        <TopBarLeft>
          <BackLink
            type="button"
            onClick={handleBack}
            disabled={busy}
            aria-label={backLabel}
            title={backLabel}
          >
            {BACK_CHEVRON}
          </BackLink>
          <TitleRow>
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <h1 title={pageTitle}>{pageTitle}</h1>
              <Chip shape="pill" label={roundStatusLabel} />
            </div>
            <div className="meta">
              {matches.length} match{matches.length === 1 ? "" : "es"} ·{" "}
              {preferences.filter((p) => p.status === "submitted").length} submitted
              preference
              {preferences.filter((p) => p.status === "submitted").length === 1
                ? ""
                : "s"}
            </div>
          </TitleRow>
        </TopBarLeft>
        {isDraft && (
          <Actions>
            <Button
              type="button"
              variant="filled"
              onClick={handleOpenPreferences}
              disabled={opening || publishing}
            >
              {opening
                ? t("matchingRound.openingPreferences", {}, {
                    default: "Opening…",
                  })
                : t("matchingRound.openPreferences", {}, {
                    default: "Open preferences",
                  })}
            </Button>
          </Actions>
        )}
      </TopBar>

      {isDraft && (
        <Card
          style={{
            border: "1px solid #d3dae0",
            background: "#f7f9f8",
          }}
        >
          <p className="helper" style={{ margin: 0 }}>
            {t("matchingRound.draftBanner", {}, {
              default:
                "This round is in draft. Students cannot see it until you open preferences.",
            })}
          </p>
        </Card>
      )}

      <Card>
        <h2>
          {isCurated
            ? t("matchingRound.curatedControlsHeading", {}, {
                default: "Teacher-curated matching",
              })
            : t("matchingRound.algorithmControlsHeading", {}, {
                default: "Algorithm controls",
              })}
        </h2>
        <p className="helper">
          {isCurated
            ? t("matchingRound.curatedControlsHelper", {}, {
                default:
                  "This round is teacher-curated — assign students to opportunities by hand in the sections below, then Publish to make matches active.",
              })
            : t("matchingRound.algorithmControlsHelper", {}, {
                default:
                  "The matcher considers submitted preferences only. Higher rank + higher star rating wins, subject to each opportunity's capacity. Existing proposed matches will be replaced — manually-edited or active matches are preserved.",
              })}
        </p>
        {!canPublish && !isDraft && proposedCount > 0 && (
          <p className="helper">
            {t("matchingRound.publishRequiresMatching", {}, {
              default:
                "Set the round status to Matching before publishing final matches.",
            })}
          </p>
        )}
        {isDraft && proposedCount > 0 && (
          <p className="helper">
            {t("matchingRound.publishDisabledWhileDraft", {}, {
              default:
                "Open preferences and move the round to Matching before publishing matches.",
            })}
          </p>
        )}
        {/* Algorithm switcher — always visible so a teacher can flip to
            teacher-curated mid-flight (e.g. after reviewing stable-matching
            output) and back again without leaving the Matches page.
            Existing matches are preserved either direction. */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: 14, color: "#5f6871", fontWeight: 500 }}>
            {t("matchingRound.matchingAlgorithmLabel", {}, {
              default: "Matching algorithm",
            })}
          </span>
          <DropdownSelect
            value={round?.matchingAlgorithm || "stable_matching"}
            onChange={handleChangeAlgorithm}
            options={ALGO_OPTIONS.map((o) => ({
              value: o.value,
              label: o.text,
            }))}
            disabled={publishing}
            ariaLabel={t("matchingRound.matchingAlgorithmLabel", {}, {
              default: "Matching algorithm",
            })}
            triggerStyle={{ minWidth: 260 }}
            fitContent
          />
          {/* Info button — opens a portal modal with the detailed
              description of all three algorithms. Kept out of the page
              body so the workspace stays uncluttered. */}
          <button
            type="button"
            onClick={() => setAlgoInfoOpen(true)}
            aria-label={t("matchingRound.algorithmInfoAria", {}, {
              default: "How the matching algorithms work",
            })}
            title={t("matchingRound.algorithmInfoTooltip", {}, {
              default: "How the matching algorithms work",
            })}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 28,
              height: 28,
              padding: 0,
              borderRadius: "50%",
              border: "1px solid #A1A1A1",
              background: "#fff",
              color: "#336f8a",
              fontFamily: "Inter, sans-serif",
              fontWeight: 700,
              fontSize: 14,
              lineHeight: 1,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            ?
          </button>
        </div>
        <ButtonRow>
          {/* Hide "Run matching" for teacher-curated rounds — the algorithm
              intentionally returns an empty match set for that mode, so the
              button would do nothing useful. Manual assignment happens in
              the OpportunityCard / Unmatched students dropdowns below. */}
          {!isCurated && (
            <Button
              type="button"
              variant="filled"
              onClick={handleRunMatching}
              disabled={running || creating || bulkDeleting}
            >
              {running ? "Running…" : "Run matching"}
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={handleClearProposed}
            disabled={running || bulkDeleting || proposedCount === 0}
          >
            Clear proposed ({proposedCount})
          </Button>
          <Button
            type="button"
            variant="filled"
            onClick={handlePublish}
            disabled={publishing || proposedCount === 0 || !canPublish}
          >
            {publishing ? "Publishing…" : "Publish matches"}
          </Button>
        </ButtonRow>
      </Card>

      <Card>
        <h2>
          {isCurated
            ? t("matchingRound.workspaceHeading", {}, {
                default: "Assignment workspace",
              })
            : "Matches by opportunity"}
        </h2>
        {isCurated && (
          <p className="helper">
            {t("matchingRound.workspaceHelper", {}, {
              default:
                "Drag a student from the left onto an opportunity, or use the per-row controls. Assigned students appear underneath the unmatched list.",
            })}
          </p>
        )}
        {opportunities.length === 0 && (
          <p className="helper">No opportunities are attached to this round.</p>
        )}
        {isCurated && opportunities.length > 0 ? (
          <SplitPane>
            <StickyPane>
              {/* LEFT: students pane. Unmatched are draggable; assigned are
                  static chips with an unassign button. Source Container for
                  cross-container drag; drop targets are the OpportunityCards
                  on the right, sharing groupName="curatedMatching". */}
              <PaneHeader>
                {t("matchingRound.studentsPaneHeader", {
                  count: unmatchedStudents.length,
                }, {
                  default: `Unmatched (${unmatchedStudents.length})`,
                })}
              </PaneHeader>
              {unmatchedStudents.length === 0 ? (
                <p className="helper" style={{ margin: 0 }}>
                  {t("matchingRound.allStudentsAssigned", {}, {
                    default: "All students with preferences are assigned.",
                  })}
                </p>
              ) : (
                <Container
                  groupName="curatedMatching"
                  behaviour="copy"
                  getChildPayload={(index) => unmatchedStudents[index]?.id}
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  {unmatchedStudents.map((s) => (
                    <Draggable key={s.id}>
                      <DraggableStudentChip
                        title={t("matchingRound.dragHint", {}, {
                          default: "Drag onto an opportunity to assign",
                        })}
                      >
                        <Icon name="arrows alternate" />
                        <Icon name="user" /> {displayName(s)}
                      </DraggableStudentChip>
                    </Draggable>
                  ))}
                </Container>
              )}
              {matches.length > 0 && (
                <>
                  <PaneHeader style={{ marginTop: 8 }}>
                    {t("matchingRound.assignedPaneHeader", {
                      count: matches.length,
                    }, {
                      default: `Assigned (${matches.length})`,
                    })}
                  </PaneHeader>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {matches.map((m) => {
                      const opp = opportunities.find(
                        (o) => o.id === m.opportunity?.id
                      );
                      return (
                        <AssignedChip key={m.id}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                            <span className="assigned-name">
                              <Icon name="user" /> {displayName(m.student)}
                            </span>
                            <span className="assigned-opp">
                              →{" "}
                              {opp?.title ||
                                t("matchingRound.unknownOpportunity", {}, {
                                  default: "(opportunity)",
                                })}
                            </span>
                          </div>
                          <button
                            type="button"
                            className="unassign"
                            onClick={() => handleDelete(m.id)}
                            disabled={assigning}
                            aria-label={t("matchingRound.unassign", {}, {
                              default: "Unassign",
                            })}
                          >
                            ×
                          </button>
                        </AssignedChip>
                      );
                    })}
                  </div>
                </>
              )}
            </StickyPane>
            <PaneColumn>
              {/* RIGHT: opportunities. Each is a drop target. */}
              {opportunities.map(renderOpportunityCard)}
            </PaneColumn>
          </SplitPane>
        ) : (
          opportunities.map(renderOpportunityCard)
        )}
      </Card>
      <Card>
        <h2>Network view</h2>
        <p className="helper">
          Students on the left, opportunities on the right. Hover an edge for
          match details.
        </p>
        <NetworkGraph round={round} />
      </Card>

      {/* When isCurated, the students pane is already the left column of
          the Assignment workspace above, so hide this bottom card to avoid
          duplicating the list. */}
      {!isCurated && unmatchedStudents.length > 0 && (
        <Card>
          <h2>Unmatched students</h2>
          <p className="helper">
            {isCurated
              ? t("matchingRound.unmatchedHelperCurated", {}, {
                  default:
                    "These students submitted preferences but haven't been assigned yet. Pick an opportunity to place them.",
                })
              : t("matchingRound.unmatchedHelper", {}, {
                  default:
                    "These students submitted preferences but no match was assigned (capacity full, low ranks, or no eligible opportunities).",
                })}
          </p>
          {isCurated ? (
            // Source Container for cross-container drag. groupName must match
            // the OpportunityCard drop targets. `behaviour="copy"` keeps the
            // chip visually in place until the refetch removes it (otherwise
            // the source list flashes empty during the mutation).
            <Container
              groupName="curatedMatching"
              behaviour="copy"
              getChildPayload={(index) => unmatchedStudents[index]?.id}
              style={{ display: "flex", flexDirection: "column", gap: 8 }}
            >
              {unmatchedStudents.map((s) => {
                // Sort THIS student's opportunity options by their own
                // preference score for each opp (highest first). Options
                // they didn't rank fall to the bottom.
                const oppOptions = opportunities
                  .filter((opp) => {
                    const cap = opp.studentCapacity || 1;
                    const used = (matchesByOpportunity.get(opp.id) || []).length;
                    return used < cap;
                  })
                  .sort((a, b) => {
                    const scoreDiff = scoreFor(s.id, b.id) - scoreFor(s.id, a.id);
                    if (scoreDiff !== 0) return scoreDiff;
                    return (a.title || "").localeCompare(b.title || "");
                  })
                  .map((opp) => {
                    const cap = opp.studentCapacity || 1;
                    const used = (matchesByOpportunity.get(opp.id) || []).length;
                    const pref = prefFor(s.id, opp.id);
                    const prefLabel = pref
                      ? ` · rank ${pref.rank ?? "—"}, ${pref.starRating ?? 0}★`
                      : "";
                    return {
                      value: opp.id,
                      label: `${opp.title} (${used}/${cap})${prefLabel}`,
                    };
                  });
                return (
                  <Draggable key={s.id}>
                    <MatchRow>
                      {/* Drag handle: dedicated chip so the row's dropdown
                          stays clickable without initiating a drag. */}
                      <DraggableStudentChip
                        title={t("matchingRound.dragHint", {}, {
                          default: "Drag onto an opportunity to assign",
                        })}
                      >
                        <Icon name="arrows alternate" />
                        <Icon name="user" /> {displayName(s)}
                      </DraggableStudentChip>
                      <div className="controls">
                        <DropdownSelect
                          value=""
                          onChange={(value) => value && handleAssign(s.id, value)}
                          options={oppOptions}
                          searchableSingle
                          disabled={assigning || oppOptions.length === 0}
                          placeholder={
                            oppOptions.length === 0
                              ? t("matchingRound.allFull", {}, {
                                  default: "All opportunities full",
                                })
                              : t("matchingRound.assignToOpportunity", {}, {
                                  default: "Assign to opportunity…",
                                })
                          }
                          ariaLabel={t("matchingRound.assignToOpportunity", {}, {
                            default: "Assign to opportunity…",
                          })}
                          triggerStyle={{ minWidth: 260 }}
                          fitContent
                        />
                      </div>
                    </MatchRow>
                  </Draggable>
                );
              })}
            </Container>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {unmatchedStudents.map((s) => (
                <Label key={s.id} basic>
                  <Icon name="user" /> {displayName(s)}
                </Label>
              ))}
            </div>
          )}
        </Card>
      )}
      <AlgorithmInfoModal
        open={algoInfoOpen}
        onClose={() => setAlgoInfoOpen(false)}
      />
    </Shell>
  );
}
