import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import styled from "styled-components";
import { Modal } from "semantic-ui-react";
import useTranslation from "next-translate/useTranslation";

import DesignSystemButton from "../../../DesignSystem/Button";
import StyledModal from "../../../styles/StyledModal";
import {
  GET_ALL_NETWORKS,
  GET_PUBLIC_CLASS_NETWORKS,
} from "../../../Queries/ClassNetwork";
import {
  ADD_CLASS_NETWORK_ADMIN,
  REMOVE_CLASS_NETWORK_ADMIN,
} from "../../../Mutations/ClassNetwork";
import RoleGuard from "../RoleGuard";
import { deriveRoles } from "../useConnectRole";

const Shell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
  min-height: 100vh;
  padding: 32px clamp(16px, 6vw, 64px);
  padding-top: 0;
  border-radius: 32px 0 0 32px;
  background-color: #f7f9f8;
`;

const Header = styled.div`
  display: grid;
  gap: 8px;

  h1 {
    margin: 0;
    color: #171717;
    font-family: "Lato", sans-serif;
    font-size: clamp(28px, 4vw, 40px);
    font-weight: 600;
  }

  p {
    max-width: 680px;
    margin: 0;
    color: #5f6871;
    font-family: "Inter", sans-serif;
    font-size: 14px;
    line-height: 22px;
  }
`;

const Grid = styled.div`
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
`;

const Card = styled.article`
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  padding: 20px;
  border: 1px solid #ece9e6;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.05);

  h3 {
    margin: 0;
    color: #171717;
    font-family: "Lato", sans-serif;
    font-size: 18px;
    font-weight: 600;
    line-height: 24px;
  }

  p {
    display: -webkit-box;
    margin: 0;
    overflow: hidden;
    color: #5f6871;
    font-family: "Inter", sans-serif;
    font-size: 13px;
    line-height: 20px;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
  }

  .meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: auto;
    padding-top: 8px;
    border-top: 1px solid #eef1f2;
    color: #625b71;
    font-family: "Inter", sans-serif;
    font-size: 12px;
    line-height: 18px;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }
`;

const Empty = styled.div`
  padding: 48px 24px;
  border-radius: 16px;
  background: #ffffff;
  color: #5f6871;
  font-family: "Inter", sans-serif;
  font-size: 14px;
  line-height: 22px;
  text-align: center;
`;

const Status = styled.div`
  padding: 24px;
  border-radius: 16px;
  background: #ffffff;
  color: #5f6871;
  font-family: "Inter", sans-serif;
  font-size: 14px;
  line-height: 22px;
`;

function displayProfileName(profile) {
  return (
    `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim() ||
    profile?.username ||
    profile?.email ||
    ""
  );
}

function formatCount(t, count, singleKey, pluralKey, singleDefault, pluralDefault) {
  return count === 1
    ? t(singleKey, { count }, { default: singleDefault })
    : t(pluralKey, { count }, { default: pluralDefault });
}

function NetworkCard({ network, actions, showVisibility = false }) {
  const { t } = useTranslation("connect");
  const classCount = network?.classes?.length || 0;
  const organizationCount = network?.memberOrganizations?.length || 0;
  const opportunityCount = network?.opportunities?.length || 0;

  return (
    <Card>
      <h3>
        {network?.title ||
          t("classNetworks.untitled", {}, { default: "Untitled network" })}
      </h3>
      {network?.description ? <p>{network.description}</p> : null}
      <div className="meta">
        {showVisibility ? (
          <span>
            {network?.isPublic
              ? t("classNetworks.visibilityPublic", {}, { default: "Public" })
              : t("classNetworks.visibilityPrivate", {}, {
                  default: "Private",
                })}
          </span>
        ) : null}
        <span>
          {formatCount(
            t,
            classCount,
            "classNetworks.classCountSingle",
            "classNetworks.classCountPlural",
            "{{count}} linked class",
            "{{count}} linked classes"
          )}
        </span>
        <span>
          {formatCount(
            t,
            organizationCount,
            "classNetworks.organizationCountSingle",
            "classNetworks.organizationCountPlural",
            "{{count}} organization",
            "{{count}} organizations"
          )}
        </span>
        <span>
          {formatCount(
            t,
            opportunityCount,
            "classNetworks.opportunityCountSingle",
            "classNetworks.opportunityCountPlural",
            "{{count}} opportunity",
            "{{count}} opportunities"
          )}
        </span>
      </div>
      {actions ? <div className="actions">{actions}</div> : null}
    </Card>
  );
}

function PublicNetworks() {
  const { t } = useTranslation("connect");
  const { data, loading, error } = useQuery(GET_PUBLIC_CLASS_NETWORKS);
  const networks = data?.classNetworks || [];

  return (
    <RoleGuard allow={["teacher", "mentor"]}>
      <Shell>
        <Header>
          <h1>
            {t("classNetworks.publicTitle", {}, {
              default: "Explore public networks",
            })}
          </h1>
          <p>
            {t("classNetworks.publicDescription", {}, {
              default:
                "Browse class networks that are open for discovery across MindHive Connect.",
            })}
          </p>
        </Header>

        {loading ? (
          <Status>
            {t("classNetworks.loading", {}, { default: "Loading networks..." })}
          </Status>
        ) : error ? (
          <Status role="alert">
            {t("classNetworks.loadError", {}, {
              default: "Unable to load class networks.",
            })}
          </Status>
        ) : networks.length > 0 ? (
          <Grid>
            {networks.map((network) => (
              <NetworkCard key={network.id} network={network} />
            ))}
          </Grid>
        ) : (
          <Empty>
            {t("classNetworks.publicEmpty", {}, {
              default: "No public class networks are available yet.",
            })}
          </Empty>
        )}
      </Shell>
    </RoleGuard>
  );
}

function ManageNetworks({ user }) {
  const { t } = useTranslation("connect");
  const { isAdmin, adminClassNetworkIds, canManageClassNetwork } =
    deriveRoles(user);
  const [adminNetwork, setAdminNetwork] = useState(null);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminFeedback, setAdminFeedback] = useState(null);
  const queryVariables = useMemo(
    () =>
      isAdmin
        ? {}
        : {
            where: {
              id: { in: adminClassNetworkIds },
            },
          },
    [adminClassNetworkIds, isAdmin]
  );
  const { data, loading, error } = useQuery(GET_ALL_NETWORKS, {
    variables: queryVariables,
    skip: !isAdmin && adminClassNetworkIds.length === 0,
  });
  const networks = data?.classNetworks || [];
  const refetchQueries = [{ query: GET_ALL_NETWORKS, variables: queryVariables }];
  const [addNetworkAdmin, { loading: addingNetworkAdmin }] = useMutation(
    ADD_CLASS_NETWORK_ADMIN,
    { refetchQueries, awaitRefetchQueries: true }
  );
  const [removeNetworkAdmin, { loading: removingNetworkAdmin }] = useMutation(
    REMOVE_CLASS_NETWORK_ADMIN,
    { refetchQueries, awaitRefetchQueries: true }
  );

  useEffect(() => {
    if (!adminNetwork?.id) return;
    const freshNetwork = networks.find((network) => network.id === adminNetwork.id);
    if (freshNetwork && freshNetwork !== adminNetwork) {
      setAdminNetwork(freshNetwork);
    }
  }, [adminNetwork, networks]);

  const adminMutationLoading = addingNetworkAdmin || removingNetworkAdmin;
  const adminNetworkAdmins = adminNetwork?.admins || [];
  const canManageAdminNetwork =
    !!adminNetwork?.id && canManageClassNetwork(adminNetwork.id);

  const handleOpenAdminModal = (network) => {
    setAdminNetwork(network);
    setAdminEmail("");
    setAdminFeedback(null);
  };

  const handleCloseAdminModal = () => {
    setAdminNetwork(null);
    setAdminEmail("");
    setAdminFeedback(null);
  };

  const handleAddNetworkAdmin = async () => {
    const email = adminEmail.trim().toLowerCase();
    if (!adminNetwork?.id || !email) {
      setAdminFeedback({
        kind: "error",
        text: t("classNetworks.adminEmailRequired", {}, {
          default: "Enter an email address first.",
        }),
      });
      return;
    }

    if (
      adminNetworkAdmins.some(
        (admin) => admin?.email?.toLowerCase() === email
      )
    ) {
      setAdminFeedback({
        kind: "error",
        text: t("classNetworks.adminAlreadyAdded", {}, {
          default: "That person is already an admin for this network.",
        }),
      });
      return;
    }

    try {
      const result = await addNetworkAdmin({
        variables: { networkId: adminNetwork.id, email },
      });
      const updatedNetwork = result?.data?.addClassNetworkAdmin;
      if (updatedNetwork) {
        setAdminNetwork((current) => ({ ...current, ...updatedNetwork }));
      }
      setAdminEmail("");
      setAdminFeedback({
        kind: "ok",
        text: t("classNetworks.adminAdded", {}, {
          default: "Class-network admin added.",
        }),
      });
    } catch (err) {
      setAdminFeedback({
        kind: "error",
        text:
          err?.message ||
          t("classNetworks.adminAddError", {}, {
            default: "Failed to add class-network admin.",
          }),
      });
    }
  };

  const handleRemoveNetworkAdmin = async (profileId) => {
    if (!adminNetwork?.id || !profileId) return;
    const confirmed = window.confirm(
      t("classNetworks.adminRemoveConfirm", {}, {
        default:
          "Remove this class-network admin? They will lose network management access.",
      })
    );
    if (!confirmed) return;

    try {
      const result = await removeNetworkAdmin({
        variables: { networkId: adminNetwork.id, profileId },
      });
      const updatedNetwork = result?.data?.removeClassNetworkAdmin;
      if (updatedNetwork) {
        setAdminNetwork((current) => ({ ...current, ...updatedNetwork }));
      }
      setAdminFeedback({
        kind: "ok",
        text: t("classNetworks.adminRemoved", {}, {
          default: "Class-network admin removed.",
        }),
      });
    } catch (err) {
      setAdminFeedback({
        kind: "error",
        text:
          err?.message ||
          t("classNetworks.adminRemoveError", {}, {
            default: "Failed to remove class-network admin.",
          }),
      });
    }
  };

  return (
    <RoleGuard allow={["classNetworkAdmin"]}>
      <Shell>
        <Header>
          <h1>
            {t("classNetworks.manageTitle", {}, {
              default: "Manage networks",
            })}
          </h1>
          <p>
            {t("classNetworks.manageDescription", {}, {
              default:
                "Manage class-network admins for networks you administer.",
            })}
          </p>
        </Header>

        {loading ? (
          <Status>
            {t("classNetworks.loading", {}, { default: "Loading networks..." })}
          </Status>
        ) : error ? (
          <Status role="alert">
            {t("classNetworks.loadError", {}, {
              default: "Unable to load class networks.",
            })}
          </Status>
        ) : networks.length > 0 ? (
          <Grid>
            {networks.map((network) => (
              <NetworkCard
                key={network.id}
                network={network}
                showVisibility
                actions={
                  canManageClassNetwork(network.id) ? (
                    <DesignSystemButton
                      variant="outline"
                      type="button"
                      onClick={() => handleOpenAdminModal(network)}
                      aria-label={t(
                        "classNetworks.manageAdminsAria",
                        { title: network?.title || "" },
                        { default: "Manage admins for {{title}}" }
                      )}
                    >
                      {t("classNetworks.manageAdmins", {}, {
                        default: "Manage admins",
                      })}
                    </DesignSystemButton>
                  ) : null
                }
              />
            ))}
          </Grid>
        ) : (
          <Empty>
            {t("classNetworks.manageEmpty", {}, {
              default: "You do not manage any class networks yet.",
            })}
          </Empty>
        )}
      </Shell>

      <Modal
        open={!!adminNetwork}
        onClose={handleCloseAdminModal}
        size="small"
      >
        <Modal.Header>
          {t("classNetworks.adminsModalTitle", {}, {
            default: "Manage network admins",
          })}
        </Modal.Header>
        <Modal.Content scrolling>
          <Modal.Description>
            <StyledModal>
              <div className="classNetworkDetail">
                <h3 className="classNetworkDetailTitle">
                  {adminNetwork?.title ||
                    t("classNetworks.untitled", {}, {
                      default: "Untitled network",
                    })}
                </h3>
                <div className="classNetworkAdmins">
                  <div className="classNetworkAdminsHeader">
                    <h4>
                      {t("classNetworks.adminsTitle", {}, {
                        default: "Network admins",
                      })}
                    </h4>
                    <p>
                      {t("classNetworks.adminsDescription", {}, {
                        default:
                          "Admins can manage this class network and related Connect workflows.",
                      })}
                    </p>
                  </div>

                  {adminNetworkAdmins.length > 0 ? (
                    <ul className="classNetworkAdminList">
                      {adminNetworkAdmins.map((admin) => (
                        <li key={admin.id} className="classNetworkAdminRow">
                          <div>
                            <strong>{displayProfileName(admin)}</strong>
                            {admin.email ? <span>{admin.email}</span> : null}
                          </div>
                          {canManageAdminNetwork ? (
                            <DesignSystemButton
                              variant="outline"
                              type="button"
                              disabled={adminMutationLoading}
                              onClick={() => handleRemoveNetworkAdmin(admin.id)}
                            >
                              {t("classNetworks.adminRemove", {}, {
                                default: "Remove",
                              })}
                            </DesignSystemButton>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="classNetworkAdminEmpty">
                      {t("classNetworks.adminsEmpty", {}, {
                        default: "No admins have been assigned yet.",
                      })}
                    </p>
                  )}

                  {canManageAdminNetwork ? (
                    <div className="classNetworkAdminForm">
                      <label htmlFor="connectClassNetworkAdminEmail">
                        {t("classNetworks.adminEmailLabel", {}, {
                          default: "Add admin by email",
                        })}
                      </label>
                      <div className="classNetworkAdminFormRow">
                        <input
                          id="connectClassNetworkAdminEmail"
                          type="email"
                          value={adminEmail}
                          placeholder={t(
                            "classNetworks.adminEmailPlaceholder",
                            {},
                            { default: "teacher@example.com" }
                          )}
                          onChange={(event) =>
                            setAdminEmail(event.target.value)
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              handleAddNetworkAdmin();
                            }
                          }}
                        />
                        <DesignSystemButton
                          variant="filled"
                          type="button"
                          disabled={adminMutationLoading}
                          onClick={handleAddNetworkAdmin}
                        >
                          {adminMutationLoading
                            ? t("classNetworks.adminAdding", {}, {
                                default: "Adding...",
                              })
                            : t("classNetworks.adminAdd", {}, {
                                default: "Add admin",
                              })}
                        </DesignSystemButton>
                      </div>
                    </div>
                  ) : null}

                  {adminFeedback ? (
                    <p
                      className={
                        adminFeedback.kind === "error"
                          ? "classNetworkAdminFeedback error"
                          : "classNetworkAdminFeedback"
                      }
                    >
                      {adminFeedback.text}
                    </p>
                  ) : null}
                </div>
              </div>
            </StyledModal>
          </Modal.Description>
        </Modal.Content>
        <Modal.Actions>
          <DesignSystemButton variant="text" onClick={handleCloseAdminModal}>
            {t("classNetworks.close", {}, { default: "Close" })}
          </DesignSystemButton>
        </Modal.Actions>
      </Modal>
    </RoleGuard>
  );
}

export default function ClassNetworksMain({ query, user }) {
  return query?.mode === "manage" ? (
    <ManageNetworks user={user} />
  ) : (
    <PublicNetworks />
  );
}
