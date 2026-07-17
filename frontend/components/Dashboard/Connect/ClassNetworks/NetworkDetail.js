import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import Link from "next/link";
import { useRouter } from "next/router";
import moment from "moment";
import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { AgGridReact } from "ag-grid-react";

import DesignSystemButton from "../../../DesignSystem/Button";
import Chip from "../../../DesignSystem/Chip";
import CopyButton from "../../../DesignSystem/CopyButton";
import {
  GET_ALL_NETWORKS,
  GET_NETWORK_INVITES,
} from "../../../Queries/ClassNetwork";
import { CURRENT_USER_QUERY } from "../../../Queries/User";
import {
  ADD_CLASS_NETWORK_ADMIN,
  ADD_CLASS_NETWORK_MEMBER_PROFILE,
  APPROVE_NETWORK_INVITE,
  CANCEL_NETWORK_INVITE,
  INVITE_PROFILE_TO_CLASS_NETWORK,
  REJECT_NETWORK_INVITE,
  REMOVE_CLASS_NETWORK_ADMIN,
  REMOVE_CLASS_NETWORK_MEMBER_ORGANIZATION,
  REMOVE_CLASS_NETWORK_MEMBER_PROFILE,
  UPDATE_CLASS_NETWORK_DETAILS,
} from "../../../Mutations/ClassNetwork";
import RoleGuard from "../RoleGuard";
import { deriveRoles } from "../useConnectRole";
import {
  CopyableEmail,
  buildManageNetworksQueryVariables,
  buildNetworkInviteManualLink,
  buildPendingNetworkInvitesWhere,
  countProfileOwnedClasses,
  countProfileOwnedOpportunities,
  countUniqueStudents,
  displayProfileName,
  findUserClassInNetwork,
  formatCount,
  getEffectiveMembershipMode,
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
  height: 460px;
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
  padding-bottom: 8px;
  border-bottom: 1px solid #eef1f2;

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

const InviteLinkRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
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
  select,
  textarea {
    width: 100%;
    padding: 12px;
    border: 1px solid #cccccc;
    border-radius: 4px;
    font-family: "Inter", sans-serif;
    font-size: 14px;
    line-height: 22px;
    background: #ffffff;

    &:focus {
      outline: 0;
      border-color: #336f8a;
    }
  }

  select {
    height: 46px;
    padding-top: 0;
    padding-bottom: 0;
  }

  textarea {
    min-height: 120px;
    resize: vertical;
  }

  .fieldHint {
    margin: 0;
    color: #5f6871;
    font-weight: 400;
    font-size: 13px;
    line-height: 20px;
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
  floatingFilter: false,
  filterParams: {
    maxNumConditions: 1,
  },
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
  const [memberEmail, setMemberEmail] = useState("");
  const [memberFeedback, setMemberFeedback] = useState(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteFeedback, setInviteFeedback] = useState(null);
  const [networkTitle, setNetworkTitle] = useState("");
  const [networkDescription, setNetworkDescription] = useState("");
  const [membershipMode, setMembershipMode] = useState("approval");
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
  const pendingInvitesWhere = useMemo(
    () => buildPendingNetworkInvitesWhere(networkId),
    [networkId]
  );

  const { data: pendingInvitesData, refetch: refetchPendingInvites } = useQuery(
    GET_NETWORK_INVITES,
    {
      variables: { where: pendingInvitesWhere },
      skip: !canManage || !pendingInvitesWhere,
      fetchPolicy: "cache-and-network",
    }
  );

  const refetchQueries = [
    { query: GET_ALL_NETWORKS, variables: queryVariables },
  ];
  const inviteRefetchQueries = pendingInvitesWhere
    ? [
        ...refetchQueries,
        {
          query: GET_NETWORK_INVITES,
          variables: { where: pendingInvitesWhere },
        },
      ]
    : refetchQueries;
  const membershipRefetchQueries = [
    ...inviteRefetchQueries,
    { query: CURRENT_USER_QUERY },
  ];

  const [addNetworkAdmin, { loading: addingNetworkAdmin }] = useMutation(
    ADD_CLASS_NETWORK_ADMIN,
    { refetchQueries, awaitRefetchQueries: true }
  );
  const [addMemberProfile, { loading: addingMemberProfile }] = useMutation(
    ADD_CLASS_NETWORK_MEMBER_PROFILE,
    { refetchQueries, awaitRefetchQueries: true }
  );
  const [inviteMemberProfile, { loading: invitingMemberProfile }] = useMutation(
    INVITE_PROFILE_TO_CLASS_NETWORK,
    { refetchQueries: membershipRefetchQueries, awaitRefetchQueries: true }
  );
  const [approveInvite, { loading: approvingInvite }] = useMutation(
    APPROVE_NETWORK_INVITE,
    { refetchQueries: membershipRefetchQueries, awaitRefetchQueries: true }
  );
  const [rejectInvite, { loading: rejectingInvite }] = useMutation(
    REJECT_NETWORK_INVITE,
    { refetchQueries: inviteRefetchQueries, awaitRefetchQueries: true }
  );
  const [cancelOutboundInvite, { loading: cancellingOutboundInvite }] =
    useMutation(CANCEL_NETWORK_INVITE, {
      refetchQueries: inviteRefetchQueries,
      awaitRefetchQueries: true,
    });
  const [removeNetworkAdmin, { loading: removingNetworkAdmin }] = useMutation(
    REMOVE_CLASS_NETWORK_ADMIN,
    { refetchQueries, awaitRefetchQueries: true }
  );
  const [removeMemberProfile, { loading: removingMemberProfile }] = useMutation(
    REMOVE_CLASS_NETWORK_MEMBER_PROFILE,
    { refetchQueries, awaitRefetchQueries: true }
  );
  const [removeMemberOrganization, { loading: removingMemberOrganization }] =
    useMutation(REMOVE_CLASS_NETWORK_MEMBER_ORGANIZATION, {
      refetchQueries,
      awaitRefetchQueries: true,
    });
  const [updateNetworkDetails, { loading: savingDetails }] = useMutation(
    UPDATE_CLASS_NETWORK_DETAILS,
    { refetchQueries, awaitRefetchQueries: true }
  );

  useEffect(() => {
    if (!network?.id) return;
    setNetworkTitle(network.title || "");
    setNetworkDescription(network.description || "");
    setMembershipMode(getEffectiveMembershipMode(network.settings));
  }, [network?.id, network?.title, network?.description, network?.settings]);

  const adminMutationLoading = addingNetworkAdmin || removingNetworkAdmin;
  const memberMutationLoading =
    addingMemberProfile ||
    invitingMemberProfile ||
    removingMemberProfile ||
    removingMemberOrganization;
  const inviteReviewLoading =
    approvingInvite || rejectingInvite || cancellingOutboundInvite;
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

  const pendingInviteRows = useMemo(
    () =>
      (pendingInvitesData?.networkInvites || []).map((invite) => {
        const person =
          displayProfileName(invite.profile) ||
          displayProfileName(invite.requestedBy) ||
          invite.email ||
          "";
        return {
          id: invite.id,
          person,
          email: invite.profile?.email || invite.email || "",
          direction: invite.direction || "",
          directionLabel:
            invite.direction === "invite"
              ? t("classNetworks.invites.directionInvite", {}, {
                  default: "Invitation",
                })
              : t("classNetworks.invites.directionRequest", {}, {
                  default: "Request",
                }),
          createdAt: invite.createdAt || null,
          manualLink:
            invite.direction === "invite" && invite.token && !invite.profile?.id
              ? buildNetworkInviteManualLink(invite.token)
              : "",
        };
      }),
    [pendingInvitesData?.networkInvites, t]
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

  const sponsorSignupAndInviteLink = network?.id
    ? `${
        typeof window !== "undefined" ? window.location.origin : ""
      }/signup/sponsor?classNetwork=${network.id}`
    : "";

  const handleInviteMemberProfile = async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!network?.id || !email) {
      setInviteFeedback({
        kind: "error",
        text: t("classNetworks.invites.emailRequired", {}, {
          default: "Enter an email address first.",
        }),
      });
      return;
    }

    if (
      memberProfiles.some(
        (profile) => profile?.email?.toLowerCase() === email
      )
    ) {
      setInviteFeedback({
        kind: "error",
        text: t("classNetworks.invites.alreadyMember", {}, {
          default: "That person is already a member of this network.",
        }),
      });
      return;
    }

    try {
      const result = await inviteMemberProfile({
        variables: { networkId: network.id, email },
      });
      const created = result?.data?.inviteProfileToClassNetwork;
      const requestApproved = created?.status === "approved";
      setInviteEmail("");
      setInviteFeedback({
        kind: "ok",
        text: requestApproved
          ? t("classNetworks.invites.requestApprovedViaInvite", {}, {
              default:
                "Membership request approved. They've been added to the network.",
            })
          : t("classNetworks.invites.inviteSent", {}, {
              default: "Invitation sent.",
            }),
        manualLink:
          !requestApproved && created?.token && !created?.profile?.id
            ? buildNetworkInviteManualLink(created.token)
            : "",
      });
      await refetchPendingInvites();
    } catch (err) {
      setInviteFeedback({
        kind: "error",
        text:
          err?.message ||
          t("classNetworks.invites.inviteError", {}, {
            default: "Failed to invite member.",
          }),
      });
    }
  };

  const handleAddMemberProfile = async () => {
    const email = memberEmail.trim().toLowerCase();
    if (!network?.id || !email) {
      setMemberFeedback({
        kind: "error",
        section: "profiles",
        text: t("classNetworks.memberProfileEmailRequired", {}, {
          default: "Enter an email address first.",
        }),
      });
      return;
    }

    if (
      memberProfiles.some(
        (profile) => profile?.email?.toLowerCase() === email
      )
    ) {
      setMemberFeedback({
        kind: "error",
        section: "profiles",
        text: t("classNetworks.memberProfileAlreadyAdded", {}, {
          default: "That person is already a member of this network.",
        }),
      });
      return;
    }

    try {
      await addMemberProfile({
        variables: { networkId: network.id, email },
      });
      setMemberEmail("");
      setMemberFeedback({
        kind: "ok",
        section: "profiles",
        text: t("classNetworks.memberProfileAdded", {}, {
          default: "Member profile added.",
        }),
      });
    } catch (err) {
      const message = err?.message || "";
      const notFound = message.includes("No MindHive account found");
      setMemberFeedback({
        kind: "error",
        section: "profiles",
        showInviteLink: notFound,
        text: notFound
          ? t(
              "classNetworks.memberProfileNotFound",
              { email },
              {
                default:
                  "No MindHive account found for {{email}}. Share the signup + invite link so they can join.",
              }
            )
          : message ||
            t("classNetworks.memberProfileAddError", {}, {
              default: "Failed to add member profile.",
            }),
      });
    }
  };

  const handleApproveInvite = async (inviteId) => {
    if (!inviteId) return;
    try {
      await approveInvite({ variables: { inviteId } });
      await refetchPendingInvites();
    } catch (err) {
      window.alert(
        err?.message ||
          t("classNetworks.invites.approveError", {}, {
            default: "Failed to approve request.",
          })
      );
    }
  };

  const handleRejectInvite = async (inviteId) => {
    if (!inviteId) return;
    const confirmed = window.confirm(
      t("classNetworks.invites.rejectConfirm", {}, {
        default: "Reject this membership request?",
      })
    );
    if (!confirmed) return;
    try {
      await rejectInvite({ variables: { inviteId } });
      await refetchPendingInvites();
    } catch (err) {
      window.alert(
        err?.message ||
          t("classNetworks.invites.rejectError", {}, {
            default: "Failed to reject request.",
          })
      );
    }
  };

  const handleCancelOutboundInvite = async (inviteId) => {
    if (!inviteId) return;
    const confirmed = window.confirm(
      t("classNetworks.invites.cancelInviteConfirm", {}, {
        default: "Cancel this invitation?",
      })
    );
    if (!confirmed) return;
    try {
      await cancelOutboundInvite({ variables: { inviteId } });
      await refetchPendingInvites();
    } catch (err) {
      window.alert(
        err?.message ||
          t("classNetworks.invites.cancelInviteError", {}, {
            default: "Failed to cancel invitation.",
          })
      );
    }
  };

  const handleRemoveMemberProfile = async (profileId) => {
    if (!network?.id || !profileId) return;
    const confirmed = window.confirm(
      t("classNetworks.memberProfileRemoveConfirm", {}, {
        default:
          "Remove this profile from the network? They will lose network membership but keep their account.",
      })
    );
    if (!confirmed) return;

    try {
      await removeMemberProfile({
        variables: { networkId: network.id, profileId },
      });
      setMemberFeedback({
        kind: "ok",
        section: "profiles",
        text: t("classNetworks.memberProfileRemoved", {}, {
          default: "Profile removed from the network.",
        }),
      });
    } catch (err) {
      setMemberFeedback({
        kind: "error",
        section: "profiles",
        text:
          err?.message ||
          t("classNetworks.memberProfileRemoveError", {}, {
            default: "Failed to remove profile from the network.",
          }),
      });
    }
  };

  const handleRemoveMemberOrganization = async (organizationId) => {
    if (!network?.id || !organizationId) return;
    const confirmed = window.confirm(
      t("classNetworks.memberOrganizationRemoveConfirm", {}, {
        default: "Remove this organization from the network?",
      })
    );
    if (!confirmed) return;

    try {
      await removeMemberOrganization({
        variables: { networkId: network.id, organizationId },
      });
      setMemberFeedback({
        kind: "ok",
        section: "organizations",
        text: t("classNetworks.memberOrganizationRemoved", {}, {
          default: "Organization removed from the network.",
        }),
      });
    } catch (err) {
      setMemberFeedback({
        kind: "error",
        section: "organizations",
        text:
          err?.message ||
          t("classNetworks.memberOrganizationRemoveError", {}, {
            default: "Failed to remove organization from the network.",
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

    const currentSettings =
      network.settings && typeof network.settings === "object"
        ? network.settings
        : {};
    const nextMembershipMode =
      membershipMode === "open" ? "open" : "approval";

    try {
      await updateNetworkDetails({
        variables: {
          id: network.id,
          title,
          description: networkDescription.trim() || "",
          settings: {
            ...currentSettings,
            membershipMode: nextMembershipMode,
          },
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

  const OrganizationActionsRenderer = useMemo(() => {
    function Renderer(params) {
      if (!canManage || !params?.data?.id) return null;
      return (
        <DesignSystemButton
          variant="text"
          style={{ color: "#871b16" }}
          type="button"
          disabled={memberMutationLoading}
          onClick={() => handleRemoveMemberOrganization(params.data.id)}
        >
          {t("classNetworks.memberRemove", {}, { default: "Remove" })}
        </DesignSystemButton>
      );
    }
    return Renderer;
  }, [canManage, memberMutationLoading, network?.id, t]);

  const ProfileActionsRenderer = useMemo(() => {
    function Renderer(params) {
      if (!canManage || !params?.data?.id) return null;
      return (
        <DesignSystemButton
          variant="text"
          style={{ color: "#871b16" }}
          disabled={memberMutationLoading}
          onClick={() => handleRemoveMemberProfile(params.data.id)}
        >
          {t("classNetworks.memberRemove", {}, { default: "Remove" })}
        </DesignSystemButton>
      );
    }
    return Renderer;
  }, [canManage, memberMutationLoading, network?.id, t]);

  const PendingInviteActionsRenderer = useMemo(() => {
    function Renderer(params) {
      if (!canManage || !params?.data?.id) return null;
      const direction = params.data.direction;
      if (direction === "request") {
        return (
          <InviteLinkRow>
            <DesignSystemButton
              variant="text"
              style={{ color: "#1d6b3a" }}
              type="button"
              disabled={inviteReviewLoading}
              onClick={() => handleApproveInvite(params.data.id)}
            >
              {t("classNetworks.invites.approve", {}, { default: "Approve" })}
            </DesignSystemButton>
            <DesignSystemButton
              variant="text"
              style={{ color: "#871b16" }}
              type="button"
              disabled={inviteReviewLoading}
              onClick={() => handleRejectInvite(params.data.id)}
            >
              {t("classNetworks.invites.reject", {}, { default: "Reject" })}
            </DesignSystemButton>
          </InviteLinkRow>
        );
      }
      return (
        <InviteLinkRow>
          {params.data.manualLink ? (
            <CopyButton
              value={params.data.manualLink}
              style={{ fontWeight: 500 }}
              ariaLabel={t("classNetworks.invites.copyInviteLinkAria", {}, {
                default: "Copy invite signup or login link",
              })}
            >
              {t("classNetworks.invites.copyInviteLink", {}, {
                default: "Copy invite link",
              })}
            </CopyButton>
          ) : null}
          <DesignSystemButton
            variant="text"
            style={{ color: "#871b16" }}
            type="button"
            disabled={inviteReviewLoading}
            onClick={() => handleCancelOutboundInvite(params.data.id)}
          >
            {t("classNetworks.invites.cancelInvite", {}, {
              default: "Cancel invite",
            })}
          </DesignSystemButton>
        </InviteLinkRow>
      );
    }
    return Renderer;
  }, [canManage, inviteReviewLoading, t]);

  const organizationColumnDefs = useMemo(
    () => [
      {
        field: "name",
        headerName: t("classNetworks.grid.name", {}, { default: "Name" }),
        flex: 1,
        minWidth: 200,
        filter: "agTextColumnFilter",
      },
      {
        field: "actions",
        headerName: t("classNetworks.grid.actions", {}, { default: "Actions" }),
        cellRenderer: OrganizationActionsRenderer,
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
    [OrganizationActionsRenderer, t]
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
      {
        field: "actions",
        headerName: t("classNetworks.grid.actions", {}, { default: "Actions" }),
        cellRenderer: ProfileActionsRenderer,
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
    [ProfileActionsRenderer, t]
  );

  const pendingInviteColumnDefs = useMemo(
    () => [
      {
        field: "person",
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
        field: "directionLabel",
        headerName: t("classNetworks.invites.direction", {}, {
          default: "Type",
        }),
        flex: 0.7,
        minWidth: 120,
        filter: "agTextColumnFilter",
      },
      {
        field: "createdAt",
        headerName: t("classNetworks.grid.created", {}, { default: "Created" }),
        valueGetter: (params) => params?.data?.createdAt || null,
        valueFormatter: (params) =>
          params.value ? moment(params.value).format("MMMM D, YYYY") : "",
        filter: "agDateColumnFilter",
        sortable: true,
        flex: 0.8,
        minWidth: 150,
      },
      {
        // Bind to direction so AG Grid refreshes this cell when request→invite
        // conversion updates the same row id (pinned action cells otherwise stay stale).
        field: "direction",
        headerName: t("classNetworks.grid.actions", {}, { default: "Actions" }),
        cellRenderer: PendingInviteActionsRenderer,
        sortable: false,
        filter: false,
        width: 280,
        pinned: "right",
        cellStyle: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
      },
    ],
    [PendingInviteActionsRenderer, t]
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
          variant="text"
          style={{ color: "#871b16" }}
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
                      default:
                        "Update membership mode, title, and description for this network.",
                    })}
                  </p>
                </SectionHeader>
                <DetailsForm>
                  <label htmlFor="connectClassNetworkMembershipMode">
                    {t("classNetworks.form.membershipModeLabel", {}, {
                      default: "Membership",
                    })}
                    <select
                      id="connectClassNetworkMembershipMode"
                      value={membershipMode}
                      onChange={(event) =>
                        setMembershipMode(
                          event.target.value === "open" ? "open" : "approval"
                        )
                      }
                    >
                      <option value="approval">
                        {t(
                          "classNetworks.form.membershipModeApprovalLabel",
                          {},
                          { default: "Approval required" }
                        )}
                      </option>
                      <option value="open">
                        {t(
                          "classNetworks.form.membershipModeOpenLabel",
                          {},
                          { default: "Open" }
                        )}
                      </option>
                    </select>
                    <p className="fieldHint">
                      {membershipMode === "open"
                        ? t(
                            "classNetworks.form.membershipModeOpenDescription",
                            {},
                            {
                              default:
                                "Eligible profiles can join this public network immediately.",
                            }
                          )
                        : t(
                            "classNetworks.form.membershipModeApprovalDescription",
                            {},
                            {
                              default:
                                "Eligible profiles must be approved by a network admin before joining.",
                            }
                          )}
                    </p>
                  </label>
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
              {memberFeedback?.section === "organizations" ? (
                <AdminFeedback $error={memberFeedback.kind === "error"}>
                  {memberFeedback.text}
                </AdminFeedback>
              ) : null}
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

              {canManage ? (
                <AdminForm>
                  <label htmlFor="connectClassNetworkInviteEmail">
                    {t("classNetworks.invites.inviteEmailLabel", {}, {
                      default: "Invite member by email",
                    })}
                  </label>
                  <AdminFormRow>
                    <input
                      id="connectClassNetworkInviteEmail"
                      type="email"
                      value={inviteEmail}
                      placeholder={t(
                        "classNetworks.invites.inviteEmailPlaceholder",
                        {},
                        { default: "mentor@example.com" }
                      )}
                      onChange={(event) => setInviteEmail(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          handleInviteMemberProfile();
                        }
                      }}
                    />
                    <DesignSystemButton
                      variant="filled"
                      type="button"
                      disabled={memberMutationLoading}
                      onClick={handleInviteMemberProfile}
                    >
                      {invitingMemberProfile
                        ? t("classNetworks.invites.inviting", {}, {
                            default: "Inviting...",
                          })
                        : t("classNetworks.invites.invite", {}, {
                            default: "Invite member",
                          })}
                    </DesignSystemButton>
                  </AdminFormRow>
                  {inviteFeedback ? (
                    <>
                      <AdminFeedback $error={inviteFeedback.kind === "error"}>
                        {inviteFeedback.text}
                      </AdminFeedback>
                      {inviteFeedback.manualLink ? (
                        <InviteLinkRow>
                          <CopyButton
                            value={inviteFeedback.manualLink}
                            style={{ fontWeight: 500 }}
                            ariaLabel={t(
                              "classNetworks.invites.copyInviteLinkAria",
                              {},
                              { default: "Copy invite signup or login link" }
                            )}
                          >
                            {t("classNetworks.invites.copyInviteLink", {}, {
                              default: "Copy invite link",
                            })}
                          </CopyButton>
                        </InviteLinkRow>
                      ) : null}
                    </>
                  ) : null}

                  {isAdmin ? (
                    <>
                      <label htmlFor="connectClassNetworkMemberEmail">
                        {t("classNetworks.memberProfileEmailLabel", {}, {
                          default: "Add member by email",
                        })}
                      </label>
                      <AdminFormRow>
                        <input
                          id="connectClassNetworkMemberEmail"
                          type="email"
                          value={memberEmail}
                          placeholder={t(
                            "classNetworks.memberProfileEmailPlaceholder",
                            {},
                            { default: "mentor@example.com" }
                          )}
                          onChange={(event) =>
                            setMemberEmail(event.target.value)
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              handleAddMemberProfile();
                            }
                          }}
                        />
                        <DesignSystemButton
                          variant="outline"
                          type="button"
                          disabled={memberMutationLoading}
                          onClick={handleAddMemberProfile}
                        >
                          {addingMemberProfile
                            ? t("classNetworks.memberProfileAdding", {}, {
                                default: "Adding...",
                              })
                            : t("classNetworks.memberProfileAdd", {}, {
                                default: "Add member",
                              })}
                        </DesignSystemButton>
                      </AdminFormRow>
                      {memberFeedback?.section === "profiles" ? (
                        <>
                          <AdminFeedback
                            $error={memberFeedback.kind === "error"}
                          >
                            {memberFeedback.text}
                          </AdminFeedback>
                          {memberFeedback.showInviteLink &&
                          sponsorSignupAndInviteLink ? (
                            <InviteLinkRow>
                              <CopyButton
                                value={sponsorSignupAndInviteLink}
                                style={{ fontWeight: 500 }}
                                ariaLabel={t(
                                  "classNetworks.signupAndInviteLink",
                                  {},
                                  { default: "Signup + invite to network" }
                                )}
                              >
                                {t("classNetworks.signupAndInviteLink", {}, {
                                  default: "Signup + invite to network",
                                })}
                              </CopyButton>
                            </InviteLinkRow>
                          ) : null}
                        </>
                      ) : null}
                    </>
                  ) : null}
                </AdminForm>
              ) : null}

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

            {canManage ? (
              <DetailSection id="network-pending-invites">
                <SectionHeader>
                  <h2>
                    {t("classNetworks.invites.pendingReviewTitle", {}, {
                      default: "Pending membership",
                    })}
                  </h2>
                  <p>
                    {t("classNetworks.invites.pendingReviewDescription", {}, {
                      default:
                        "Review join requests and cancel outbound invitations that are still pending.",
                    })}
                  </p>
                </SectionHeader>
                {pendingInviteRows.length === 0 ? (
                  <EmptyNote>
                    {t("classNetworks.invites.pendingEmpty", {}, {
                      default: "No pending requests or invitations.",
                    })}
                  </EmptyNote>
                ) : null}
                <GridTable className="ag-theme-quartz">
                  <AgGridReact
                    rowData={pendingInviteRows}
                    columnDefs={pendingInviteColumnDefs}
                    defaultColDef={defaultColDef}
                    getRowId={(params) => params.data?.id}
                    pagination
                    paginationPageSize={20}
                    overlayNoRowsTemplate={t(
                      "classNetworks.invites.pendingEmpty",
                      {},
                      { default: "No pending requests or invitations." }
                    )}
                  />
                </GridTable>
              </DetailSection>
            ) : null}

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
                      {addingNetworkAdmin
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
            </DetailSection>
          </>
        )}
      </Shell>
    </RoleGuard>
  );
}

export default NetworkDetailPage;
