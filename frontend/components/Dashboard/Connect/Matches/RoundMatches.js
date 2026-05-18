import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import styled from "styled-components";
import { Icon, Dropdown, Label } from "semantic-ui-react";

import { ROUND_MATCH_VIEW } from "../../../Queries/ConnectMatch";
import { MY_CONNECT_ROUNDS } from "../../../Queries/ConnectRound";
import {
  CREATE_MATCHES,
  UPDATE_MATCH,
  DELETE_MATCH,
  DELETE_MATCHES,
} from "../../../Mutations/ConnectMatch";
import { UPDATE_CONNECT_ROUND } from "../../../Mutations/ConnectRound";
import { runMatching } from "./matchingAlgorithm";
import NetworkGraph from "./NetworkGraph";

const Shell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 32px clamp(16px, 6vw, 64px);
  background-color: #f7f9f8;
  min-height: 100vh;
  border-radius: 32px 0 0 32px;
`;

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;

  h1 {
    margin: 0;
    font-family: "Lato", sans-serif;
    font-size: clamp(24px, 3vw, 32px);
    font-weight: 600;
    color: #171717;
  }
`;

const BackLink = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: #336f8a;
  font-family: "Nunito", sans-serif;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  padding: 0;
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
    font-family: "Lato", sans-serif;
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

const Button = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: 100px;
  border: 1px solid ${({ $primary, $danger }) => ($primary ? "#336f8a" : $danger ? "#e8c4c4" : "#d3dae0")};
  background: ${({ $primary }) => ($primary ? "#336f8a" : "#ffffff")};
  color: ${({ $primary, $danger }) =>
    $primary ? "#ffffff" : $danger ? "#b3261e" : "#336f8a"};
  font-family: "Nunito", sans-serif;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
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
  { key: "proposed", text: "Proposed", value: "proposed" },
  { key: "active", text: "Active", value: "active" },
  { key: "completed", text: "Completed", value: "completed" },
  { key: "declined", text: "Declined", value: "declined" },
  { key: "cancelled", text: "Cancelled", value: "cancelled" },
];

function displayName(profile) {
  if (!profile) return "Unknown";
  return (
    `${profile.firstName || ""} ${profile.lastName || ""}`.trim() ||
    profile.username
  );
}

export default function RoundMatches({ roundId }) {
  const router = useRouter();
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

  const [running, setRunning] = useState(false);

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

  return (
    <Shell>
      <TopBar>
        <div>
          <BackLink type="button" onClick={handleBack}>
            <Icon name="arrow left" /> Back
          </BackLink>
          <h1>Matches · {round.title}</h1>
          <div style={{ marginTop: 6, color: "#5f6871", fontSize: 13 }}>
            Round status: {round.status.replace("_", " ")} ·{" "}
            {matches.length} match{matches.length === 1 ? "" : "es"} ·{" "}
            {preferences.filter((p) => p.status === "submitted").length} submitted
            preference
            {preferences.filter((p) => p.status === "submitted").length === 1
              ? ""
              : "s"}
          </div>
        </div>
      </TopBar>

      <Card>
        <h2>Algorithm controls</h2>
        <p className="helper">
          The matcher considers <strong>submitted</strong> preferences only.
          Higher rank + higher star rating wins, subject to each
          opportunity&apos;s capacity. Existing <em>proposed</em> matches will be
          replaced — manually-edited or active matches are preserved.
        </p>
        <ButtonRow>
          <Button
            type="button"
            $primary
            onClick={handleRunMatching}
            disabled={running || creating || bulkDeleting}
          >
            {running ? "Running…" : "Run matching"}
          </Button>
          <Button
            type="button"
            onClick={handleClearProposed}
            disabled={running || bulkDeleting || proposedCount === 0}
          >
            Clear proposed ({proposedCount})
          </Button>
          <Button
            type="button"
            $primary
            onClick={handlePublish}
            disabled={publishing || proposedCount === 0}
          >
            {publishing ? "Publishing…" : "Publish matches"}
          </Button>
        </ButtonRow>
      </Card>

      <Card>
        <h2>Matches by opportunity</h2>
        {opportunities.length === 0 && (
          <p className="helper">No opportunities are attached to this round.</p>
        )}
        {opportunities.map((opp) => {
          const oppMatches = matchesByOpportunity.get(opp.id) || [];
          const cap = opp.studentCapacity || 1;
          const mentorName = displayName(opp.mentor);
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
              {oppMatches.length === 0 ? (
                <p className="helper">No matches yet.</p>
              ) : (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
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
                        <Dropdown
                          selection
                          compact
                          options={STATUS_OPTIONS}
                          value={m.status}
                          onChange={(_, { value }) =>
                            handleChangeStatus(m.id, value)
                          }
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
                            fontFamily: "Nunito",
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
            </OpportunityCard>
          );
        })}
      </Card>

      <Card>
        <h2>Network view</h2>
        <p className="helper">
          Students on the left, opportunities on the right. Hover an edge for
          match details.
        </p>
        <NetworkGraph round={round} />
      </Card>

      {unmatchedStudents.length > 0 && (
        <Card>
          <h2>Unmatched students</h2>
          <p className="helper">
            These students submitted preferences but no match was assigned
            (capacity full, low ranks, or no eligible opportunities).
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {unmatchedStudents.map((s) => (
              <Label key={s.id} basic>
                <Icon name="user" /> {displayName(s)}
              </Label>
            ))}
          </div>
        </Card>
      )}
    </Shell>
  );
}
