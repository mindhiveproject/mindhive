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
import Chip from "../../../DesignSystem/Chip";
import { UserContext } from "../../../Global/Authorized";
import { REVIEW_OPPORTUNITY } from "../../../Queries/OpportunityReviewNote";
import { UPDATE_OPPORTUNITY } from "../../../Mutations/Opportunity";
import useConnectRole from "../useConnectRole";
import OpportunityReviewNotesThread from "../OpportunityReviewNotesThread";
import {
  isReturnableOpportunityStatus,
  returnOpportunityToSponsor,
} from "../returnOpportunityUtils";
import { REVIEW_NOTE_KIND } from "../../../../lib/reviewThreadRound";
import {
  displayProfileName,
  getOpportunityMentors,
  getOpportunitySponsors,
  isMentorTbd,
  isOpportunityStakeholder,
} from "../../../../lib/opportunityPeople";

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
    font: var(--MH-Type-Title-Large);
    letter-spacing: 0;
    color: #171717;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .round-meta {
    color: #5f6871;
    font: var(--MH-Type-Body-Base);
    letter-spacing: 0;
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
    font: var(--MH-Type-Title-Large);
    letter-spacing: 0;
    color: #171717;
  }

  .field-grid {
    display: grid;
    grid-template-columns: 180px 1fr;
    gap: 8px 16px;
    font: var(--MH-Type-Label-Base);
    letter-spacing: 0;
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
  font: var(--MH-Type-Body-Base);
  letter-spacing: 0;
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
    font: var(--MH-Type-Label-Base);
    letter-spacing: 0;
    color: #5f6871;
  }

  select {
    border: 1px solid #d3dae0;
    border-radius: 100px;
    padding: 8px 16px;
    font: var(--MH-Type-Label-Base);
    letter-spacing: 0;
    color: #171717;
    background: #ffffff;
  }

  .saved {
    color: #1d6b3a;
    font: var(--MH-Type-Body-Base);
    letter-spacing: 0;
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
  const { user: me } = useContext(UserContext);
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

  const isMentorOfOpp = isOpportunityStakeholder(opportunity, me?.id);

  const [status, setStatus] = useState(null);
  const [statusFlash, setStatusFlash] = useState(null);
  const [showReturnInvite, setShowReturnInvite] = useState(false);
  const [returnError, setReturnError] = useState(null);

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

  const currentStatus = status || opportunity?.status;
  const canReturnToSponsor =
    (isReviewerOnRound || isAdmin) &&
    currentStatus &&
    isReturnableOpportunityStatus(currentStatus);

  const handleReturnAndWriteMessage = async () => {
    if (!opportunity?.id || updatingStatus) return;
    setReturnError(null);
    try {
      await returnOpportunityToSponsor({
        updateOpportunity,
        opportunityId: opportunity.id,
      });
      setStatus("returned");
      setShowReturnInvite(true);
    } catch (e) {
      setReturnError(
        e?.message ||
          t("returnModal.error", {}, {
            default: "Could not return this opportunity. Please try again.",
          }),
      );
    }
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
    const backLabel = t("reviewOpportunity.backLink", {}, {
      default: "Back to review queue",
    });
    return (
      <Shell>
        <TopBar>
          <TopBarLeft>
            <BackLink
              type="button"
              onClick={() =>
                router.push("/dashboard/connect/review-queue")
              }
              aria-label={backLabel}
              title={backLabel}
            >
              {BACK_CHEVRON}
            </BackLink>
            <TitleRow>
              <h1>Not authorized</h1>
            </TitleRow>
          </TopBarLeft>
        </TopBar>
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

  const pageTitle = opportunity.title || "";
  const backLabel = t("reviewOpportunity.backLink", {}, {
    default: "Back to review queue",
  });
  const returnLabel = t("reviewOpportunity.returnToSponsor", {}, {
    default: "Return and write message",
  });

  return (
    <Shell>
      <TopBar>
        <TopBarLeft>
          <BackLink
            type="button"
            onClick={() => router.push("/dashboard/connect/review-queue")}
            aria-label={backLabel}
            title={backLabel}
          >
            {BACK_CHEVRON}
          </BackLink>
          <TitleRow>
            <h1 title={pageTitle}>{pageTitle}</h1>
            <div className="round-meta">
              Reviewing in round <strong>{round.title}</strong> · created by{" "}
              {displayName(round.createdBy)}
            </div>
          </TitleRow>
        </TopBarLeft>
        {canReturnToSponsor ? (
          <Actions>
            <Button
              variant="filled"
              onClick={handleReturnAndWriteMessage}
              disabled={updatingStatus}
            >
              {updatingStatus
                ? t("returnModal.submitting", {}, { default: "Returning…" })
                : returnLabel}
            </Button>
          </Actions>
        ) : null}
      </TopBar>

      {returnError ? (
        <p
          className="MH-Type-Body-Base"
          style={{ margin: 0, color: "#871b16" }}
        >
          {returnError}
        </p>
      ) : null}

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
          <Chip label={currentStatus} selected />
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
        </StatusBar>
      </Card>

      <Card>
        <h2>Opportunity details</h2>
        <dl className="field-grid">
          <dt>Sponsor(s)</dt>
          <dd>
            {getOpportunitySponsors(opportunity)
              .map((profile) => displayProfileName(profile))
              .filter(Boolean)
              .join(", ") || "—"}
          </dd>

          <dt>Mentor(s)</dt>
          <dd>
            {isMentorTbd(opportunity)
              ? "Mentor TBD"
              : getOpportunityMentors(opportunity)
                  .map((profile) => displayProfileName(profile))
                  .filter(Boolean)
                  .join(", ") || "—"}
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
        <OpportunityReviewNotesThread
          opportunityId={opportunity.id}
          roundId={round.id}
          notes={notes}
          viewerId={me?.id}
          canCreate={isReviewerOnRound || isAdmin}
          canDeleteAsAdmin={isAdmin}
          messageKind={REVIEW_NOTE_KIND.REVIEWER_COMMENT}
          mode="teacher"
          refetchQueries={reviewRefetchQueries}
          titleAs="h2"
          autoFocusCompose={showReturnInvite}
          showReturnInvite={showReturnInvite}
          requestsAppointment={Boolean(opportunity.requestsAppointment)}
          onPosted={() => setShowReturnInvite(false)}
        />
      </Card>
    </Shell>
  );
}
