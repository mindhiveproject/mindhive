import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

import IconButton from "../../../DesignSystem/IconButton";
import PanelHeader from "../../../DesignSystem/PanelHeader";
import Popover from "../../../DesignSystem/Popover";
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

const MESSAGE_ICON = (
  <img
    src="/assets/icons/message.svg"
    alt=""
    width={24}
    height={24}
    aria-hidden
  />
);

const UNREAD_MESSAGE_BUTTON_STYLE = {
  background: "var(--MH-Theme-Additional-Accent-Light, #f5f2ff)",
};

const BODY_STYLE = {
  display: "flex",
  flexDirection: "column",
  flex: 1,
  minHeight: 540,
  overflow: "hidden",
  padding: "0 16px 16px",
};

const BANNER_STYLE = {
  margin: "0 0 12px",
  flexShrink: 0,
  fontFamily: "Inter, sans-serif",
  fontSize: 14,
  lineHeight: 1.5,
  color: "#3f288f",
  fontWeight: 600,
};

const MessageButtonWrap = styled.div`
  position: relative;
  flex-shrink: 0;
`;

const UnreadBadge = styled.span`
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 100px;
  background: var(--MH-Theme-Secondary-Dark, #6f26ce);
  color: #ffffff;
  font-size: 11px;
  font-weight: 700;
  line-height: 18px;
  text-align: center;
  box-sizing: border-box;
  pointer-events: none;
`;

const ThreadWrap = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  height: 100%;

  section {
    width: 100%;
    margin-inline: 0;
    flex: 1 1 auto;
    min-height: 0;
  }
`;

function latestUnreadRoundId(notes, viewerId) {
  const unreadNotes = getUnreadReviewerCommentNotes({
    notes,
    viewerId,
  });
  const latestUnread = [...unreadNotes].sort((a, b) => {
    const aTime = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  })[0];
  return latestUnread?.round?.id || null;
}

/**
 * Message button in the opportunity editor top bar and the flyout it opens.
 *
 * Sponsors can read and reply to reviewer notes without leaving the editor.
 * Same Popover + PanelHeader pattern as NotificationsMenu.
 */
export default function OpportunityMessagesMenu({ opportunity, user }) {
  const { t } = useTranslation("connect");
  const [open, setOpen] = useState(false);
  const [roundId, setRoundId] = useState(null);
  const markedReadNoteIdsRef = useRef(new Set());
  const anchorRef = useRef(null);
  const viewerId = user?.id || null;
  const opportunityId = opportunity?.id || null;
  const reviewNotes = opportunity?.reviewNotes || [];

  const unreadNotes = useMemo(
    () =>
      getUnreadReviewerCommentNotes({
        notes: reviewNotes,
        viewerId,
      }),
    [reviewNotes, viewerId],
  );
  const unreadCount = unreadNotes.length;

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
    () =>
      opportunityId
        ? [
            { query: GET_OPPORTUNITY, variables: { id: opportunityId } },
            { query: MY_OPPORTUNITIES },
          ]
        : [{ query: MY_OPPORTUNITIES }],
    [opportunityId],
  );

  const [markNotesRead] = useMutation(MARK_OPPORTUNITY_REVIEW_NOTES_READ);

  const close = useCallback(() => {
    setOpen(false);
    setRoundId(null);
    anchorRef.current?.querySelector("button")?.focus();
  }, []);

  const openMenu = useCallback(() => {
    const heldRound =
      opportunity?.status === "pre_selected"
        ? (opportunity.rounds || [])[0]
        : null;
    setRoundId(
      latestUnreadRoundId(reviewNotes, viewerId) || heldRound?.id || null,
    );
    setOpen(true);
  }, [opportunity?.status, opportunity?.rounds, reviewNotes, viewerId]);

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

  const label =
    unreadCount > 0
      ? t(
          "myOpportunitiesList.openChatUnread",
          { count: unreadCount },
          { default: "Open messages, {{count}} unread" },
        )
      : t("myOpportunitiesList.openChat", {}, { default: "Open messages" });
  const title = t("myOpportunitiesList.modals.chatTitle", {}, {
    default: "Messages",
  });
  const closeLabel = t("myOpportunitiesList.modals.close", {}, {
    default: "Close",
  });

  return (
    <>
      <MessageButtonWrap ref={anchorRef}>
        <IconButton
          variant="text"
          icon={MESSAGE_ICON}
          ariaLabel={label}
          title={label}
          aria-expanded={open}
          aria-haspopup="dialog"
          style={unreadCount > 0 ? UNREAD_MESSAGE_BUTTON_STYLE : undefined}
          onClick={() => (open ? close() : openMenu())}
        />
        {unreadCount > 0 ? (
          <UnreadBadge aria-hidden>
            {unreadCount > 9 ? "9+" : unreadCount}
          </UnreadBadge>
        ) : null}
      </MessageButtonWrap>

      <Popover
        open={open}
        anchorRef={anchorRef}
        onClose={close}
        side="bottom"
        align="end"
        maxHeight={840}
        ariaLabel={title}
      >
        <PanelHeader title={title} onClose={close} closeLabel={closeLabel} />
        <div className="opportunityMessagesBody" style={BODY_STYLE}>
          {opportunity?.status === "returned" ? (
            <p style={BANNER_STYLE}>
              {t("opportunityEditor.returnedBanner", {}, {
                default:
                  "A teacher returned your proposal — review their notes below, make changes, then resubmit for review.",
              })}
            </p>
          ) : null}
          <ThreadWrap>
            <OpportunityReviewNotesThread
              opportunityId={opportunityId}
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
              layout="panel"
              showTitle={false}
              titleAs="h3"
            />
          </ThreadWrap>
        </div>
      </Popover>
    </>
  );
}
