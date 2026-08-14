import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import styled from "styled-components";
import clsx from "clsx";
import useTranslation from "next-translate/useTranslation";

import { MY_OPPORTUNITIES } from "../../../Queries/Opportunity";
import { DELETE_OPPORTUNITY } from "../../../Mutations/Opportunity";
import Button from "../../../DesignSystem/Button";
import Chip from "../../../DesignSystem/Chip";
import IconButton from "../../../DesignSystem/IconButton";
import MessageCard from "../../../DesignSystem/MessageCard";
import { OpportunityPageShell as Shell } from "./OpportunityPageLayout";
import {
  isProposalFormAnswerComplete,
  getProposalEntrySavedAt,
} from "../../../../lib/opportunityProposalData";
import { isRoundSponsorFormsVisible } from "../../../../lib/opportunityEditorTabs";
import {
  OPPORTUNITY_FLASH,
  resolveOpportunityFlashMessage,
  useOpportunityFlashQuery,
} from "../../../../lib/opportunityFlash";
import { getUnreadReviewerCommentNotes } from "../../../../lib/reviewThreadRound";
import OpportunityChatModal from "./OpportunityChatModal";
import OpportunityFollowUpFormModal from "./OpportunityFollowUpFormModal";
import OpportunityListStepper from "./OpportunityListStepper";
import UnsubmitOpportunityModal from "./UnsubmitOpportunityModal";

const MESSAGE_ICON = (
  <img
    src="/assets/icons/message.svg"
    alt=""
    width={24}
    height={24}
    aria-hidden
  />
);

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;

  h1 {
    margin: 0;
    font-family: "Lato", sans-serif;
    font-size: clamp(28px, 4vw, 40px);
    font-weight: 600;
    color: #171717;
  }
`;

const Empty = styled.div`
  padding: 48px 24px;
  text-align: center;
  background: #ffffff;
  border: 1px solid #e6e6e6;
  border-radius: 16px;
  color: #5f6871;
  font-family: "Inter", sans-serif;
`;

const ListStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  font-family: "Inter", sans-serif;
`;

const OpportunityCard = styled.article`
  background: #ffffff;
  border: 1px solid #e6e6e6;
  border-radius: 16px;
  overflow: hidden;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  padding: 16px 20px;

  @media (max-width: 720px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const Identity = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  flex: 1;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #171717;
  word-break: break-word;
  font-family: "Inter", sans-serif;
`;

const Hint = styled.div`
  font-size: 13px;
  line-height: 1.4;
  color: #92400e;
  background: #fef9ee;
  border: 1px solid #fcd34d;
  border-radius: 10px;
  padding: 8px 12px;
`;

const HeaderAside = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  flex-shrink: 0;

  @media (max-width: 720px) {
    align-items: stretch;
  }
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  justify-content: flex-end;

  @media (max-width: 720px) {
    justify-content: flex-start;
  }
`;

const MessageButtonWrap = styled.div`
  position: relative;
  flex-shrink: 0;
`;

const UNREAD_MESSAGE_BUTTON_STYLE = {
  background: "var(--MH-Theme-Additional-Accent-Light, #f5f2ff)",
};

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

const FormsPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 20px 16px;
  background: #fafbfc;
  border-top: 1px solid #e6e6e6;
`;

/** In-row success banner — sits on the white card so it doesn’t blend with the page shell. */
const RowFlashWrap = styled.div`
  padding: 0 20px 16px;
`;

const ROW_FLASH_STYLE = {
  background: "#e3f4ec",
  backgroundColor: "#e3f4ec",
  border: "1px solid #b8dcc8",
};

const RoundMeta = styled.div`
  font-size: 12px;
  color: #5f6871;
`;

const FormGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  background: #ffffff;
  border: 1px solid #e6e6e6;
  border-radius: 12px;
  overflow: hidden;
`;

const FormGridHeader = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 12px;
  padding: 10px 14px;
  background: #f0f4f6;
  border-bottom: 1px solid #e6e6e6;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: #5f6871;

  @media (max-width: 720px) {
    display: none;
  }
`;

const FormGridRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 12px;
  align-items: center;
  padding: 12px 14px;
  border-bottom: 1px solid #ececec;

  &:last-child {
    border-bottom: none;
  }

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
    gap: 8px;
  }
`;

const FormName = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: #171717;
  min-width: 0;
  word-break: break-word;
`;

const FormStatus = styled.span`
  display: inline-flex;
  align-items: center;
  justify-self: end;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;

  &.complete {
    background: #e3f4ec;
    color: #1d6b3a;
    border: 1px solid #b8dcc8;
  }

  &.incomplete {
    background: #fdf6e8;
    color: #8a6d3b;
    border: 1px solid #e8d4a8;
  }

  @media (max-width: 720px) {
    justify-self: start;
  }
`;

const FormAction = styled.div`
  justify-self: end;

  @media (max-width: 720px) {
    justify-self: start;
  }
`;

function formatSavedAt(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return null;
  }
}

const DELETE_CHIP_STYLE = {
  borderColor: "#c62828",
  color: "#c62828",
  background: "#ffffff",
};

function formStatusLabel(complete, savedAtLabel, tConnect) {
  if (complete) {
    return savedAtLabel
      ? tConnect(
          "myOpportunitiesList.held.formCompleteSaved",
          { date: savedAtLabel },
          { default: "Complete · {{date}}" },
        )
      : tConnect("myOpportunitiesList.held.formComplete", {}, {
          default: "Complete",
        });
  }
  return savedAtLabel
    ? tConnect(
        "myOpportunitiesList.held.formIncompleteSaved",
        { date: savedAtLabel },
        { default: "Incomplete · saved {{date}}" },
      )
    : tConnect("myOpportunitiesList.held.formIncomplete", {}, {
        default: "Incomplete",
      });
}

export default function OpportunitiesList({ user }) {
  const router = useRouter();
  const { t } = useTranslation("common");
  const { t: tConnect } = useTranslation("connect");
  const {
    flashMessage,
    flashOpportunityId,
    clearFlash,
  } = useOpportunityFlashQuery(tConnect);
  /** @type {[{ message: string, opportunityId: string }|null, Function]} */
  const [rowFlash, setRowFlash] = useState(null);
  const activeFlash =
    rowFlash ||
    (flashMessage
      ? { message: flashMessage, opportunityId: flashOpportunityId }
      : null);
  const dismissFlash = () => {
    setRowFlash(null);
    clearFlash();
  };
  const { data, loading, refetch } = useQuery(MY_OPPORTUNITIES, {
    fetchPolicy: "cache-and-network",
  });
  const [deleteOpportunity] = useMutation(DELETE_OPPORTUNITY);
  const [chatModal, setChatModal] = useState(null);
  const [formModal, setFormModal] = useState(null);
  const [unsubmitOpportunityId, setUnsubmitOpportunityId] = useState(null);

  const opportunities = data?.authenticatedItem?.opportunitiesCreated || [];

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        t("opportunities.deleteConfirm", {}, {
          default: "Delete this opportunity? This cannot be undone.",
        }),
      )
    ) {
      return;
    }
    await deleteOpportunity({ variables: { id } });
    refetch();
  };

  const handleEdit = (id) => {
    router.push({
      pathname: "/dashboard/sponsor-connect/opportunities",
      query: { op: id, tab: "proposal" },
    });
  };

  const handleOpenForm = (opportunity, form, round) => {
    setFormModal({
      opportunity,
      formMeta: {
        id: form.id,
        title: form.title || form.key || form.id,
        key: form.key,
        version: form.version,
        status: form.status,
        roundId: round?.id || null,
        roundTitle: round?.title || null,
        networkId: round?.classNetwork?.id || null,
        networkTitle: round?.classNetwork?.title || null,
      },
    });
  };

  const handleFormSaved = () => {
    const opportunityId = formModal?.opportunity?.id || null;
    setFormModal(null);
    if (opportunityId) {
      setRowFlash({
        opportunityId,
        message: tConnect("myOpportunitiesList.flash.formSaved", {}, {
          default: "Follow-up form saved.",
        }),
      });
    }
    refetch();
  };

  const handleUnsubmitSuccess = (nextStatus) => {
    const opportunityId = unsubmitOpportunityId;
    setUnsubmitOpportunityId(null);
    const flashKey =
      nextStatus === "returned"
        ? OPPORTUNITY_FLASH.UNSUBMITTED_REVISION
        : OPPORTUNITY_FLASH.UNSUBMITTED_DRAFT;
    const message = resolveOpportunityFlashMessage(flashKey, tConnect);
    if (opportunityId && message) {
      setRowFlash({ opportunityId, message });
    }
    refetch();
  };

  const handleOpenChat = (opportunity) => {
    const unreadNotes = getUnreadReviewerCommentNotes({
      notes: opportunity.reviewNotes,
      viewerId: user?.id,
    });
    const latestUnread = [...unreadNotes].sort((a, b) => {
      const aTime = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    })[0];
    const heldRound =
      opportunity.status === "pre_selected"
        ? (opportunity.rounds || [])[0]
        : null;
    setChatModal({
      opportunityId: opportunity.id,
      initialRoundId: latestUnread?.round?.id || heldRound?.id || null,
    });
  };

  return (
    <Shell>
      <TopBar>
        <h1>
          {t("opportunities.title", {}, { default: "My opportunities" })}
        </h1>
        <Button
          variant="filled"
          onClick={() =>
            router.push({
              pathname: "/dashboard/sponsor-connect/opportunities",
              query: { op: "new", tab: "proposal" },
            })
          }
        >
          {t("opportunities.newButton", {}, { default: "New opportunity" })}
        </Button>
      </TopBar>

      {loading && opportunities.length === 0 && (
        <Empty>
          {t("opportunities.loading", {}, { default: "Loading…" })}
        </Empty>
      )}

      {!loading && opportunities.length === 0 && (
        <Empty>
          {t("opportunities.empty", {}, {
            default:
              "You haven't created any opportunities yet. Click New opportunity to publish your first project for students.",
          })}
        </Empty>
      )}

      {!loading && opportunities.length > 0 && (
        <ListStack
          aria-label={t("opportunities.title", {}, {
            default: "My opportunities",
          })}
        >
          {opportunities.map((opportunity) => {
            const networks = opportunity.classNetworks || [];
            const networkCount = networks.length;
            const isPreSelected = opportunity.status === "pre_selected";
            const canUnsubmit = opportunity.status === "pending_review";
            const heldRounds = isPreSelected ? opportunity.rounds || [] : [];
            const unreadNotes = getUnreadReviewerCommentNotes({
              notes: opportunity.reviewNotes,
              viewerId: user?.id,
            });
            const unreadCount = unreadNotes.length;
            const chatAriaLabel =
              unreadCount > 0
                ? tConnect(
                    "myOpportunitiesList.openChatUnread",
                    { count: unreadCount },
                    { default: "Open messages, {{count}} unread" },
                  )
                : tConnect("myOpportunitiesList.openChat", {}, {
                    default: "Open messages",
                  });
            const showRowFlash =
              activeFlash?.opportunityId &&
              activeFlash.opportunityId === opportunity.id;

            return (
              <OpportunityCard key={opportunity.id}>
                <CardHeader>
                  <Identity>
                    <Title>{opportunity.title}</Title>
                    <OpportunityListStepper
                      status={opportunity.status}
                      proposalData={opportunity.proposalData}
                      rounds={opportunity.rounds}
                      reviewNotes={opportunity.reviewNotes}
                      videoFile={opportunity.videoFile}
                      networks={networks}
                      onStepClick={() => handleEdit(opportunity.id)}
                    />
                    {networkCount === 0 &&
                      (opportunity.status === "draft" ||
                        opportunity.status === "returned") && (
                      <Hint>
                        {tConnect(
                          "myOpportunitiesList.visibility.emptyHint",
                          {},
                          {
                            default:
                              "Add a class network so teachers can see this opportunity.",
                          },
                        )}
                      </Hint>
                    )}
                  </Identity>

                  <HeaderAside>
                    <Actions>
                      <MessageButtonWrap>
                        <IconButton
                          variant="text"
                          icon={MESSAGE_ICON}
                          ariaLabel={chatAriaLabel}
                          title={chatAriaLabel}
                          style={
                            unreadCount > 0
                              ? UNREAD_MESSAGE_BUTTON_STYLE
                              : undefined
                          }
                          onClick={() => handleOpenChat(opportunity)}
                        />
                        {unreadCount > 0 ? (
                          <UnreadBadge aria-hidden>
                            {unreadCount > 9 ? "9+" : unreadCount}
                          </UnreadBadge>
                        ) : null}
                      </MessageButtonWrap>
                      <Chip
                        label={t("opportunities.edit", {}, {
                          default: "Edit",
                        })}
                        onClick={() => handleEdit(opportunity.id)}
                      />
                      {canUnsubmit ? (
                        <Chip
                          label={tConnect(
                            "myOpportunitiesList.unsubmit.button",
                            {},
                            { default: "Unsubmit" },
                          )}
                          onClick={() =>
                            setUnsubmitOpportunityId(opportunity.id)
                          }
                        />
                      ) : null}
                      <Chip
                        label={t("opportunities.delete", {}, {
                          default: "Delete",
                        })}
                        onClick={() => handleDelete(opportunity.id)}
                        style={DELETE_CHIP_STYLE}
                      />
                    </Actions>
                  </HeaderAside>
                </CardHeader>

                {showRowFlash ? (
                  <RowFlashWrap>
                    <MessageCard
                      variant="success"
                      message={activeFlash.message}
                      onClose={dismissFlash}
                      closeAriaLabel={tConnect(
                        "myOpportunitiesList.flash.dismiss",
                        {},
                        { default: "Dismiss" },
                      )}
                      style={ROW_FLASH_STYLE}
                    />
                  </RowFlashWrap>
                ) : null}

                {heldRounds.map((round) => {
                  const forms = isRoundSponsorFormsVisible(round)
                    ? round.formDefinitions || []
                    : [];

                  return (
                    <FormsPanel key={round.id}>
                      {forms.length === 0 ? (
                        <RoundMeta>
                          {tConnect(
                            "myOpportunitiesList.held.noFurtherQuestions",
                            {},
                            {
                              default:
                                "The teacher has not asked any further questions so far.",
                            },
                          )}
                        </RoundMeta>
                      ) : (
                        <FormGrid role="table">
                          <FormGridHeader role="row">
                            <div role="columnheader">
                              {tConnect(
                                "myOpportunitiesList.held.formColumns.form",
                                {},
                                { default: "Follow-up form" },
                              )}
                            </div>
                            <div role="columnheader" aria-hidden />
                            <div role="columnheader" aria-hidden />
                          </FormGridHeader>
                          {forms.map((form) => {
                            const complete = isProposalFormAnswerComplete(
                              opportunity.proposalData,
                              form.id,
                              opportunity.videoFile,
                            );
                            const savedAtLabel = formatSavedAt(
                              getProposalEntrySavedAt(
                                opportunity.proposalData,
                                form.id,
                              ),
                            );
                            return (
                              <FormGridRow key={form.id} role="row">
                                <FormName role="cell">
                                  {form.title || form.key || form.id}
                                </FormName>
                                <FormStatus
                                  role="cell"
                                  className={clsx(
                                    complete ? "complete" : "incomplete",
                                  )}
                                >
                                  {formStatusLabel(
                                    complete,
                                    savedAtLabel,
                                    tConnect,
                                  )}
                                </FormStatus>
                                <FormAction role="cell">
                                  {complete ? (
                                    <Button
                                      type="button"
                                      variant="text"
                                      style={{
                                        color:
                                          "var(--MH-Theme-Neutrals-Dark, #6A6A6A)",
                                      }}
                                      onClick={() =>
                                        handleOpenForm(
                                          opportunity,
                                          form,
                                          round,
                                        )
                                      }
                                    >
                                      {tConnect(
                                        "myOpportunitiesList.held.openForm",
                                        {},
                                        { default: "Edit response" },
                                      )}
                                    </Button>
                                  ) : (
                                    <Chip
                                      label={tConnect(
                                        "myOpportunitiesList.held.continueForm",
                                        {},
                                        { default: "Respond to form" },
                                      )}
                                      onClick={() =>
                                        handleOpenForm(
                                          opportunity,
                                          form,
                                          round,
                                        )
                                      }
                                    />
                                  )}
                                </FormAction>
                              </FormGridRow>
                            );
                          })}
                        </FormGrid>
                      )}
                    </FormsPanel>
                  );
                })}
              </OpportunityCard>
            );
          })}
        </ListStack>
      )}

      <OpportunityChatModal
        open={Boolean(chatModal?.opportunityId)}
        onClose={() => setChatModal(null)}
        opportunityId={chatModal?.opportunityId}
        initialRoundId={chatModal?.initialRoundId}
        user={user}
      />
      <OpportunityFollowUpFormModal
        open={Boolean(formModal?.formMeta?.id)}
        onClose={() => setFormModal(null)}
        onSaved={handleFormSaved}
        opportunity={formModal?.opportunity}
        formMeta={formModal?.formMeta}
      />
      <UnsubmitOpportunityModal
        open={Boolean(unsubmitOpportunityId)}
        onClose={() => setUnsubmitOpportunityId(null)}
        opportunityId={unsubmitOpportunityId}
        onSuccess={handleUnsubmitSuccess}
      />
    </Shell>
  );
}
