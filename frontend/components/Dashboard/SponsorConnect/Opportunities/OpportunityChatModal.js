import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

import Button from "../../../DesignSystem/Button";
import Modal from "../../../DesignSystem/Modal";
import { GET_OPPORTUNITY } from "../../../Queries/Opportunity";
import OpportunityReviewNotesThread from "../../Connect/OpportunityReviewNotesThread";
import {
  REVIEW_NOTE_KIND,
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
    user?.id &&
    opportunity?.mentor?.id === user.id
  );

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
            viewerId={user?.id}
            canCreate={isMentorOfOpportunity}
            canDeleteAsAdmin={false}
            messageKind={REVIEW_NOTE_KIND.SPONSOR_REPLY}
            mode="sponsor"
            needsRoundSelection={needsRoundSelection}
            onSelectRound={
              opportunityRounds.length > 1 ? setRoundId : undefined
            }
            refetchQueries={[
              { query: GET_OPPORTUNITY, variables: { id: opportunityId } },
            ]}
            titleAs="h3"
          />
        </ThreadWrap>
      ) : null}
    </Modal>
  );
}
