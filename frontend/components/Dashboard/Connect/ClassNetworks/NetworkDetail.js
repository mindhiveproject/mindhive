import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import Link from "next/link";
import { useRouter } from "next/router";
import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { AgGridReact } from "ag-grid-react";

import DesignSystemButton from "../../../DesignSystem/Button";
import Chip from "../../../DesignSystem/Chip";
import { GET_ALL_NETWORKS } from "../../../Queries/ClassNetwork";
import {
  ADD_CLASS_NETWORK_ADMIN,
  REMOVE_CLASS_NETWORK_ADMIN,
  UPDATE_CLASS_NETWORK_DETAILS,
} from "../../../Mutations/ClassNetwork";
import RoleGuard from "../RoleGuard";
import { deriveRoles } from "../useConnectRole";
import {
  CopyableEmail,
  buildManageNetworksQueryVariables,
  countProfileOwnedClasses,
  countProfileOwnedOpportunities,
  countUniqueStudents,
  displayProfileName,
  findUserClassInNetwork,
  formatCount,
  roundStatusLabel,
} from "./utils";

const BACK_CHEVRON = (
  <svg
    width="24"
    height="24"
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
    max-width: 720px;
    margin: 0;
    color: #5f6871;
    font-family: "Inter", sans-serif;
    font-size: 14px;
    line-height: 22px;
  }
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

const SummaryChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`;

const DetailSection = styled.section`
  display: grid;
  gap: 16px;
  padding: 24px;
  border: 1px solid #ece9e6;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.05);
  scroll-margin-top: 96px;
`;

const SectionHeader = styled.div`
  display: grid;
  gap: 6px;

  h2 {
    margin: 0;
    color: #171717;
    font-family: "Lato", sans-serif;
    font-size: 20px;
    font-weight: 600;
    line-height: 28px;
  }

  p {
    margin: 0;
    color: #5f6871;
    font-family: "Inter", sans-serif;
    font-size: 14px;
    line-height: 22px;
  }
`;

const GridTable = styled.div`
  width: 100%;
  min-height: 280px;
  height: 420px;
`;

const EmptyNote = styled.p`
  margin: 0;
  color: #5f6871;
  font-family: "Inter", sans-serif;
  font-size: 14px;
  line-height: 22px;
`;

const AdminForm = styled.div`
  display: grid;
  gap: 12px;
  padding-top: 8px;
  border-top: 1px solid #eef1f2;

  label {
    color: #171717;
    font-family: "Inter", sans-serif;
    font-size: 14px;
    font-weight: 700;
    line-height: 22px;
  }
`;

const AdminFormRow = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: minmax(0, 1fr) auto;

  input {
    height: 42px;
    padding: 0 12px;
    border: 1px solid #cccccc;
    border-radius: 4px;
    font-family: "Inter", sans-serif;
    font-size: 14px;

    &:focus {
      outline: 0;
      border-color: #336f8a;
    }
  }
`;

const AdminFeedback = styled.p`
  margin: 0;
  color: ${(props) => (props.$error ? "#871b16" : "#1d6b3a")};
  font-family: "Inter", sans-serif;
  font-size: 13px;
  line-height: 20px;
`;

const DetailsForm = styled.div`
  display: grid;
  gap: 16px;

  label {
    display: grid;
    gap: 8px;
    color: #171717;
    font-family: "Inter", sans-serif;
    font-size: 14px;
    font-weight: 700;
    line-height: 22px;
  }

  input,
  textarea {
    width: 100%;
    padding: 12px;
    border: 1px solid #cccccc;
    border-radius: 4px;
    font-family: "Inter", sans-serif;
    font-size: 14px;
    line-height: 22px;

    &:focus {
      outline: 0;
      border-color: #336f8a;
    }
  }

  textarea {
    min-height: 120px;
    resize: vertical;
  }
`;

const DetailsFormActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
`;

const defaultColDef = {
  resizable: true,
  sortable: true,
  filter: true,
};

function EmailCellRenderer(params) {
  return <CopyableEmail email={params?.value || params?.data?.email} />;
}

function scrollToSection(sectionId) {
  if (!sectionId || typeof document === "undefined") return;
  const el = document.getElementById(sectionId);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function NetworkDetailPage({ query, user }) {
  const { t } = useTranslation("connect");
  const router = useRouter();
  const networkId = query?.networkId;
  const {
    isAdmin,
    adminClassNetworkIds,
    canManageClassNetwork,
    isTeacher,
    isSponsor,
  } = deriveRoles(user);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminFeedback, setAdminFeedback] = useState(null);
  const [networkTitle, setNetworkTitle] = useState("");
  const [networkDescription, setNetworkDescription] = useState("");
  const [detailsFeedback, setDetailsFeedback] = useState(null);

  const queryVariables = useMemo(
    () => buildManageNetworksQueryVariables(isAdmin, adminClassNetworkIds),
    [adminClassNetworkIds, isAdmin]
  );

  const { data, loading, error } = useQuery(GET_ALL_NETWORKS, {
    variables: queryVariables,
    skip: !isAdmin && adminClassNetworkIds.length === 0,
  });

  const networks = data?.classNetworks || [];
  const network = networks.find((item) => item.id === networkId) || null;
  const canManage = !!networkId && canManageClassNetwork(networkId);

  const refetchQueries = [
    { query: GET_ALL_NETWORKS, variables: queryVariables },
  ];
  const [addNetworkAdmin, { loading: addingNetworkAdmin }] = useMutation(
    ADD_CLASS_NETWORK_ADMIN,
    { refetchQueries, awaitRefetchQueries: true }
  );
  const [removeNetworkAdmin, { loading: removingNetworkAdmin }] = useMutation(
    REMOVE_CLASS_NETWORK_ADMIN,
    { refetchQueries, awaitRefetchQueries: true }
  );
  const [updateNetworkDetails, { loading: savingDetails }] = useMutation(
    UPDATE_CLASS_NETWORK_DETAILS,
    { refetchQueries, awaitRefetchQueries: true }
  );

  useEffect(() => {
    if (!network?.id) return;
    setNetworkTitle(network.title || "");
    setNetworkDescription(network.description || "");
  }, [network?.id, network?.title, network?.description]);

  const adminMutationLoading = addingNetworkAdmin || removingNetworkAdmin;
  const networkAdmins = network?.admins || [];
  const memberOrganizations = network?.memberOrganizations || [];
  const memberProfiles = network?.memberProfiles || [];
  const connectRounds = network?.connectRounds || [];
  const userClassInNetwork = findUserClassInNetwork(user, network);
  const canOpenMatchingClass =
    isTeacher && isSponsor && !!userClassInNetwork?.code;

  const organizationRows = useMemo(
    () =>
      memberOrganizations.map((org) => ({
        id: org.id,
        name: org.name || "",
      })),
    [memberOrganizations]
  );

  const profileRows = useMemo(
    () =>
      memberProfiles.map((profile) => ({
        id: profile.id,
        name: displayProfileName(profile),
        email: profile.email || "",
        ownedClasses: countProfileOwnedClasses(network, profile.id),
        ownedOpportunities: countProfileOwnedOpportunities(
          network,
          profile.id
        ),
      })),
    [memberProfiles, network]
  );

  const roundRows = useMemo(
    () =>
      connectRounds.map((round) => ({
        id: round.id,
        title:
          round.title ||
          t("classNetworks.untitledRound", {}, {
            default: "Untitled round",
          }),
        status: round.status || "",
        statusLabel: roundStatusLabel(t, round.status),
        matchCount: round?.matches?.length || 0,
      })),
    [connectRounds, t]
  );

  const adminRows = useMemo(
    () =>
      networkAdmins.map((admin) => ({
        id: admin.id,
        name: displayProfileName(admin),
        email: admin.email || "",
      })),
    [networkAdmins]
  );

  const handleAddNetworkAdmin = async () => {
    const email = adminEmail.trim().toLowerCase();
    if (!network?.id || !email) {
      setAdminFeedback({
        kind: "error",
        text: t("classNetworks.adminEmailRequired", {}, {
          default: "Enter an email address first.",
        }),
      });
      return;
    }

    if (networkAdmins.some((admin) => admin?.email?.toLowerCase() === email)) {
      setAdminFeedback({
        kind: "error",
        text: t("classNetworks.adminAlreadyAdded", {}, {
          default: "That person is already an admin for this network.",
        }),
      });
      return;
    }

    try {
      await addNetworkAdmin({
        variables: { networkId: network.id, email },
      });
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
    if (!network?.id || !profileId) return;
    const confirmed = window.confirm(
      t("classNetworks.adminRemoveConfirm", {}, {
        default:
          "Remove this class-network admin? They will lose network management access.",
      })
    );
    if (!confirmed) return;

    try {
      await removeNetworkAdmin({
        variables: { networkId: network.id, profileId },
      });
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

  const handleSaveNetworkDetails = async () => {
    const title = networkTitle.trim();
    if (!network?.id || !title) {
      setDetailsFeedback({
        kind: "error",
        text: t("classNetworks.titleRequired", {}, {
          default: "Enter a network title.",
        }),
      });
      return;
    }

    try {
      await updateNetworkDetails({
        variables: {
          id: network.id,
          title,
          description: networkDescription.trim() || "",
        },
      });
      setDetailsFeedback({
        kind: "ok",
        text: t("classNetworks.detailsSaved", {}, {
          default: "Network details saved.",
        }),
      });
    } catch (err) {
      setDetailsFeedback({
        kind: "error",
        text:
          err?.message ||
          t("classNetworks.detailsSaveError", {}, {
            default: "Failed to save network details.",
          }),
      });
    }
  };

  const organizationColumnDefs = useMemo(
    () => [
      {
        field: "name",
        headerName: t("classNetworks.grid.name", {}, { default: "Name" }),
        flex: 1,
        minWidth: 200,
        filter: "agTextColumnFilter",
      },
    ],
    [t]
  );

  const profileColumnDefs = useMemo(
    () => [
      {
        field: "name",
        headerName: t("classNetworks.grid.name", {}, { default: "Name" }),
        flex: 1.2,
        minWidth: 180,
        filter: "agTextColumnFilter",
      },
      {
        field: "email",
        headerName: t("classNetworks.grid.email", {}, { default: "Email" }),
        flex: 1.2,
        minWidth: 200,
        filter: "agTextColumnFilter",
        cellRenderer: EmailCellRenderer,
      },
      {
        field: "ownedClasses",
        headerName: t("classNetworks.grid.ownedClasses", {}, {
          default: "Classes in network",
        }),
        flex: 0.8,
        minWidth: 140,
        filter: "agNumberColumnFilter",
      },
      {
        field: "ownedOpportunities",
        headerName: t("classNetworks.grid.ownedOpportunities", {}, {
          default: "Opportunities in network",
        }),
        flex: 0.9,
        minWidth: 160,
        filter: "agNumberColumnFilter",
      },
    ],
    [t]
  );

  const RoundActionsRenderer = useMemo(() => {
    function Renderer() {
      if (!canOpenMatchingClass) return null;
      return (
        <Link href={`/dashboard/myclasses/${userClassInNetwork.code}`}>
          <DesignSystemButton variant="outline" type="button">
            {t("classNetworks.openClass", {}, { default: "Open class" })}
          </DesignSystemButton>
        </Link>
      );
    }
    return Renderer;
  }, [canOpenMatchingClass, t, userClassInNetwork?.code]);

  const roundColumnDefs = useMemo(
    () => [
      {
        field: "title",
        headerName: t("classNetworks.grid.roundTitle", {}, {
          default: "Round",
        }),
        flex: 1.2,
        minWidth: 180,
        filter: "agTextColumnFilter",
      },
      {
        field: "statusLabel",
        headerName: t("classNetworks.grid.status", {}, { default: "Status" }),
        flex: 0.8,
        minWidth: 140,
        filter: "agTextColumnFilter",
      },
      {
        field: "matchCount",
        headerName: t("classNetworks.grid.matchCount", {}, {
          default: "Matches",
        }),
        flex: 0.6,
        minWidth: 110,
        filter: "agNumberColumnFilter",
      },
      {
        field: "actions",
        headerName: t("classNetworks.grid.actions", {}, { default: "Actions" }),
        cellRenderer: RoundActionsRenderer,
        sortable: false,
        filter: false,
        width: 150,
        pinned: "right",
        cellStyle: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
      },
    ],
    [RoundActionsRenderer, t]
  );

  const AdminActionsRenderer = useMemo(() => {
    function Renderer(params) {
      if (!canManage || !params?.data?.id) return null;
      return (
        <DesignSystemButton
          variant="outline"
          type="button"
          disabled={adminMutationLoading}
          onClick={() => handleRemoveNetworkAdmin(params.data.id)}
        >
          {t("classNetworks.adminRemove", {}, { default: "Remove" })}
        </DesignSystemButton>
      );
    }
    return Renderer;
  }, [adminMutationLoading, canManage, network?.id, t]);

  const adminColumnDefs = useMemo(
    () => [
      {
        field: "name",
        headerName: t("classNetworks.grid.name", {}, { default: "Name" }),
        flex: 1.2,
        minWidth: 180,
        filter: "agTextColumnFilter",
      },
      {
        field: "email",
        headerName: t("classNetworks.grid.email", {}, { default: "Email" }),
        flex: 1.2,
        minWidth: 200,
        filter: "agTextColumnFilter",
        cellRenderer: EmailCellRenderer,
      },
      {
        field: "actions",
        headerName: t("classNetworks.grid.actions", {}, { default: "Actions" }),
        cellRenderer: AdminActionsRenderer,
        sortable: false,
        filter: false,
        width: 140,
        pinned: "right",
        cellStyle: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
      },
    ],
    [AdminActionsRenderer, t]
  );

  const backHref = {
    pathname: "/dashboard/connect/networks",
    query: { mode: "manage" },
  };
  const backLabel = t("classNetworks.backToManage", {}, {
    default: "Back to manage networks",
  });

  return (
    <RoleGuard allow={["classNetworkAdmin"]}>
      <Shell>
        <DesignSystemButton
          variant="outline"
          type="button"
          leadingIcon={BACK_CHEVRON}
          onClick={() => router.push(backHref)}
          aria-label={backLabel}
        >
          {backLabel}
        </DesignSystemButton>

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
        ) : !network || !canManage ? (
          <Status role="alert">
            {t("classNetworks.detailNotFound", {}, {
              default:
                "This network was not found, or you do not have access to manage it.",
            })}
          </Status>
        ) : (
          <>
            <Header>
              <h1>
                {network.title ||
                  t("classNetworks.untitled", {}, {
                    default: "Untitled network",
                  })}
              </h1>
              <p>
                {t("classNetworks.detailPageHint", {}, {
                  default:
                    "Review membership, matching rounds, and admins for this class network.",
                })}
              </p>
            </Header>

            {canManage ? (
              <DetailSection id="network-details">
                <SectionHeader>
                  <h2>
                    {t("classNetworks.detailsSectionTitle", {}, {
                      default: "Network details",
                    })}
                  </h2>
                  <p>
                    {t("classNetworks.detailsSectionDescription", {}, {
                      default: "Update the title and description shown for this network.",
                    })}
                  </p>
                </SectionHeader>
                <DetailsForm>
                  <label htmlFor="connectClassNetworkTitle">
                    {t("classNetworks.titleLabel", {}, {
                      default: "Title",
                    })}
                    <input
                      id="connectClassNetworkTitle"
                      type="text"
                      value={networkTitle}
                      onChange={(event) => setNetworkTitle(event.target.value)}
                      placeholder={t(
                        "classNetworks.titlePlaceholder",
                        {},
                        { default: "Network title" }
                      )}
                    />
                  </label>
                  <label htmlFor="connectClassNetworkDescription">
                    {t("classNetworks.descriptionLabel", {}, {
                      default: "Description",
                    })}
                    <textarea
                      id="connectClassNetworkDescription"
                      value={networkDescription}
                      onChange={(event) =>
                        setNetworkDescription(event.target.value)
                      }
                      placeholder={t(
                        "classNetworks.descriptionPlaceholder",
                        {},
                        {
                          default:
                            "Describe what this network is for and who it connects.",
                        }
                      )}
                    />
                  </label>
                  <DetailsFormActions>
                    <DesignSystemButton
                      variant="filled"
                      type="button"
                      disabled={savingDetails}
                      onClick={handleSaveNetworkDetails}
                    >
                      {savingDetails
                        ? t("classNetworks.savingDetails", {}, {
                            default: "Saving...",
                          })
                        : t("classNetworks.saveDetails", {}, {
                            default: "Save details",
                          })}
                    </DesignSystemButton>
                    {detailsFeedback ? (
                      <AdminFeedback $error={detailsFeedback.kind === "error"}>
                        {detailsFeedback.text}
                      </AdminFeedback>
                    ) : null}
                  </DetailsFormActions>
                </DetailsForm>
              </DetailSection>
            ) : null}

            <DetailSection id="network-overview">
              <SectionHeader>
                <h2>
                  {t("classNetworks.summaryTitle", {}, {
                    default: "Summary",
                  })}
                </h2>
                <p>
                  {t("classNetworks.summaryDescription", {}, {
                    default:
                      "Key counts for this network. Click organizations, profiles, matching rounds, or admins to jump to that section.",
                  })}
                </p>
              </SectionHeader>
              <SummaryChips>
                <Chip
                  shape="square"
                  leading={
                    <img
                      src="/assets/icons/education.svg"
                      alt=""
                      width="20"
                      height="20"
                      aria-hidden
                    />
                  }
                  label={formatCount(
                    t,
                    network?.classes?.length || 0,
                    "classNetworks.classCountSingle",
                    "classNetworks.classCountPlural",
                    "{{count}} linked class",
                    "{{count}} linked classes"
                  )}
                />
                <Chip
                  shape="square"
                  leading={
                    <img
                      src="/assets/connect/building.svg"
                      alt=""
                      width="20"
                      height="20"
                      aria-hidden
                    />
                  }
                  label={formatCount(
                    t,
                    memberOrganizations.length,
                    "classNetworks.organizationCountSingle",
                    "classNetworks.organizationCountPlural",
                    "{{count}} organization",
                    "{{count}} organizations"
                  )}
                  ariaLabel={t(
                    "classNetworks.summaryChipAria",
                    {
                      label: t("classNetworks.organizationsTitle", {}, {
                        default: "Organizations",
                      }),
                    },
                    { default: "Jump to {{label}}" }
                  )}
                  onClick={() => scrollToSection("network-organizations")}
                />
                <Chip
                  shape="square"
                  leading={
                    <img
                      src="/assets/connect/user.svg"
                      alt=""
                      width="20"
                      height="20"
                      aria-hidden
                    />
                  }
                  label={formatCount(
                    t,
                    memberProfiles.length,
                    "classNetworks.profileCountSingle",
                    "classNetworks.profileCountPlural",
                    "{{count}} member profile",
                    "{{count}} member profiles"
                  )}
                  ariaLabel={t(
                    "classNetworks.summaryChipAria",
                    {
                      label: t("classNetworks.profilesTitle", {}, {
                        default: "Member profiles",
                      }),
                    },
                    { default: "Jump to {{label}}" }
                  )}
                  onClick={() => scrollToSection("network-profiles")}
                />
                <Chip
                  shape="square"
                  leading={
                    <img
                      src="/assets/connect/group.svg"
                      alt=""
                      width="20"
                      height="20"
                      aria-hidden
                    />
                  }
                  label={formatCount(
                    t,
                    countUniqueStudents(network),
                    "classNetworks.studentCountSingle",
                    "classNetworks.studentCountPlural",
                    "{{count}} student in linked classes",
                    "{{count}} students in linked classes"
                  )}
                />
                <Chip
                  shape="square"
                  leading={
                    <img
                      src="/assets/icons/project/proposal.svg"
                      alt=""
                      width="20"
                      height="20"
                      aria-hidden
                    />
                  }
                  label={formatCount(
                    t,
                    network?.opportunities?.length || 0,
                    "classNetworks.opportunityCountSingle",
                    "classNetworks.opportunityCountPlural",
                    "{{count}} opportunity",
                    "{{count}} opportunities"
                  )}
                />
                <Chip
                  shape="square"
                  leading={
                    <img
                      src="/assets/icons/profile/documents.svg"
                      alt=""
                      width="20"
                      height="20"
                      aria-hidden
                    />
                  }
                  label={formatCount(
                    t,
                    connectRounds.length,
                    "classNetworks.roundCountSingle",
                    "classNetworks.roundCountPlural",
                    "{{count}} matching round",
                    "{{count}} matching rounds"
                  )}
                  ariaLabel={t(
                    "classNetworks.summaryChipAria",
                    {
                      label: t("classNetworks.roundsTitle", {}, {
                        default: "Matching rounds",
                      }),
                    },
                    { default: "Jump to {{label}}" }
                  )}
                  onClick={() => scrollToSection("network-rounds")}
                />
                <Chip
                  shape="square"
                  leading={
                    <img
                      src="/assets/icons/profile/consent.svg"
                      alt=""
                      width="20"
                      height="20"
                      aria-hidden
                    />
                  }
                  label={formatCount(
                    t,
                    networkAdmins.length,
                    "classNetworks.adminCountSingle",
                    "classNetworks.adminCountPlural",
                    "{{count}} admin",
                    "{{count}} admins"
                  )}
                  ariaLabel={t(
                    "classNetworks.summaryChipAria",
                    {
                      label: t("classNetworks.adminsTitle", {}, {
                        default: "Network admins",
                      }),
                    },
                    { default: "Jump to {{label}}" }
                  )}
                  onClick={() => scrollToSection("network-admins")}
                />
              </SummaryChips>
            </DetailSection>

            <DetailSection id="network-organizations">
              <SectionHeader>
                <h2>
                  {t("classNetworks.organizationsTitle", {}, {
                    default: "Organizations",
                  })}
                </h2>
                <p>
                  {t("classNetworks.organizationsDescription", {}, {
                    default:
                      "Organizations explicitly connected to this network.",
                  })}
                </p>
              </SectionHeader>
              {organizationRows.length === 0 ? (
                <EmptyNote>
                  {t("classNetworks.organizationsEmpty", {}, {
                    default: "No organizations are connected yet.",
                  })}
                </EmptyNote>
              ) : null}
              <GridTable className="ag-theme-quartz">
                <AgGridReact
                  rowData={organizationRows}
                  columnDefs={organizationColumnDefs}
                  defaultColDef={defaultColDef}
                  getRowId={(params) => params.data?.id}
                  pagination
                  paginationPageSize={20}
                  overlayNoRowsTemplate={t(
                    "classNetworks.organizationsEmpty",
                    {},
                    { default: "No organizations are connected yet." }
                  )}
                />
              </GridTable>
            </DetailSection>

            <DetailSection id="network-profiles">
              <SectionHeader>
                <h2>
                  {t("classNetworks.profilesTitle", {}, {
                    default: "Member profiles",
                  })}
                </h2>
                <p>
                  {t("classNetworks.profilesDescription", {}, {
                    default:
                      "Profiles explicitly connected to this network.",
                  })}
                </p>
              </SectionHeader>
              {profileRows.length === 0 ? (
                <EmptyNote>
                  {t("classNetworks.profilesEmpty", {}, {
                    default: "No member profiles are connected yet.",
                  })}
                </EmptyNote>
              ) : null}
              <GridTable className="ag-theme-quartz">
                <AgGridReact
                  rowData={profileRows}
                  columnDefs={profileColumnDefs}
                  defaultColDef={defaultColDef}
                  getRowId={(params) => params.data?.id}
                  pagination
                  paginationPageSize={20}
                  overlayNoRowsTemplate={t(
                    "classNetworks.profilesEmpty",
                    {},
                    { default: "No member profiles are connected yet." }
                  )}
                />
              </GridTable>
            </DetailSection>

            <DetailSection id="network-rounds">
              <SectionHeader>
                <h2>
                  {t("classNetworks.roundsTitle", {}, {
                    default: "Matching rounds",
                  })}
                </h2>
                <p>
                  {t("classNetworks.roundsDescription", {}, {
                    default:
                      "Matching rounds for this network. Match counts only — no student details.",
                  })}
                </p>
              </SectionHeader>
              {roundRows.length === 0 ? (
                <EmptyNote>
                  {t("classNetworks.roundsEmpty", {}, {
                    default: "No matching rounds for this network yet.",
                  })}
                </EmptyNote>
              ) : null}
              <GridTable className="ag-theme-quartz">
                <AgGridReact
                  rowData={roundRows}
                  columnDefs={roundColumnDefs}
                  defaultColDef={defaultColDef}
                  getRowId={(params) => params.data?.id}
                  pagination
                  paginationPageSize={20}
                  overlayNoRowsTemplate={t(
                    "classNetworks.roundsEmpty",
                    {},
                    { default: "No matching rounds for this network yet." }
                  )}
                />
              </GridTable>
            </DetailSection>

            <DetailSection id="network-admins">
              <SectionHeader>
                <h2>
                  {t("classNetworks.adminsTitle", {}, {
                    default: "Network admins",
                  })}
                </h2>
                <p>
                  {t("classNetworks.adminsDescription", {}, {
                    default:
                      "Admins can manage this class network and related Connect workflows.",
                  })}
                </p>
              </SectionHeader>
              {adminRows.length === 0 ? (
                <EmptyNote>
                  {t("classNetworks.adminsEmpty", {}, {
                    default: "No admins have been assigned yet.",
                  })}
                </EmptyNote>
              ) : null}
              <GridTable className="ag-theme-quartz">
                <AgGridReact
                  rowData={adminRows}
                  columnDefs={adminColumnDefs}
                  defaultColDef={defaultColDef}
                  getRowId={(params) => params.data?.id}
                  pagination
                  paginationPageSize={20}
                  overlayNoRowsTemplate={t(
                    "classNetworks.adminsEmpty",
                    {},
                    { default: "No admins have been assigned yet." }
                  )}
                />
              </GridTable>

              {canManage ? (
                <AdminForm>
                  <label htmlFor="connectClassNetworkAdminEmail">
                    {t("classNetworks.adminEmailLabel", {}, {
                      default: "Add admin by email",
                    })}
                  </label>
                  <AdminFormRow>
                    <input
                      id="connectClassNetworkAdminEmail"
                      type="email"
                      value={adminEmail}
                      placeholder={t(
                        "classNetworks.adminEmailPlaceholder",
                        {},
                        { default: "teacher@example.com" }
                      )}
                      onChange={(event) => setAdminEmail(event.target.value)}
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
                  </AdminFormRow>
                  {adminFeedback ? (
                    <AdminFeedback $error={adminFeedback.kind === "error"}>
                      {adminFeedback.text}
                    </AdminFeedback>
                  ) : null}
                </AdminForm>
              ) : null}
            </DetailSection>
          </>
        )}
      </Shell>
    </RoleGuard>
  );
}

export default NetworkDetailPage;
