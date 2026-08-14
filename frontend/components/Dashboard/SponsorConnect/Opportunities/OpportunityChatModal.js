import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

import Button from "../../../DesignSystem/Button";
import Modal from "../../../DesignSystem/Modal";
import {
  GET_OPPORTUNITY,
  MY_OPPORTUNITIES,
} from "../../../Queries/Opportunity";
import { MARK_OPPORTUNITY_REVIEW_NOTES_READ } from "../../../Mutations/OpportunityReviewNote";
import OpportunityReviewNotesThread from "../../Connect/OpportunityReviewNotesThread";
import {
  REVIEW_NOTE_KIND,
  getUnreadReviewerCommentNotes,
  resolveActiveReviewRound,
} from "../../../../lib/reviewThreadRound";

const ThreadWrap = styled.div`
  section {
    width: 100%;
    margin-inline: 0;
  }
`;

const StatusText = styled.p`
  margin: 0;
  font-family: "Inter", sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: var(--MH-Theme-Neutrals-Dark, #5f6871);
`;

export default function OpportunityChatModal({
  open,
  onClose,
  opportunityId,
  initialRoundId = null,
  user,
}) {
  const { t } = useTranslation("connect");
  const [roundId, setRoundId] = useState(initialRoundId);
  const markedReadNoteIdsRef = useRef(new Set());
  const viewerId = user?.id || null;

  useEffect(() => {
    if (open) {
      setRoundId(initialRoundId || null);
    }
  }, [open, initialRoundId, opportunityId]);

  const { data, loading, error } = useQuery(GET_OPPORTUNITY, {
    variables: { id: opportunityId },
    skip: !open || !opportunityId,
    fetchPolicy: "cache-and-network",
  });

  const opportunity = data?.opportunity;
  const reviewNotes = opportunity?.reviewNotes || [];

  const opportunityRounds = useMemo(() => {
    const byId = new Map();
    for (const round of opportunity?.rounds || []) {
      if (round?.id) byId.set(round.id, round);
    }
    for (const note of reviewNotes) {
      if (note?.round?.id && !byId.has(note.round.id)) {
        byId.set(note.round.id, note.round);
      }
    }
    return [...byId.values()];
  }, [opportunity?.rounds, reviewNotes]);

  const roundResolution = useMemo(
    () =>
      resolveActiveReviewRound({
        rounds: opportunityRounds,
        explicitRoundId: roundId,
      }),
    [opportunityRounds, roundId],
  );

  const activeRoundId = roundResolution.roundId;
  const needsRoundSelection = roundResolution.needsSelection;
  const isMentorOfOpportunity = !!(
    viewerId && opportunity?.mentor?.id === viewerId
  );

  const unreadReviewerComments = useMemo(
    () =>
      getUnreadReviewerCommentNotes({
        notes: reviewNotes,
        roundId: activeRoundId,
        viewerId,
      }),
    [reviewNotes, activeRoundId, viewerId],
  );

  const markReadRefetchQueries = useMemo(
    () => [
      { query: GET_OPPORTUNITY, variables: { id: opportunityId } },
      { query: MY_OPPORTUNITIES },
    ],
    [opportunityId],
  );

  const [markNotesRead] = useMutation(MARK_OPPORTUNITY_REVIEW_NOTES_READ);

  // Mark teacher comments read when the sponsor opens Messages.
  useEffect(() => {
    if (!open) {
      markedReadNoteIdsRef.current = new Set();
      return;
    }
    if (!opportunityId || !activeRoundId || !viewerId) return;

    const noteIds = unreadReviewerComments
      .map((note) => note.id)
      .filter((id) => id && !markedReadNoteIdsRef.current.has(id));
    if (noteIds.length === 0) return;

    noteIds.forEach((id) => markedReadNoteIdsRef.current.add(id));

    markNotesRead({
      variables: { noteIds },
      refetchQueries: markReadRefetchQueries,
      awaitRefetchQueries: true,
    }).catch((err) => {
      noteIds.forEach((id) => markedReadNoteIdsRef.current.delete(id));
      console.error("Failed to mark review notes as read", err);
    });
  }, [
    open,
    opportunityId,
    activeRoundId,
    viewerId,
    unreadReviewerComments,
    markNotesRead,
    markReadRefetchQueries,
  ]);

  const title = opportunity?.title
    ? t(
        "myOpportunitiesList.modals.chatTitleNamed",
        { title: opportunity.title },
        { default: "Messages · {{title}}" },
      )
    : t("myOpportunitiesList.modals.chatTitle", {}, {
        default: "Messages",
      });

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="large"
      title={title}
      actions={
        <Button type="button" variant="outline" onClick={onClose}>
          {t("myOpportunitiesList.modals.close", {}, { default: "Close" })}
        </Button>
      }
    >
      {loading && !opportunity ? (
        <StatusText>
          {t("opportunityEditor.loading", {}, {
            default: "Loading opportunity…",
          })}
        </StatusText>
      ) : null}
      {error ? (
        <StatusText>
          {t("myOpportunitiesList.modals.loadError", {}, {
            default: "Could not load this opportunity. Please try again.",
          })}
        </StatusText>
      ) : null}
      {opportunity ? (
        <ThreadWrap>
          {opportunity.status === "returned" ? (
            <StatusText
              style={{
                marginBottom: 12,
                color: "#3f288f",
                fontWeight: 600,
              }}
            >
              {t("opportunityEditor.returnedBanner", {}, {
                default:
                  "A teacher returned your proposal — review their notes below, make changes, then resubmit for review.",
              })}
            </StatusText>
          ) : null}
          <OpportunityReviewNotesThread
            opportunityId={opportunity.id}
            roundId={activeRoundId}
            notes={reviewNotes}
            rounds={opportunityRounds}
            viewerId={viewerId}
            canCreate={isMentorOfOpportunity}
            canDeleteAsAdmin={false}
            messageKind={REVIEW_NOTE_KIND.SPONSOR_REPLY}
            mode="sponsor"
            needsRoundSelection={needsRoundSelection}
            onSelectRound={
              opportunityRounds.length > 1 ? setRoundId : undefined
            }
            refetchQueries={markReadRefetchQueries}
            titleAs="h3"
          />
        </ThreadWrap>
      ) : null}
    </Modal>
  );
}
