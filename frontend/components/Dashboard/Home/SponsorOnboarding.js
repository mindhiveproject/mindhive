import { useEffect, useState } from "react";
import { useApolloClient, useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import { Modal } from "semantic-ui-react";
import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";

import { SPONSOR_ONBOARDING_STATE } from "../../Queries/User";
import { GET_PUBLIC_CLASS_NETWORKS } from "../../Queries/ClassNetwork";
import Button from "../../DesignSystem/Button";
import Chip from "../../DesignSystem/Chip";
import StyledModal from "../../styles/StyledModal";
import {
  isSponsorOnboardingDismissed,
  setSponsorOnboardingDismissed,
} from "../../../lib/sponsorOnboardingDismiss";
import { collectMemberClassNetworks } from "../../../lib/opportunityClassNetworks";
import { joinClassNetwork } from "../../../lib/joinClassNetwork";

const FEEDBACK_NETWORK = "feedback_network";
const SCHOOL_NETWORK = "school_network";

const NETWORK_ICON = (
  <img
    src="/assets/connect/network.svg"
    alt=""
    aria-hidden
    width={16}
    height={16}
  />
);

const Strip = styled.div`
  display: inline-flex;
  flex-direction: column;
  gap: 10px;
  width: fit-content;
  max-width: 100%;
  justify-self: start;
  padding: 14px 16px;
  margin-bottom: 24px;
  border-radius: 12px;
  background: linear-gradient(135deg, #f7f9f8 0%, #eef5f9 100%);
  border: 1px solid #d3dae0;

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-height: 32px;
  }

  h2 {
    margin: 0;
    font-family: "Lato", sans-serif;
    font-size: 16px;
    font-weight: 600;
    color: #171717;
  }

  .rows {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: max-content;
    max-width: 100%;
  }
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding: 8px 12px;
  border-radius: 10px;
  background: #ffffff;
  border: 1px solid #d3dae0;
  box-sizing: border-box;

  .action {
    flex: none;
  }

  .content {
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 0;
    gap: 12px;
    justify-content: ${({ $contentCount }) =>
      $contentCount <= 1 ? "flex-end" : "space-between"};
  }

  .title {
    font-family: "Lato", sans-serif;
    font-weight: 600;
    font-size: 14px;
    line-height: 20px;
    color: #171717;
    max-width: 280px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .status {
    flex: none;
  }

  @media (max-width: 640px) {
    flex-wrap: wrap;

    .content {
      flex: 1 1 100%;
      order: -1;
    }

    .title {
      max-width: none;
    }
  }
`;

const ModalBody = styled.div`
  display: grid;
  gap: 16px;

  .description {
    margin: 0;
    color: #5f6871;
    font-family: "Inter", sans-serif;
    font-size: 14px;
    line-height: 22px;
  }

  .networkList {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 10px;
  }

  .networkRow {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 14px;
    border: 1px solid #d3dae0;
    border-radius: 10px;
    background: #ffffff;
  }

  .networkMeta {
    display: grid;
    gap: 4px;
    min-width: 0;
  }

  .networkTitle {
    margin: 0;
    color: #171717;
    font-family: "Lato", sans-serif;
    font-size: 15px;
    font-weight: 600;
  }

  .networkDescription {
    margin: 0;
    color: #5f6871;
    font-family: "Inter", sans-serif;
    font-size: 13px;
    line-height: 18px;
  }

  .empty,
  .feedback {
    margin: 0;
    color: #5f6871;
    font-family: "Inter", sans-serif;
    font-size: 14px;
    line-height: 22px;
  }

  .feedback.error {
    color: #b42318;
  }
`;

function getClassNetworkType(network) {
  return network?.settings?.type === SCHOOL_NETWORK
    ? SCHOOL_NETWORK
    : FEEDBACK_NETWORK;
}

function getFirstUniqueOrganization(...groups) {
  const seen = new Set();
  for (const group of groups) {
    for (const org of group || []) {
      if (!org?.id || seen.has(org.id)) continue;
      seen.add(org.id);
      return org;
    }
  }
  return null;
}

function SetupRow({
  done,
  needsLabel,
  readyLabel,
  title,
  onAction,
  actionLabel,
  actionVariant,
  statusLeading = null,
  titleChip = null,
  hideStatus = false,
}) {
  const showTitle = !!(titleChip || title);
  const showStatus = !hideStatus;
  const contentCount = (showTitle ? 1 : 0) + (showStatus ? 1 : 0);

  return (
    <Row $contentCount={contentCount}>
      <div className="action">
        <Button variant={actionVariant} onClick={onAction}>
          {actionLabel}
        </Button>
      </div>
      <div className="content">
        {titleChip ? (
          <div className="titleChip">{titleChip}</div>
        ) : title ? (
          <span className="title">{title}</span>
        ) : null}
        {showStatus && (
          <div className="status">
            <Chip
              label={done ? readyLabel : needsLabel}
              selected={done}
              leading={done ? statusLeading : null}
            />
          </div>
        )}
      </div>
    </Row>
  );
}

export default function SponsorOnboarding() {
  const { t } = useTranslation("home");
  const router = useRouter();
  const apolloClient = useApolloClient();
  const { data, loading, refetch } = useQuery(SPONSOR_ONBOARDING_STATE, {
    fetchPolicy: "cache-and-network",
  });
  const [dismissed, setDismissed] = useState(false);
  const [networkModalOpen, setNetworkModalOpen] = useState(false);
  const [joiningNetworkId, setJoiningNetworkId] = useState(null);
  const [joinFeedback, setJoinFeedback] = useState(null);

  const me = data?.authenticatedItem;

  const {
    data: publicNetworksData,
    loading: publicNetworksLoading,
    error: publicNetworksError,
  } = useQuery(GET_PUBLIC_CLASS_NETWORKS, {
    skip: !networkModalOpen,
  });

  useEffect(() => {
    if (!me?.id) return;
    setDismissed(isSponsorOnboardingDismissed(me.id));
  }, [me?.id]);

  if (loading && !data) return null;

  const permissionNames = (me?.permissions || []).map((p) => p?.name);
  const isSponsor = permissionNames.includes("SPONSOR");
  if (!isSponsor) return null;
  if (dismissed) return null;

  const orgRecord = getFirstUniqueOrganization(
    me?.organizations,
    me?.adminOfOrganizations,
    me?.organizationsCreated,
  );
  const orgPathComplete =
    me?.profileType === "organization" &&
    !!(orgRecord?.name || me?.organization || "").trim();
  const individualPathComplete =
    me?.profileType === "individual" &&
    !!(me?.firstName || "").trim() &&
    !!(me?.lastName || "").trim();
  const profileStepDone = orgPathComplete || individualPathComplete;
  const orgStepDone = !!orgRecord;
  const memberNetworks = collectMemberClassNetworks(me);
  const joinedNetwork = memberNetworks[0] || null;
  const networkStepDone = !!joinedNetwork;
  const oppStepDone = (me?.opportunitiesCreated || []).length > 0;

  const feedbackPublicNetworks = (publicNetworksData?.classNetworks || []).filter(
    (network) => getClassNetworkType(network) === FEEDBACK_NETWORK,
  );
  const joinedNetworkIds = new Set(memberNetworks.map((n) => n.id));
  const availableFeedbackNetworks = feedbackPublicNetworks.filter(
    (network) => !joinedNetworkIds.has(network?.id),
  );

  const needsLabel = t("sponsorOnboarding.status.needsSetup", {}, {
    default: "Needed",
  });
  const readyLabel = t("sponsorOnboarding.status.ready", {}, {
    default: "Done",
  });
  const manageLabel = t("sponsorOnboarding.manage", {}, { default: "Manage" });

  const profileTitle = profileStepDone
    ? [me?.firstName, me?.lastName].filter(Boolean).join(" ") ||
      t("sponsorOnboarding.profile.readyTitle", {}, { default: "Your profile" })
    : t("sponsorOnboarding.profile.setupTitle", {}, {
        default: "Introduce yourself to students",
      });

  const orgTitle = orgStepDone
    ? orgRecord.name
    : t("sponsorOnboarding.organization.setupTitle", {}, {
        default: "Connect your sponsor organization",
      });

  const networkTitle = t("sponsorOnboarding.network.setupTitle", {}, {
    default: "Choose where opportunities are shared",
  });

  const oppTitle = oppStepDone
    ? t("sponsorOnboarding.opportunity.readyTitle", {}, {
        default: "Your opportunities",
      })
    : t("sponsorOnboarding.opportunity.setupTitle", {}, {
        default: "Describe a student project",
      });

  const handleDismiss = () => {
    if (!profileStepDone || !me?.id) return;
    setSponsorOnboardingDismissed(me.id, true);
    setDismissed(true);
  };

  const openNetworkModal = () => {
    setJoinFeedback(null);
    setNetworkModalOpen(true);
  };

  const closeNetworkModal = () => {
    setNetworkModalOpen(false);
    setJoinFeedback(null);
    setJoiningNetworkId(null);
  };

  const handleJoinNetwork = async (networkId) => {
    if (!me?.id || !networkId) return;
    setJoiningNetworkId(networkId);
    setJoinFeedback(null);
    try {
      await joinClassNetwork({
        apolloClient,
        userId: me.id,
        classNetworkId: networkId,
        user: me,
      });
      await refetch();
      setJoinFeedback({
        kind: "ok",
        text: t("sponsorOnboarding.network.joinSuccess", {}, {
          default: "You've joined the network.",
        }),
      });
      setNetworkModalOpen(false);
    } catch (err) {
      setJoinFeedback({
        kind: "error",
        text:
          err?.message ||
          t("sponsorOnboarding.network.joinError", {}, {
            default: "Failed to join this network.",
          }),
      });
    } finally {
      setJoiningNetworkId(null);
    }
  };

  const profileEditHref = {
    pathname: "/dashboard/profile/edit",
    query: { page: "about", type: "organization" },
  };

  return (
    <>
      <Strip>
        <div className="header">
          <h2>
            {t("sponsorOnboarding.title", {}, { default: "Sponsor setup" })}
          </h2>
          {profileStepDone && (
            <Button
              variant="text"
              onClick={handleDismiss}
              style={{ height: 32, paddingLeft: 12, paddingRight: 12 }}
            >
              {t("sponsorOnboarding.dismiss", {}, { default: "Dismiss" })}
            </Button>
          )}
        </div>

        <div className="rows">
          <SetupRow
            done={profileStepDone}
            needsLabel={needsLabel}
            readyLabel={readyLabel}
            title={profileTitle}
            actionVariant={profileStepDone ? "outline" : "filled"}
            actionLabel={
              profileStepDone
                ? manageLabel
                : t("sponsorOnboarding.profile.setupButton", {}, {
                    default: "Set up",
                  })
            }
            onAction={() => router.push(profileEditHref)}
          />

          <SetupRow
            done={networkStepDone}
            needsLabel={needsLabel}
            readyLabel={readyLabel}
            title={networkTitle}
            titleChip={
              networkStepDone ? (
                <Chip
                  label={
                    joinedNetwork.title ||
                    t("sponsorOnboarding.network.untitled", {}, {
                      default: "Untitled network",
                    })
                  }
                  leading={NETWORK_ICON}
                  shape="square"
                />
              ) : null
            }
            hideStatus={networkStepDone}
            actionVariant={networkStepDone ? "outline" : "filled"}
            actionLabel={
              networkStepDone
                ? manageLabel
                : t("sponsorOnboarding.network.setupButton", {}, {
                    default: "Join",
                  })
            }
            onAction={openNetworkModal}
          />

          <SetupRow
            done={orgStepDone}
            needsLabel={needsLabel}
            readyLabel={readyLabel}
            title={orgTitle}
            actionVariant={orgStepDone ? "outline" : "filled"}
            actionLabel={
              orgStepDone
                ? manageLabel
                : t("sponsorOnboarding.organization.setupButton", {}, {
                    default: "Set up",
                  })
            }
            onAction={() => router.push(profileEditHref)}
          />

          <SetupRow
            done={oppStepDone}
            needsLabel={needsLabel}
            readyLabel={readyLabel}
            title={oppTitle}
            actionVariant={oppStepDone ? "outline" : "filled"}
            actionLabel={
              oppStepDone
                ? manageLabel
                : t("sponsorOnboarding.opportunity.setupButton", {}, {
                    default: "Create",
                  })
            }
            onAction={() =>
              router.push(
                oppStepDone
                  ? "/dashboard/connect/opportunities"
                  : {
                      pathname: "/dashboard/connect/opportunities",
                      query: { op: "new" },
                    },
              )
            }
          />
        </div>
      </Strip>

      <Modal open={networkModalOpen} onClose={closeNetworkModal} size="small">
        <Modal.Header>
          {t("sponsorOnboarding.network.modalTitle", {}, {
            default: "Join a network",
          })}
        </Modal.Header>
        <Modal.Content scrolling>
          <Modal.Description>
            <StyledModal>
              <ModalBody>
                <p className="description">
                  {t("sponsorOnboarding.network.modalDescription", {}, {
                    default:
                      "Join a public feedback network so teachers and students in that network can discover your opportunities.",
                  })}
                </p>

                {publicNetworksLoading ? (
                  <p className="empty">
                    {t("sponsorOnboarding.network.loading", {}, {
                      default: "Loading networks...",
                    })}
                  </p>
                ) : publicNetworksError ? (
                  <p className="feedback error" role="alert">
                    {t("sponsorOnboarding.network.loadError", {}, {
                      default: "Unable to load public networks.",
                    })}
                  </p>
                ) : availableFeedbackNetworks.length > 0 ? (
                  <ul className="networkList">
                    {availableFeedbackNetworks.map((network) => (
                      <li key={network.id} className="networkRow">
                        <div className="networkMeta">
                          <p className="networkTitle">
                            {network?.title ||
                              t("sponsorOnboarding.network.untitled", {}, {
                                default: "Untitled network",
                              })}
                          </p>
                          {network?.description ? (
                            <p className="networkDescription">
                              {network.description}
                            </p>
                          ) : null}
                        </div>
                        <Button
                          variant="filled"
                          type="button"
                          disabled={!!joiningNetworkId}
                          onClick={() => handleJoinNetwork(network.id)}
                        >
                          {joiningNetworkId === network.id
                            ? t("sponsorOnboarding.network.joining", {}, {
                                default: "Joining...",
                              })
                            : t("sponsorOnboarding.network.joinButton", {}, {
                                default: "Join",
                              })}
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty">
                    {feedbackPublicNetworks.length > 0
                      ? t("sponsorOnboarding.network.allJoined", {}, {
                          default:
                            "You're already connected to every available feedback network.",
                        })
                      : t("sponsorOnboarding.network.empty", {}, {
                          default:
                            "No public feedback networks are available yet.",
                        })}
                  </p>
                )}

                {joinFeedback ? (
                  <p
                    className={
                      joinFeedback.kind === "error"
                        ? "feedback error"
                        : "feedback"
                    }
                    role={joinFeedback.kind === "error" ? "alert" : undefined}
                  >
                    {joinFeedback.text}
                  </p>
                ) : null}
              </ModalBody>
            </StyledModal>
          </Modal.Description>
        </Modal.Content>
        <Modal.Actions>
          <Button variant="text" onClick={closeNetworkModal}>
            {t("sponsorOnboarding.network.close", {}, { default: "Close" })}
          </Button>
        </Modal.Actions>
      </Modal>
    </>
  );
}
