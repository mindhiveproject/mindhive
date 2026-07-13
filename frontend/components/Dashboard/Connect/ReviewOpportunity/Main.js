// Review-mode opportunity view. Reviewers land here from the review
// queue by clicking an opportunity card. Read-only opportunity details,
// status-change controls, review notes panel, conflict-of-interest flag
// when the reviewer is also the mentor.
//
// Access: any signed-in user can hit the URL, but data + actions are
// gated server-side by the FormDefinition / Opportunity / ReviewNote
// access rules. The page additionally renders a friendly "not assigned"
// state if the viewer isn't in the round's reviewer list (and isn't an
// admin) — saves a confusing empty-notes view.
import { useContext, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useMutation, useQuery } from "@apollo/client";
import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";

import Button from "../../../DesignSystem/Button";
import { UserContext } from "../../../Global/Authorized";
import { REVIEW_OPPORTUNITY } from "../../../Queries/OpportunityReviewNote";
import {
  CREATE_REVIEW_NOTE,
  DELETE_REVIEW_NOTE,
} from "../../../Mutations/OpportunityReviewNote";
import { UPDATE_OPPORTUNITY } from "../../../Mutations/Opportunity";
import useConnectRole from "../useConnectRole";
import ReturnOpportunityModal from "../ReturnOpportunityModal";
import { isReturnableOpportunityStatus } from "../returnOpportunityUtils";

const Shell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 32px clamp(16px, 6vw, 64px);
  background-color: #f7f9f8;
  min-height: 100vh;
  border-radius: 32px 0 0 32px;
`;

const BackLink = styled.button`
  background: none;
  border: none;
  color: #336f8a;
  font-family: "Nunito", sans-serif;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  padding: 0;
  width: max-content;
`;

const TopBar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;

  h1 {
    margin: 0;
    font-family: "Lato", sans-serif;
    font-size: clamp(24px, 4vw, 36px);
    color: #171717;
  }

  .round-meta {
    color: #5f6871;
    font-size: 13px;
  }
`;

const Card = styled.section`
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

  .field-grid {
    display: grid;
    grid-template-columns: 180px 1fr;
    gap: 8px 16px;
    font-size: 14px;
  }

  .field-grid dt {
    color: #5f6871;
    font-weight: 600;
  }

  .field-grid dd {
    margin: 0;
    color: #171717;
  }
`;

const ConflictBanner = styled.div`
  padding: 12px 16px;
  border-radius: 12px;
  background: #fff8e6;
  border: 1px solid #f0d39a;
  color: #6e5400;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StatusBar = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;

  label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #5f6871;
  }

  select {
    border: 1px solid #d3dae0;
    border-radius: 100px;
    padding: 8px 16px;
    font-family: "Lato", sans-serif;
    font-size: 14px;
    color: #171717;
    background: #ffffff;
  }

  .saved {
    color: #1d6b3a;
    font-size: 13px;
  }
`;

const StatusPill = styled.span`
  display: inline-block;
  padding: 4px 12px;
  border-radius: 100px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #ffffff;
  background: ${({ $status }) => {
    if ($status === "accepted" || $status === "published") return "#1d6b3a";
    if ($status === "pending_review") return "#8a6d3b";
    if ($status === "returned") return "#b45309";
    if ($status === "archived" || $status === "closed") return "#5f6871";
    if ($status === "pre_selected") return "#336f8a";
    return "#5f6871";
  }};
`;

const NoteForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 8px;

  textarea {
    border: 1px solid #d3dae0;
    border-radius: 8px;
    padding: 10px 12px;
    min-height: 80px;
    font-family: "Lato", sans-serif;
    font-size: 14px;
    resize: vertical;
  }

  button {
    align-self: flex-start;
    padding: 8px 20px;
    border-radius: 100px;
    background: #336f8a;
    color: #ffffff;
    border: none;
    font-family: "Nunito", sans-serif;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
`;

const NoteList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const NoteRow = styled.li`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px;
  border: 1px solid #d3dae0;
  border-radius: 12px;
  background: #fafbfc;

  .meta {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    font-size: 12px;
    color: #5f6871;

    .author {
      font-weight: 600;
      color: #171717;
    }
  }

  .body {
    color: #171717;
    font-size: 14px;
    line-height: 1.5;
    white-space: pre-wrap;
  }

  button.delete {
    background: none;
    border: 1px solid #f5c2bf;
    color: #c0392b;
    font-family: "Nunito", sans-serif;
    font-size: 11px;
    font-weight: 600;
    border-radius: 100px;
    padding: 2px 10px;
    cursor: pointer;
    align-self: flex-end;
  }
`;

const STATUS_OPTIONS = [
  "draft",
  "pending_review",
  "pre_selected",
  "accepted",
  "published",
  "closed",
  "archived",
];

function displayName(p) {
  if (!p) return "Unknown";
  return (
    `${p.firstName || ""} ${p.lastName || ""}`.trim() ||
    p.username ||
    "Unknown"
  );
}

function fmtDateTime(d) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleString();
  } catch {
    return "";
  }
}

function fmtDate(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return "—";
  }
}

export default function ReviewOpportunityMain({ query }) {
  const router = useRouter();
  const { t } = useTranslation("connect");
  const me = useContext(UserContext);
  const { isAdmin } = useConnectRole();
  const oppId = query?.op;
  const roundId = query?.round;

  const { data, loading, error } = useQuery(REVIEW_OPPORTUNITY, {
    variables: { oppId, roundId },
    skip: !oppId || !roundId,
    fetchPolicy: "cache-and-network",
  });
  const opportunity = data?.opportunity;
  const round = opportunity?.rounds?.[0];
  const notes = opportunity?.reviewNotes || [];

  const isReviewerOnRound = useMemo(() => {
    if (!round || !me?.id) return false;
    return (round.reviewers || []).some((r) => r.id === me.id);
  }, [round, me]);

  const isMentorOfOpp = !!(me?.id && opportunity?.mentor?.id === me.id);

  const [status, setStatus] = useState(null);
  const [statusFlash, setStatusFlash] = useState(null);
  const [noteBody, setNoteBody] = useState("");
  const [returnModalOpen, setReturnModalOpen] = useState(false);

  const reviewRefetchQueries = useMemo(
    () => [{ query: REVIEW_OPPORTUNITY, variables: { oppId, roundId } }],
    [oppId, roundId]
  );

  const [updateOpportunity, { loading: updatingStatus }] = useMutation(
    UPDATE_OPPORTUNITY,
    {
      refetchQueries: reviewRefetchQueries,
      awaitRefetchQueries: true,
    }
  );

  const [createNote, { loading: creatingNote }] = useMutation(
    CREATE_REVIEW_NOTE,
    {
      refetchQueries: reviewRefetchQueries,
      awaitRefetchQueries: true,
    }
  );

  const [deleteNote] = useMutation(DELETE_REVIEW_NOTE, {
    refetchQueries: reviewRefetchQueries,
    awaitRefetchQueries: true,
  });

  const currentStatus = status || opportunity?.status;
  const canReturnToSponsor =
    (isReviewerOnRound || isAdmin) &&
    opportunity?.status &&
    isReturnableOpportunityStatus(opportunity.status);

  const handleReturnSuccess = () => {
    setReturnModalOpen(false);
    router.push("/dashboard/connect/review-queue");
  };

  if (!oppId || !roundId) {
    return (
      <Shell>
        <p>This page needs an opportunity and a round in the URL.</p>
      </Shell>
    );
  }

  if (loading && !opportunity) {
    return <Shell>Loading…</Shell>;
  }

  if (error || !opportunity) {
    return (
      <Shell>
        <p style={{ color: "#871b16" }}>
          Couldn't load this opportunity:{" "}
          {error?.message || "not found"}
        </p>
      </Shell>
    );
  }

  if (!round) {
    return (
      <Shell>
        <p style={{ color: "#871b16" }}>
          This opportunity isn't in the round you specified.
        </p>
      </Shell>
    );
  }

  if (!isReviewerOnRound && !isAdmin) {
    return (
      <Shell>
        <BackLink
          type="button"
          onClick={() =>
            router.push("/dashboard/connect/review-queue")
          }
        >
          ← Review queue
        </BackLink>
        <Card>
          <h2>Not authorized</h2>
          <p>
            You're not a reviewer on this round. Ask the round creator
            ({displayName(round.createdBy)}) to add you in the Reviewers
            panel.
          </p>
        </Card>
      </Shell>
    );
  }

  const handleStatusChange = async (nextStatus) => {
    setStatus(nextStatus);
    setStatusFlash(null);
    await updateOpportunity({
      variables: {
        id: opportunity.id,
        input: { status: nextStatus },
      },
    });
    setStatusFlash("Saved.");
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    const body = noteBody.trim();
    if (!body) return;
    await createNote({
      variables: {
        input: {
          body,
          opportunity: { connect: { id: opportunity.id } },
          round: { connect: { id: round.id } },
        },
      },
    });
    setNoteBody("");
  };

  const handleDelete = async (noteId) => {
    if (!window.confirm("Delete this note?")) return;
    await deleteNote({ variables: { id: noteId } });
  };

  return (
    <Shell>
      <BackLink
        type="button"
        onClick={() => router.push("/dashboard/connect/review-queue")}
      >
        ← Review queue
      </BackLink>

      <TopBar>
        <h1>{opportunity.title}</h1>
        <div className="round-meta">
          Reviewing in round <strong>{round.title}</strong> · created by{" "}
          {displayName(round.createdBy)}
        </div>
      </TopBar>

      {isMentorOfOpp ? (
        <ConflictBanner>
          ⚠ Conflict of interest — you're the mentor on this opportunity.
          Your review carries more weight; consider deferring status
          changes to another reviewer or the round creator.
        </ConflictBanner>
      ) : null}

      <Card>
        <h2>Status</h2>
        <StatusBar>
          <StatusPill $status={currentStatus}>{currentStatus}</StatusPill>
          <label>
            Change to{" "}
            <select
              value={currentStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={updatingStatus}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          {statusFlash ? <span className="saved">{statusFlash}</span> : null}
          {canReturnToSponsor ? (
            <Button variant="outline" onClick={() => setReturnModalOpen(true)}>
              {t("reviewOpportunity.returnToSponsor", {}, {
                default: "Return with comments",
              })}
            </Button>
          ) : null}
        </StatusBar>
      </Card>

      <Card>
        <h2>Opportunity details</h2>
        <dl className="field-grid">
          <dt>Mentor</dt>
          <dd>
            {displayName(opportunity.mentor)}{" "}
            {opportunity.mentor?.email ? (
              <span style={{ color: "#888", fontSize: 13 }}>
                ({opportunity.mentor.email})
              </span>
            ) : null}
          </dd>

          <dt>Organization</dt>
          <dd>{opportunity.organization?.name || "—"}</dd>

          {opportunity.shortDescription ? (
            <>
              <dt>Short description</dt>
              <dd>{opportunity.shortDescription}</dd>
            </>
          ) : null}

          {opportunity.description ? (
            <>
              <dt>Description</dt>
              <dd style={{ whiteSpace: "pre-wrap" }}>
                {opportunity.description}
              </dd>
            </>
          ) : null}

          {opportunity.scopeDescription ? (
            <>
              <dt>Scope</dt>
              <dd style={{ whiteSpace: "pre-wrap" }}>
                {opportunity.scopeDescription}
              </dd>
            </>
          ) : null}

          <dt>Project category</dt>
          <dd>
            {opportunity.projectCategory || "—"}
            {opportunity.projectCategoryOther
              ? ` (${opportunity.projectCategoryOther})`
              : ""}
          </dd>

          <dt>Available</dt>
          <dd>
            {fmtDate(opportunity.availableFrom)} →{" "}
            {fmtDate(opportunity.availableTo)}
          </dd>

          <dt>Time commitment</dt>
          <dd>{opportunity.timeCommitment || "—"}</dd>

          <dt>Capacity</dt>
          <dd>
            {opportunity.studentCapacity ?? "—"} student
            {opportunity.studentCapacity === 1 ? "" : "s"} in teams of{" "}
            {opportunity.teamSize ?? "—"}
          </dd>

          {opportunity.coverImage?.url || opportunity.coverImageUrl ? (
            <>
              <dt>Cover image</dt>
              <dd>
                <img
                  src={
                    opportunity.coverImage?.url || opportunity.coverImageUrl
                  }
                  alt="Cover"
                  style={{
                    maxWidth: 240,
                    borderRadius: 8,
                    display: "block",
                  }}
                />
              </dd>
            </>
          ) : null}

          {opportunity.videoUrl ? (
            <>
              <dt>Video URL</dt>
              <dd>
                <a
                  href={opportunity.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#336f8a" }}
                >
                  {opportunity.videoUrl}
                </a>
              </dd>
            </>
          ) : null}
        </dl>
      </Card>

      <Card>
        <h2>Review notes</h2>
        <NoteForm onSubmit={handleAddNote}>
          <textarea
            value={noteBody}
            onChange={(e) => setNoteBody(e.target.value)}
            placeholder="Leave a note for the round creator + other reviewers…"
          />
          <button type="submit" disabled={creatingNote || !noteBody.trim()}>
            {creatingNote ? "Posting…" : "Post note"}
          </button>
        </NoteForm>

        {notes.length === 0 ? (
          <p style={{ color: "#5f6871", fontSize: 13, margin: 0 }}>
            No notes yet.
          </p>
        ) : (
          <NoteList>
            {notes.map((n) => (
              <NoteRow key={n.id}>
                <div className="meta">
                  <span>
                    <span className="author">{displayName(n.author)}</span>{" "}
                    · {fmtDateTime(n.createdAt)}
                  </span>
                </div>
                <div className="body">{n.body}</div>
                {n.author?.id === me?.id || isAdmin ? (
                  <button
                    className="delete"
                    type="button"
                    onClick={() => handleDelete(n.id)}
                  >
                    Delete
                  </button>
                ) : null}
              </NoteRow>
            ))}
          </NoteList>
        )}
      </Card>
      <ReturnOpportunityModal
        open={returnModalOpen}
        onClose={() => setReturnModalOpen(false)}
        onSuccess={handleReturnSuccess}
        opportunityId={opportunity.id}
        roundId={round.id}
        mentorId={opportunity.mentor?.id}
        refetchQueries={reviewRefetchQueries}
      />
    </Shell>
  );
}
