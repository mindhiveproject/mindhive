// Teacher/admin network review surface that replaces legacy Editor.js ?review=1.
// Round-assigned reviewers continue to use /dashboard/connect/review.
import { useContext, useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";

import Button from "../../../DesignSystem/Button";
import DefinitionForm from "../../../Forms/DefinitionForm";
import { UserContext } from "../../../Global/Authorized";
import useEmail from "../../../../lib/useEmail";
import {
  buildReviewStatusInput,
  confirmReviewStatusTransition,
  getReviewPrimaryAction,
  reviewEmailCopy,
} from "../../../../lib/opportunityReviewActions";
import { OPPORTUNITY_FLASH } from "../../../../lib/opportunityFlash";
import {
  resolveActiveReviewRound,
  REVIEW_NOTE_KIND,
} from "../../../../lib/reviewThreadRound";
import { GET_OPPORTUNITY } from "../../../Queries/Opportunity";
import { UPDATE_OPPORTUNITY } from "../../../Mutations/Opportunity";
import useConnectRole from "../useConnectRole";
import OpportunityReviewNotesThread from "../OpportunityReviewNotesThread";
import ReturnOpportunityModal from "../ReturnOpportunityModal";
import { isReturnableOpportunityStatus } from "../returnOpportunityUtils";
import OpportunityWorkflowStepper from "../../SponsorConnect/Opportunities/OpportunityWorkflowStepper";

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
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 12px;
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
    font-family: "Inter", sans-serif;
    font-size: 18px;
    color: #171717;
  }
`;

const Banner = styled.div`
  padding: 12px 16px;
  border-radius: 12px;
  background: #e8f1f5;
  border: 1px solid #b7d0db;
  color: #1f4f63;
  font-size: 14px;
`;

function rolesForViewer(connectRole) {
  const roles = [];
  if (connectRole.isAdmin) roles.push("admin");
  if (connectRole.isTeacher) roles.push("teacher");
  if (connectRole.isScientist) roles.push("scientist");
  if (connectRole.isMentor) roles.push("mentor");
  if (connectRole.isStudent) roles.push("student");
  if (connectRole.isSponsor) roles.push("sponsor");
  return roles;
}

export default function NetworkReview({ opportunityId, query, user }) {
  const router = useRouter();
  const { t } = useTranslation("connect");
  const { user: me } = useContext(UserContext);
  const viewer = user || me;
  const { sendEmail } = useEmail();
  const connectRole = useConnectRole();
  const { isAdmin, isTeacher } = connectRole;
  const viewerRoles = rolesForViewer(connectRole);

  const explicitRoundId =
    typeof query?.round === "string" ? query.round : null;

  const { data, loading } = useQuery(GET_OPPORTUNITY, {
    variables: { id: opportunityId },
    skip: !opportunityId,
    fetchPolicy: "cache-and-network",
  });
  const opportunity = data?.opportunity;

  const opportunityRounds = useMemo(() => {
    const byId = new Map();
    for (const round of opportunity?.rounds || []) {
      if (round?.id) byId.set(round.id, round);
    }
    for (const note of opportunity?.reviewNotes || []) {
      if (note?.round?.id && !byId.has(note.round.id)) {
        byId.set(note.round.id, note.round);
      }
    }
    return [...byId.values()];
  }, [opportunity?.rounds, opportunity?.reviewNotes]);

  const roundResolution = useMemo(
    () =>
      resolveActiveReviewRound({
        rounds: opportunityRounds,
        explicitRoundId,
      }),
    [opportunityRounds, explicitRoundId],
  );

  const activeRoundId = roundResolution.roundId;
  const needsRoundSelection = roundResolution.needsSelection;

  const [busy, setBusy] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);

  const refetchQueries = useMemo(
    () =>
      opportunityId
        ? [{ query: GET_OPPORTUNITY, variables: { id: opportunityId } }]
        : [],
    [opportunityId],
  );

  const [updateOpportunity] = useMutation(UPDATE_OPPORTUNITY, {
    refetchQueries,
    awaitRefetchQueries: true,
  });

  const handleSelectRound = (nextRoundId) => {
    const nextQuery = { ...router.query, op: opportunityId, review: "1" };
    if (nextRoundId) {
      nextQuery.round = nextRoundId;
    } else {
      delete nextQuery.round;
    }
    router.replace(
      { pathname: router.pathname, query: nextQuery },
      undefined,
      { shallow: true },
    );
  };

  const notifySponsor = async (nextStatus) => {
    const mentorId = opportunity?.mentor?.id;
    const copy = reviewEmailCopy(nextStatus, t);
    if (!mentorId || !copy) return;
    try {
      await sendEmail({
        receiverId: mentorId,
        title: copy.title,
        message: copy.message,
        link: `/dashboard/sponsor-connect/opportunities?op=${opportunityId}`,
      });
    } catch (e) {
      console.error("Opportunity review notification failed:", e);
    }
  };

  const handleReviewAction = async (nextStatus) => {
    if (
      !confirmReviewStatusTransition({
        nextStatus,
        scopeDescription: opportunity?.scopeDescription,
        t,
      })
    ) {
      return;
    }

    setBusy(true);
    try {
      await updateOpportunity({
        variables: {
          id: opportunityId,
          input: buildReviewStatusInput({
            nextStatus,
            opportunity,
            reviewerId: viewer?.id,
          }),
        },
      });
      await notifySponsor(nextStatus);

      const flashKey =
        nextStatus === "pre_selected"
          ? OPPORTUNITY_FLASH.PRE_SELECTED
          : nextStatus === "accepted"
            ? OPPORTUNITY_FLASH.ACCEPTED
            : nextStatus === "published"
              ? OPPORTUNITY_FLASH.PUBLISHED
              : null;

      router.push({
        pathname: "/dashboard/connect/opportunities",
        query: {
          tab: "review",
          ...(flashKey ? { flash: flashKey } : {}),
        },
      });
    } finally {
      setBusy(false);
    }
  };

  if (loading && !opportunity) {
    return (
      <Shell>
        {t("opportunityEditor.loading", {}, {
          default: "Loading opportunity…",
        })}
      </Shell>
    );
  }

  if (!opportunity) {
    return (
      <Shell>
        {t("opportunityEditor.notFound", {}, {
          default: "Opportunity not found.",
        })}
      </Shell>
    );
  }

  const pageTitle =
    (opportunity.title || "").trim() ||
    t("opportunityEditor.review.pageTitle", {}, {
      default: "Review opportunities",
    });
  const backLabel = t("opportunityEditor.review.backLink", {}, {
    default: "Back to review queue",
  });
  const reviewPrimaryAction = getReviewPrimaryAction(opportunity.status, t);
  const canReturn =
    (isTeacher || isAdmin) &&
    isReturnableOpportunityStatus(opportunity.status);
  const scopeComplete = Boolean(
    (opportunity.scopeDescription || "").trim(),
  );

  return (
    <Shell>
      <TopBar>
        <TopBarLeft>
          <BackLink
            type="button"
            onClick={() =>
              router.push({
                pathname: "/dashboard/connect/opportunities",
                query: { tab: "review" },
              })
            }
            aria-label={backLabel}
            title={backLabel}
            disabled={busy}
          >
            {BACK_CHEVRON}
          </BackLink>
          <TitleRow>
            <h1 title={pageTitle}>{pageTitle}</h1>
          </TitleRow>
        </TopBarLeft>
        <Actions>
          {canReturn && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setReturnOpen(true)}
              disabled={busy || !activeRoundId}
            >
              {t("reviewOpportunity.returnToSponsor", {}, {
                default: "Return with comments",
              })}
            </Button>
          )}
          {reviewPrimaryAction && (
            <Button
              type="button"
              variant="filled"
              onClick={() =>
                handleReviewAction(reviewPrimaryAction.nextStatus)
              }
              disabled={busy}
            >
              {busy
                ? t("opportunityEditor.saving", {}, { default: "Saving…" })
                : reviewPrimaryAction.label}
            </Button>
          )}
        </Actions>
      </TopBar>

      <Banner>
        {t("opportunityEditor.review.modeBanner", {}, {
          default: "You are reviewing this opportunity as a teacher.",
        })}
      </Banner>

      <Card>
        <h2>
          {t("opportunityEditor.review.statusHeading", {}, {
            default: "Status",
          })}
        </h2>
        <OpportunityWorkflowStepper
          status={opportunity.status || "draft"}
          scopeComplete={scopeComplete}
          viewerRole="teacher"
        />
      </Card>

      <Card>
        <h2>
          {t("opportunityEditor.review.proposalHeading", {}, {
            default: "Proposal",
          })}
        </h2>
        <DefinitionForm
          definitionKey="opportunity"
          entity={opportunity}
          viewerRoles={viewerRoles}
          locale={router.locale}
          readOnly
          hideSaveButton
        />
      </Card>

      <Card>
        <OpportunityReviewNotesThread
          opportunityId={opportunity.id}
          roundId={activeRoundId}
          notes={opportunity.reviewNotes || []}
          rounds={opportunityRounds}
          viewerId={viewer?.id}
          canCreate={isTeacher || isAdmin}
          canDeleteAsAdmin={isAdmin}
          needsRoundSelection={needsRoundSelection}
          onSelectRound={handleSelectRound}
          refetchQueries={refetchQueries}
          messageKind={REVIEW_NOTE_KIND.REVIEWER_COMMENT}
          mode="teacher"
        />
      </Card>

      <ReturnOpportunityModal
        open={returnOpen}
        onClose={() => setReturnOpen(false)}
        onSuccess={() => {
          setReturnOpen(false);
          router.push({
            pathname: "/dashboard/connect/opportunities",
            query: { tab: "review" },
          });
        }}
        opportunityId={opportunity.id}
        roundId={activeRoundId}
        mentorId={opportunity.mentor?.id}
        refetchQueries={refetchQueries}
      />
    </Shell>
  );
}
