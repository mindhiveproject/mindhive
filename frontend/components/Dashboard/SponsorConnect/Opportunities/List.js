import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";

import { MY_OPPORTUNITIES } from "../../../Queries/Opportunity";
import { DELETE_OPPORTUNITY } from "../../../Mutations/Opportunity";
import Button from "../../../DesignSystem/Button";
import Chip from "../../../DesignSystem/Chip";
import IconButton from "../../../DesignSystem/IconButton";
import InfoTooltip from "../../../DesignSystem/InfoTooltip";
import { OpportunityPageShell as Shell } from "./OpportunityPageLayout";
import {
  isProposalFormAnswerComplete,
  getProposalEntrySavedAt,
} from "../../../../lib/opportunityProposalData";
import { isRoundSponsorFormsVisible } from "../../../../lib/opportunityEditorTabs";
import OpportunityChatModal from "./OpportunityChatModal";
import OpportunityStatusModal from "./OpportunityStatusModal";
import OpportunityFollowUpFormModal from "./OpportunityFollowUpFormModal";

const MESSAGE_ICON = (
  <img
    src="/assets/icons/message.svg"
    alt=""
    width={24}
    height={24}
    aria-hidden
  />
);

const STATUS_ICON = (
  <img
    src="/assets/icons/status/inProgress.svg"
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
  border-radius: 16px;
  color: #5f6871;
  font-family: "Inter", sans-serif;
`;

const EmptyRow = styled.div`
  display: grid;
  grid-template-columns: 1fr;
`;

const EmptyCell = styled.div`
  padding: 48px 24px;
  text-align: center;
  color: #5f6871;
  font-size: 14px;
  grid-column: 1 / -1;
`;

const Table = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  background: #ffffff;
  border: 1px solid #e6e6e6;
  border-radius: 16px;
  overflow: hidden;
  font-family: "Inter", sans-serif;
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(160px, 220px) minmax(220px, auto);
  gap: 16px;
  padding: 12px 20px;
  background: #f0f4f6;
  border-bottom: 1px solid #e6e6e6;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: #5f6871;

  @media (max-width: 720px) {
    display: none;
  }
`;

const OpportunityBlock = styled.div`
  border-bottom: 1px solid #ececec;

  &:last-child {
    border-bottom: none;
  }
`;

const TableRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(160px, 220px) minmax(220px, auto);
  gap: 16px;
  align-items: start;
  padding: 14px 20px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
    gap: 10px;
  }
`;

const TitleCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
`;

const Title = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: #171717;
  word-break: break-word;
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

const VisibilityText = styled.span`
  display: inline-block;
  max-width: 100%;
  font-family: "Inter", sans-serif;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.4;
  color: #336f8a;
  cursor: default;
  border-bottom: 1px dotted rgba(51, 111, 138, 0.45);

  &.isEmpty {
    color: #5f6871;
    border-bottom-color: rgba(95, 104, 113, 0.4);
  }
`;

const TooltipNetworkList = styled.ul`
  margin: 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  justify-content: flex-end;
`;

const SubRows = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 0 20px 14px 36px;
  background: #fafbfc;
  border-top: 1px dashed #e6e6e6;
`;

const SubRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 0;
  border-bottom: 1px solid #ececec;

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
`;

const SubRowHeader = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #171717;
  line-height: 1.4;
`;

const SubRowMeta = styled.div`
  font-size: 12px;
  color: #5f6871;
`;

const FormLine = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  font-size: 13px;
  color: #171717;
`;

const FormStatus = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;

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

function visibilityLabel(count, tConnect) {
  if (count === 0) {
    return tConnect("myOpportunitiesList.visibility.none", {}, {
      default: "Not visible in any class network",
    });
  }
  if (count === 1) {
    return tConnect("myOpportunitiesList.visibility.one", {}, {
      default: "Visible in 1 class network",
    });
  }
  return tConnect(
    "myOpportunitiesList.visibility.many",
    { count },
    { default: "Visible in {{count}} class networks" },
  );
}

function visibilityTooltipContent(networks, tConnect) {
  if (!networks.length) {
    return tConnect("myOpportunitiesList.visibility.modalEmpty", {}, {
      default:
        "This opportunity is not associated with any class network yet.",
    });
  }

  return (
    <div>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>
        {tConnect("myOpportunitiesList.visibility.modalTitle", {}, {
          default: "Visible in class networks",
        })}
      </div>
      <TooltipNetworkList>
        {networks.map((network) => (
          <li key={network.id}>{network.title}</li>
        ))}
      </TooltipNetworkList>
    </div>
  );
}

export default function OpportunitiesList({ user }) {
  const router = useRouter();
  const { t } = useTranslation("common");
  const { t: tConnect } = useTranslation("connect");
  const { data, loading, refetch } = useQuery(MY_OPPORTUNITIES, {
    fetchPolicy: "cache-and-network",
  });
  const [deleteOpportunity] = useMutation(DELETE_OPPORTUNITY);
  const [chatModal, setChatModal] = useState(null);
  const [statusModalOpportunityId, setStatusModalOpportunityId] =
    useState(null);
  const [formModal, setFormModal] = useState(null);

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

  const handleOpenChat = (opportunity) => {
    const heldRound =
      opportunity.status === "pre_selected"
        ? (opportunity.rounds || [])[0]
        : null;
    setChatModal({
      opportunityId: opportunity.id,
      initialRoundId: heldRound?.id || null,
    });
  };

  const handleOpenStatus = (opportunity) => {
    setStatusModalOpportunityId(opportunity.id);
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

      {!loading && (
        <Table
          role="table"
          aria-label={t("opportunities.title", {}, { default: "My opportunities" })}
        >
          <TableHeader role="row">
            <div role="columnheader">
              {t("opportunities.columns.name", {}, { default: "Name" })}
            </div>
            <div role="columnheader">
              {tConnect("myOpportunitiesList.columns.visibility", {}, {
                default: "Visibility",
              })}
            </div>
            <div role="columnheader">
              {t("opportunities.columns.actions", {}, { default: "Actions" })}
            </div>
          </TableHeader>
          {opportunities.length === 0 ? (
            <EmptyRow role="row">
              <EmptyCell role="cell">
                {t("opportunities.empty", {}, {
                  default:
                    "You haven't created any opportunities yet. Click New opportunity to publish your first project for students.",
                })}
              </EmptyCell>
            </EmptyRow>
          ) : (
            opportunities.map((opportunity) => {
              const networks = opportunity.classNetworks || [];
              const networkCount = networks.length;
              const heldRounds =
                opportunity.status === "pre_selected"
                  ? opportunity.rounds || []
                  : [];

              return (
                <OpportunityBlock key={opportunity.id}>
                  <TableRow role="row">
                    <TitleCell role="cell">
                      <Title>{opportunity.title}</Title>
                      {networkCount === 0 && (
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
                    </TitleCell>
                    <div role="cell">
                      <InfoTooltip
                        content={visibilityTooltipContent(networks, tConnect)}
                        position="bottomLeft"
                        portal
                        wrapperStyle={{ maxWidth: "100%" }}
                        tooltipStyle={{ maxWidth: "min(320px, 90vw)" }}
                      >
                        <VisibilityText
                          className={networkCount === 0 ? "isEmpty" : undefined}
                        >
                          {visibilityLabel(networkCount, tConnect)}
                        </VisibilityText>
                      </InfoTooltip>
                    </div>
                    <Actions role="cell">
                      <IconButton
                        variant="text"
                        icon={MESSAGE_ICON}
                        ariaLabel={tConnect(
                          "myOpportunitiesList.openChat",
                          {},
                          { default: "Open messages" },
                        )}
                        title={tConnect(
                          "myOpportunitiesList.openChat",
                          {},
                          { default: "Open messages" },
                        )}
                        onClick={() => handleOpenChat(opportunity)}
                      />
                      <IconButton
                        variant="text"
                        icon={STATUS_ICON}
                        ariaLabel={tConnect(
                          "myOpportunitiesList.openStatus",
                          {},
                          { default: "Open status" },
                        )}
                        title={tConnect(
                          "myOpportunitiesList.openStatus",
                          {},
                          { default: "Open status" },
                        )}
                        onClick={() => handleOpenStatus(opportunity)}
                      />
                      <Chip
                        label={t("opportunities.edit", {}, { default: "Edit" })}
                        onClick={() => handleEdit(opportunity.id)}
                      />
                      <Chip
                        label={t("opportunities.delete", {}, {
                          default: "Delete",
                        })}
                        onClick={() => handleDelete(opportunity.id)}
                        style={DELETE_CHIP_STYLE}
                      />
                    </Actions>
                  </TableRow>

                  {heldRounds.length > 0 && (
                    <SubRows>
                      {heldRounds.map((round) => {
                        const forms = isRoundSponsorFormsVisible(round)
                          ? round.formDefinitions || []
                          : [];
                        const networkTitle =
                          round.classNetwork?.title ||
                          tConnect(
                            "myOpportunitiesList.held.unknownNetwork",
                            {},
                            { default: "Class network" },
                          );
                        const roundTitle =
                          round.title ||
                          tConnect(
                            "myOpportunitiesList.held.unknownRound",
                            {},
                            { default: "Matching round" },
                          );

                        return (
                          <SubRow key={round.id}>
                            <SubRowHeader>
                              {tConnect(
                                "myOpportunitiesList.held.title",
                                {
                                  network: networkTitle,
                                  round: roundTitle,
                                },
                                {
                                  default:
                                    "Held · {{network}} · {{round}}",
                                },
                              )}
                            </SubRowHeader>
                            <SubRowMeta>
                              {tConnect(
                                "myOpportunitiesList.held.preSelected",
                                {},
                                {
                                  default:
                                    "Pre-selected for this matching round",
                                },
                              )}
                            </SubRowMeta>
                            {forms.length === 0 ? (
                              <SubRowMeta>
                                {tConnect(
                                  "myOpportunitiesList.held.noFurtherQuestions",
                                  {},
                                  {
                                    default:
                                      "The teacher has not asked any further questions so far.",
                                  },
                                )}
                              </SubRowMeta>
                            ) : (
                              forms.map((form) => {
                                const complete = isProposalFormAnswerComplete(
                                  opportunity.proposalData,
                                  form.id,
                                );
                                const savedAtLabel = formatSavedAt(
                                  getProposalEntrySavedAt(
                                    opportunity.proposalData,
                                    form.id,
                                  ),
                                );
                                const statusLabel = complete
                                  ? savedAtLabel
                                    ? tConnect(
                                        "myOpportunitiesList.held.formCompleteSaved",
                                        { date: savedAtLabel },
                                        {
                                          default: "Complete · {{date}}",
                                        },
                                      )
                                    : tConnect(
                                        "myOpportunitiesList.held.formComplete",
                                        {},
                                        { default: "Complete" },
                                      )
                                  : savedAtLabel
                                  ? tConnect(
                                      "myOpportunitiesList.held.formIncompleteSaved",
                                      { date: savedAtLabel },
                                      {
                                        default: "Incomplete · saved {{date}}",
                                      },
                                    )
                                  : tConnect(
                                      "myOpportunitiesList.held.formIncomplete",
                                      {},
                                      { default: "Incomplete" },
                                    );
                                return (
                                  <FormLine key={form.id}>
                                    <span>
                                      {tConnect(
                                        "myOpportunitiesList.held.followUp",
                                        {
                                          title:
                                            form.title ||
                                            form.key ||
                                            form.id,
                                        },
                                        {
                                          default: "Follow-up: {{title}}",
                                        },
                                      )}
                                    </span>
                                    <FormStatus
                                      className={
                                        complete ? "complete" : "incomplete"
                                      }
                                    >
                                      {statusLabel}
                                    </FormStatus>
                                    <Chip
                                      label={
                                        complete
                                          ? tConnect(
                                              "myOpportunitiesList.held.openForm",
                                              {},
                                              { default: "Open form" },
                                            )
                                          : tConnect(
                                              "myOpportunitiesList.held.continueForm",
                                              {},
                                              { default: "Continue form" },
                                            )
                                      }
                                      onClick={() =>
                                        handleOpenForm(
                                          opportunity,
                                          form,
                                          round,
                                        )
                                      }
                                    />
                                  </FormLine>
                                );
                              })
                            )}
                          </SubRow>
                        );
                      })}
                    </SubRows>
                  )}
                </OpportunityBlock>
              );
            })
          )}
        </Table>
      )}

      <OpportunityChatModal
        open={Boolean(chatModal?.opportunityId)}
        onClose={() => setChatModal(null)}
        opportunityId={chatModal?.opportunityId}
        initialRoundId={chatModal?.initialRoundId}
        user={user}
      />
      <OpportunityStatusModal
        open={Boolean(statusModalOpportunityId)}
        onClose={() => setStatusModalOpportunityId(null)}
        opportunityId={statusModalOpportunityId}
      />
      <OpportunityFollowUpFormModal
        open={Boolean(formModal?.formMeta?.id)}
        onClose={() => setFormModal(null)}
        opportunity={formModal?.opportunity}
        formMeta={formModal?.formMeta}
      />
    </Shell>
  );
}
