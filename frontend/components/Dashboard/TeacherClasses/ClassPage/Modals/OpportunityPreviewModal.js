import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

import Button from "../../../../DesignSystem/Button";
import Chip from "../../../../DesignSystem/Chip";
import Modal from "../../../../DesignSystem/Modal";
import Navbar from "../../../../DesignSystem/Navbar";
import { EXPLORE_OPPORTUNITY_DETAIL } from "../../../../Queries/Opportunity";
import { GET_CONNECT_ROUND, NETWORK_OPPORTUNITIES_FOR_ROUND } from "../../../../Queries/ConnectRound";
import { FORM_DEFINITION_BY_ID } from "../../../../Queries/FormDefinition";
import { MARK_OPPORTUNITY_REVIEW_NOTES_READ } from "../../../../Mutations/OpportunityReviewNote";
import { ReadOnlyTipTap } from "../../../../TipTap/ReadOnlyTipTap";
import { hydrateProposalInputs } from "../../../Connect/Opportunities/OpportunityProposalConfig";
import ReturnOpportunityModal from "../../../Connect/ReturnOpportunityModal";
import OpportunityReviewNotesThread from "../../../Connect/OpportunityReviewNotesThread";
import OpportunityFollowUpFormPanel from "../../../SponsorConnect/Opportunities/OpportunityFollowUpFormPanel";
import FollowUpFormsNavSelect from "../../../SponsorConnect/Opportunities/FollowUpFormsNavSelect";
import DefinitionForm from "../../../../Forms/DefinitionForm";
import { isReturnableOpportunityStatus } from "../../../Connect/returnOpportunityUtils";
import ConnectProfileCard from "../../../Connect/ConnectProfileCard";
import OrganizationConnectCard from "../../../Connect/Organizations/OrganizationConnectCard";
import { useUser } from "../../../../Utils/Access/User";
import {
  getUnreadSponsorReplyNotes,
  REVIEW_NOTE_KIND,
} from "../../../../../lib/reviewThreadRound";
import {
  OPPORTUNITY_PREVIEW_TABS,
  parseFormTabKey,
  resolveOpportunityPreviewTab,
  resolvePreviewFollowUpForms,
} from "../../../../../lib/opportunityPreviewTabs";
import { getIntakeProposalFormDefinitionId } from "../../../../../lib/opportunityProposalData";
import { opportunityToneChipStyle } from "../../../../../lib/opportunityStatusTones";

/*
 * Backlog (Available / Pre-selected grid — later):
 * - Review with unread should open this modal and open the Messages panel
 *   (e.g. initialChatOpen), without marking notes read until Messages opens.
 * - Revisit dual selection paths (grid checkbox vs modal Select/Remove).
 * - Clarify or replace the opaque `!` InfoTooltip vs Review.
 */

const DIRECT_VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogg|ogv)(\?|#|$)/i;

const STATUS_KEYS = {
  draft: "draft",
  pending_review: "pendingReview",
  returned: "returned",
  pre_selected: "preSelected",
  accepted: "accepted",
  published: "published",
  closed: "closed",
  archived: "archived",
};

/** Map opportunity status → shared DesignSystem-adjacent status tones. */
const STATUS_CHIP_TONES = {
  draft: "pending",
  pending_review: "action",
  returned: "action",
  pre_selected: "waiting",
  accepted: "done",
  published: "done",
  closed: "pending",
  archived: "pending",
};

const CATEGORY_LABELS = {
  urban_health: "urbanHealth",
  urban_environment: "urbanEnvironment",
  urban_infrastructure: "urbanInfrastructure",
  other: "other",
};

const GRADE_LABELS = {
  middle: "middle",
  nine: "nine",
  eleven: "eleven",
};

const CLASS_TYPE_LABELS = {
  accelerated: "accelerated",
  nonAccelerated: "nonAccelerated",
  ell: "ell",
};

/** Teacher review should see sponsor-gated intake fields too. */
const PREVIEW_VIEWER_ROLES = ["teacher", "admin", "sponsor", "mentor"];

function toOptionKey(value) {
  return String(value || "").replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

const NavWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  width: 100%;

  .navbar-container {
    flex-wrap: wrap;
  }

  .navbar-item {
    background: var(--MH-Theme-Neutrals-Lighter, #f3f3f3);
  }

  .navbar-item:hover {
    background: var(--MH-Theme-Neutrals-Light, #e6e6e6);
  }

  .navbar-item.selected,
  .navbar-item:active {
    background: var(--MH-Theme-Tertiary-Medium, #d3e0e3);
  }
`;

const ToolbarRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;

const SummaryStrip = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  align-items: flex-start;
  flex: 0 1 auto;
  width: fit-content;
  max-width: 100%;
  padding: 8px 12px;
  border-radius: 10px;
  background: var(--MH-Theme-Primary-Lighter, #f4f8f7);
  border: 1px solid var(--MH-Theme-Primary-Medium, #a3d6db);
`;

const SplitShell = styled.div`
  display: grid;
  grid-template-columns: ${(p) => (p.$chatOpen ? "minmax(0, 1fr) minmax(300px, 400px)" : "minmax(0, 1fr)")};
  gap: 0;
  min-height: 0;
  flex: 1;
  height: 100%;
`;

const ContentPane = styled.div`
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  padding-right: ${(p) => (p.$chatOpen ? "16px" : "0")};
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const ChatPane = styled.aside`
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-left: 16px;
  border-left: 1px solid var(--MH-Theme-Primary-Medium, #a3d6db);
  background: var(--MH-Theme-Primary-Lighter, #f4f8f7);
`;

const ChatPaneTitle = styled.h4`
  margin: 0;
  flex-shrink: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--MH-Theme-Neutrals-Black, #171717);
`;

const ChatThreadWrap = styled.div`
  flex: 1 1 0;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const PeopleGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  align-items: start;

  @media (max-width: 900px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const TitleRow = styled.span`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  min-width: 0;
`;

const TitleText = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const MessagesToggleWrap = styled.div`
  position: relative;
  flex-shrink: 0;
`;

const ToolbarActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
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

const META_ITEM_STYLE = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  width: "auto",
  justifyContent: "space-between",
  padding: "10px 14px",
  borderRadius: 10,
  background: "var(--MH-Theme-Tertiary-Lighter, #f4f8f7)",
  border: "1px solid var(--MH-Theme-Primary-Medium, #a3d6db)",
};

const META_LABEL_STYLE = {
  fontSize: 11,
  color: "var(--MH-Theme-Neutrals-Dark, #5f6871)",
  textTransform: "uppercase",
};

const META_VALUE_STYLE = {
  marginTop: 2,
  fontWeight: 600,
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
};

const SUMMARY_STRIP_STYLE = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px 16px",
  alignItems: "flex-start",
  width: "fit-content",
  maxWidth: "100%",
  padding: "8px 12px",
  borderRadius: 10,
  background: "var(--MH-Theme-Primary-Lighter, #f4f8f7)",
  border: "1px solid var(--MH-Theme-Primary-Medium, #a3d6db)",
};

const SUMMARY_ITEM_STYLE = {
  display: "inline-flex",
  flexDirection: "column",
  gap: 2,
  minWidth: 0,
};

const SUMMARY_LABEL_STYLE = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: "var(--MH-Theme-Primary-Dark, #336f8a)",
};

const SUMMARY_VALUE_STYLE = {
  fontSize: 13,
  fontWeight: 600,
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
};

const SUMMARY_HIGHLIGHT_STYLE = {
  padding: "4px 8px",
  borderRadius: 8,
  background: "var(--MH-Theme-Primary-Light, #def8fb)",
  border: "1px solid var(--MH-Theme-Primary-Medium, #a3d6db)",
};

/** People / Messages: tonal variant with tertiary fill. */
const TOOLBAR_TONAL_STYLE = {
  border: "0 solid var(--MH-Theme-Tertiary-Medium, #D3E0E3)",
  background: "var(--MH-Theme-Tertiary-Medium, #D3E0E3)",
};

const PROPOSAL_SECTION_STYLE = {
  display: "grid",
  gap: 16,
  paddingTop: 4,
};

const SECTION_TITLE_STYLE = {
  margin: 0,
  fontSize: 16,
  fontWeight: 700,
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
};

const BODY_TEXT_STYLE = {
  margin: 0,
  color: "var(--MH-Theme-Neutrals-Dark, #5f6871)",
  fontSize: 14,
  lineHeight: 1.6,
  whiteSpace: "pre-wrap",
};

function extractUrl(raw) {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;
  const m = trimmed.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  return m ? m[1] : trimmed;
}

function isDirectVideoFile(url) {
  if (!url) return false;
  try {
    return DIRECT_VIDEO_EXT.test(new URL(url).pathname);
  } catch {
    return DIRECT_VIDEO_EXT.test(url);
  }
}

function getEmbedUrl(rawUrl) {
  if (!rawUrl) return null;
  try {
    const u = new URL(rawUrl);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtube.com" || host === "m.youtube.com") {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
      const shortsMatch = u.pathname.match(/^\/shorts\/([^/]+)/);
      if (shortsMatch) return `https://www.youtube.com/embed/${shortsMatch[1]}`;
      const embedMatch = u.pathname.match(/^\/embed\/([^/]+)/);
      if (embedMatch) return `https://www.youtube.com/embed/${embedMatch[1]}`;
    }
    if (host === "youtu.be") {
      const id = u.pathname.replace(/^\//, "");
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const id = u.pathname.replace(/^\/(video\/)?/, "").split("/")[0];
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
    if (host === "loom.com" || host.endsWith(".loom.com")) {
      const m = u.pathname.match(/\/(share|embed)\/([^/?]+)/);
      if (m) return `https://www.loom.com/embed/${m[2]}`;
    }
    if (host === "drive.google.com") {
      const m = u.pathname.match(/\/file\/d\/([^/]+)/);
      if (m) return `https://drive.google.com/file/d/${m[1]}/preview`;
    }
    return null;
  } catch {
    return null;
  }
}

function displayName(profile) {
  if (!profile) return null;
  return (
    `${profile.firstName || ""} ${profile.lastName || ""}`.trim() ||
    profile.username
  );
}

function formatDate(value) {
  if (!value) return null;
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return null;
  }
}

function MetaItem({ label, value, style }) {
  if (value == null || value === "") return null;
  return (
    <div style={style ? { ...META_ITEM_STYLE, ...style } : META_ITEM_STYLE}>
      <div style={META_LABEL_STYLE}>{label}</div>
      <div style={META_VALUE_STYLE}>{value}</div>
    </div>
  );
}

function SummaryItem({ label, value, highlight }) {
  if (value == null || value === "") return null;
  return (
    <div
      style={
        highlight
          ? { ...SUMMARY_ITEM_STYLE, ...SUMMARY_HIGHLIGHT_STYLE }
          : SUMMARY_ITEM_STYLE
      }
    >
      <span style={SUMMARY_LABEL_STYLE}>{label}</span>
      <span style={SUMMARY_VALUE_STYLE}>{value}</span>
    </div>
  );
}

function PreviewSection({ title, children }) {
  if (!children) return null;
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <h4 style={SECTION_TITLE_STYLE}>{title}</h4>
      {children}
    </div>
  );
}

const ANSWER_BOX_STYLE = {
  padding: "12px 14px",
  borderRadius: 10,
  background: "var(--MH-Theme-Tertiary-Lighter, #f4f8f7)",
  border: "1px solid var(--MH-Theme-Primary-Medium, #a3d6db)",
};

function TextBlock({ label, value, html = false }) {
  if (!value) return null;
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {label ? (
        <strong style={{ fontSize: 14, color: "#171717" }}>{label}</strong>
      ) : null}
      <div style={ANSWER_BOX_STYLE}>
        {html ? (
          <ReadOnlyTipTap dangerouslySetInnerHTML={{ __html: value }} />
        ) : (
          <p style={BODY_TEXT_STYLE}>{value}</p>
        )}
      </div>
    </div>
  );
}

function Stars({ value }) {
  const v = Math.round(value || 0);
  return (
    <span aria-label={`${v} of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          style={{ color: n <= v ? "#f5b800" : "#d3dae0", fontSize: 14 }}
        >
          {n <= v ? "★" : "☆"}
        </span>
      ))}
    </span>
  );
}

function chipLeadingImage(src, alt) {
  if (!src) return null;
  return (
    <img
      src={src}
      alt={alt || ""}
      width={24}
      height={24}
      style={{ borderRadius: "50%", objectFit: "cover", display: "block" }}
    />
  );
}

export default function OpportunityPreviewModal({
  open,
  opportunityId,
  onClose,
  matchingRoundContext,
  initialTab = null,
}) {
  const { t } = useTranslation("classes");
  const { t: tConnect } = useTranslation("connect");
  const router = useRouter();
  const user = useUser();
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(OPPORTUNITY_PREVIEW_TABS.detail);
  const [chatOpen, setChatOpen] = useState(false);
  const markedReadNoteIdsRef = useRef(new Set());

  const isInMatchingRound =
    opportunityId &&
    matchingRoundContext?.selectedOpportunityIds?.includes(opportunityId);
  const isToggling =
    matchingRoundContext?.togglingOpportunityId === opportunityId;
  const canManage = matchingRoundContext?.canManageOpportunities;
  const showNoRoundHint = matchingRoundContext?.noRoundForNetwork;
  const showMatchingRoundSection = Boolean(matchingRoundContext);

  const handleToggleMatchingRound = () => {
    if (!opportunityId || !canManage || isToggling) return;
    matchingRoundContext?.toggleOpportunity?.(opportunityId);
  };

  const matchingRoundTitle =
    matchingRoundContext?.roundTitle ||
    t("opportunities.matchingRound.title", {}, { default: "Matching round" });

  const matchingRoundButtonLabel = isToggling
    ? t("opportunities.preview.matchingRound.saving", {}, { default: "Saving…" })
    : isInMatchingRound
      ? t(
          "opportunities.preview.matchingRound.removeFromRound",
          { title: matchingRoundTitle },
          { default: "Remove from {{title}}" },
        )
      : t(
          "opportunities.preview.matchingRound.addToRound",
          { title: matchingRoundTitle },
          { default: "Add to {{title}}" },
        );

  const { data, loading } = useQuery(EXPLORE_OPPORTUNITY_DETAIL, {
    variables: { id: opportunityId },
    skip: !open || !opportunityId,
    fetchPolicy: "cache-and-network",
  });

  const opp = data?.opportunity;
  const viewerId = data?.authenticatedItem?.id;

  const coverSrc = opp?.coverImage?.url || opp?.coverImageUrl || null;
  const mentorName = displayName(opp?.mentor);
  const orgName = opp?.organization?.name || null;
  const mentorAvatar =
    opp?.mentor?.image?.keystoneImage?.url ||
    opp?.mentor?.image?.image?.publicUrlTransformed ||
    null;
  const orgLogo = opp?.organization?.logo?.url || null;
  const mentorProfileId = opp?.mentor?.publicId || null;
  const orgId = opp?.organization?.id || null;
  const mentorProfileUrl = mentorProfileId
    ? `/dashboard/connect/with?id=${encodeURIComponent(mentorProfileId)}`
    : null;
  const orgProfileUrl = orgId
    ? `/dashboard/connect/organizations?org=${encodeURIComponent(orgId)}`
    : null;

  const from = formatDate(opp?.availableFrom);
  const to = formatDate(opp?.availableTo);

  const statusKey = STATUS_KEYS[opp?.status];
  const statusLabel = statusKey
    ? t(`opportunities.status.${statusKey}`, {}, { default: opp?.status })
    : opp?.status;

  const activeRoundId = matchingRoundContext?.activeRoundId;
  const selectedNetworkId = matchingRoundContext?.selectedNetworkId;
  const canReturnToSponsor =
    canManage &&
    activeRoundId &&
    opp?.status &&
    isReturnableOpportunityStatus(opp.status);

  const showChat = Boolean(canManage && activeRoundId);

  const followUpForms = useMemo(
    () =>
      resolvePreviewFollowUpForms({
        activeRoundId,
        rounds: opp?.rounds || [],
        contextFormDefinitions: matchingRoundContext?.formDefinitions,
        roundTitle: matchingRoundContext?.roundTitle || null,
        networkId: matchingRoundContext?.selectedNetworkId || null,
      }),
    [
      activeRoundId,
      opp?.rounds,
      matchingRoundContext?.formDefinitions,
      matchingRoundContext?.roundTitle,
      matchingRoundContext?.selectedNetworkId,
    ],
  );

  const intakeFormDefinitionId = useMemo(() => {
    const excludeIds = followUpForms.map((f) => f.id).filter(Boolean);
    return getIntakeProposalFormDefinitionId(opp?.proposalData, excludeIds);
  }, [opp?.proposalData, followUpForms]);

  const { data: intakeFormData, loading: intakeFormLoading } = useQuery(
    FORM_DEFINITION_BY_ID,
    {
      variables: { id: intakeFormDefinitionId },
      skip: !intakeFormDefinitionId,
      fetchPolicy: "cache-and-network",
    },
  );
  const intakeFormDefinition = intakeFormData?.formDefinition || null;

  const proposal = useMemo(
    () => hydrateProposalInputs(opp, intakeFormDefinitionId),
    [opp, intakeFormDefinitionId],
  );

  const resolvedTab = resolveOpportunityPreviewTab(activeTab, {
    followUpForms,
    // Chat is no longer a content tab; it opens as an on-demand side panel.
    showChat: false,
  });

  const activeFollowUpForm = useMemo(() => {
    const formId = parseFormTabKey(resolvedTab);
    if (!formId) return null;
    return followUpForms.find((f) => f.id === formId) || null;
  }, [resolvedTab, followUpForms]);

  useEffect(() => {
    if (!open) {
      setChatOpen(false);
      return;
    }
    const nextTab =
      initialTab === OPPORTUNITY_PREVIEW_TABS.chat
        ? OPPORTUNITY_PREVIEW_TABS.detail
        : initialTab || OPPORTUNITY_PREVIEW_TABS.detail;
    setActiveTab(nextTab);
    setChatOpen(false);
  }, [open, opportunityId, initialTab]);

  useEffect(() => {
    if (activeTab !== resolvedTab) {
      setActiveTab(resolvedTab);
    }
  }, [activeTab, resolvedTab]);

  const roundReviewNotes = useMemo(() => {
    const notes = opp?.reviewNotes || [];
    if (!activeRoundId) return [];
    return notes.filter((note) => note.round?.id === activeRoundId);
  }, [opp?.reviewNotes, activeRoundId]);

  const unreadSponsorReplies = useMemo(() => {
    if (!viewerId || !activeRoundId) return [];
    return getUnreadSponsorReplyNotes({
      notes: opp?.reviewNotes,
      roundId: activeRoundId,
      viewerId,
    });
  }, [opp?.reviewNotes, activeRoundId, viewerId]);

  const unreadCount = unreadSponsorReplies.length;

  const returnRefetchQueries = useMemo(() => {
    const queries = [
      {
        query: EXPLORE_OPPORTUNITY_DETAIL,
        variables: { id: opportunityId },
      },
    ];
    if (activeRoundId) {
      queries.push({
        query: GET_CONNECT_ROUND,
        variables: { id: activeRoundId },
      });
    }
    if (selectedNetworkId) {
      queries.push({
        query: NETWORK_OPPORTUNITIES_FOR_ROUND,
        variables: { classNetworkId: selectedNetworkId },
      });
    }
    return queries;
  }, [opportunityId, activeRoundId, selectedNetworkId]);

  const [markNotesRead] = useMutation(MARK_OPPORTUNITY_REVIEW_NOTES_READ);

  // Mark sponsor replies read only once the teacher opens Messages (not on modal open).
  useEffect(() => {
    if (!open) {
      markedReadNoteIdsRef.current = new Set();
      return;
    }
    if (!chatOpen || !opportunityId || !activeRoundId || !viewerId) return;

    const noteIds = unreadSponsorReplies
      .map((note) => note.id)
      .filter((id) => id && !markedReadNoteIdsRef.current.has(id));
    if (noteIds.length === 0) return;

    noteIds.forEach((id) => markedReadNoteIdsRef.current.add(id));

    markNotesRead({
      variables: { noteIds },
      refetchQueries: returnRefetchQueries,
      awaitRefetchQueries: true,
    }).catch((err) => {
      noteIds.forEach((id) => markedReadNoteIdsRef.current.delete(id));
      console.error("Failed to mark review notes as read", err);
    });
  }, [
    open,
    chatOpen,
    opportunityId,
    activeRoundId,
    viewerId,
    unreadSponsorReplies,
    markNotesRead,
    returnRefetchQueries,
  ]);

  const handleReturnSuccess = () => {
    setReturnModalOpen(false);
    onClose?.();
  };

  const categoryKey = CATEGORY_LABELS[opp?.projectCategory];
  const categoryLabel = categoryKey
    ? tConnect(`opportunityEditor.categorizationOptions.${categoryKey}`, {}, {
        default: opp?.projectCategory,
      })
    : opp?.projectCategory;

  const cleanVideoUrl = extractUrl(opp?.videoUrl);
  const directVideoSrc =
    opp?.videoFile?.url ||
    (isDirectVideoFile(cleanVideoUrl) ? cleanVideoUrl : null);
  const embedUrl = !directVideoSrc ? getEmbedUrl(cleanVideoUrl) : null;
  const fallbackIframeSrc =
    !directVideoSrc && !embedUrl && cleanVideoUrl ? cleanVideoUrl : null;

  const gradeLevelsLabel = (opp?.preferGradeLevels || [])
    .map((value) =>
      tConnect(`mentorPreferences.gradeLevel.options.${GRADE_LABELS[value] || value}`, {}, {
        default: value,
      }),
    )
    .join(", ");

  const classTypesLabel = (opp?.preferClassType || [])
    .map((value) =>
      tConnect(`mentorPreferences.classType.options.${CLASS_TYPE_LABELS[value] || value}`, {}, {
        default: value,
      }),
    )
    .join(", ");

  const groupFormatLabel = opp?.preferGroupFormat
    ? t("opportunities.preview.groupFormatOptions." + opp.preferGroupFormat, {}, {
        default:
          {
            individual: "Individual",
            team: "Team",
            either: "Either",
          }[opp.preferGroupFormat] || opp.preferGroupFormat,
      })
    : null;

  const overviewLabel = (key, fallback) =>
    tConnect(`opportunityEditor.overview.${key}`, {}, { default: fallback });

  const overviewOptionLabel = (group, value) => {
    if (!value) return null;
    return tConnect(
      `opportunityEditor.overview.${group}.${toOptionKey(value)}`,
      {},
      { default: value },
    );
  };

  const formatMultiOptions = (values, group) => {
    const list = Array.isArray(values) ? values : [];
    if (!list.length) return null;
    return list.map((value) => overviewOptionLabel(group, value)).join(", ");
  };

  const yesNoLabel = (value) =>
    value ? overviewOptionLabel("yesNo", value) : null;

  const hasLegacyProposalContent = Boolean(
    proposal.relevance ||
      proposal.requiresSpecialResources ||
      proposal.specialResourcesNotes ||
      proposal.datasetProvision?.length ||
      proposal.expectedDeliverables?.length ||
      proposal.anticipatedObstacles ||
      proposal.fieldResearchRequired ||
      proposal.fieldResearchTravelDetails ||
      proposal.requiredSoftware?.length ||
      proposal.requiredHardware?.length ||
      proposal.additionalNotes ||
      proposal.internshipInterest,
  );

  const showIntakeDefinitionForm = Boolean(intakeFormDefinition);
  const showLegacyProposalBlocks =
    !showIntakeDefinitionForm && !intakeFormLoading && hasLegacyProposalContent;

  const modalTitle =
    opp?.title ||
    t("opportunities.networkOpportunitiesTitle", {}, {
      default: "Network opportunities",
    });

  const statusTone = STATUS_CHIP_TONES[opp?.status] || "pending";
  const modalTitleNode = (
    <TitleRow>
      <TitleText>{modalTitle}</TitleText>
      {statusLabel ? (
        <Chip
          label={statusLabel}
          shape="pill"
          style={opportunityToneChipStyle(statusTone)}
        />
      ) : null}
    </TitleRow>
  );

  const showChatPane = Boolean(showChat && chatOpen);
  const messagesLabel = chatOpen
    ? t("opportunities.preview.closeMessages", {}, { default: "Hide messages" })
    : t("opportunities.preview.messages", {}, { default: "Messages" });
  const messagesAriaLabel =
    !chatOpen && unreadCount > 0
      ? t(
          "opportunities.preview.messagesUnreadAria",
          { count: unreadCount },
          { default: "Messages, {{count}} unread" },
        )
      : messagesLabel;

  const teamSizeLabel =
    opp?.teamSize > 1
      ? t(
          "opportunities.preview.teamSizeTeam",
          { size: opp.teamSize },
          { default: "Team of {{size}}" },
        )
      : t("opportunities.preview.teamSizeSolo", {}, { default: "Solo" });

  const allowsTeamPreferencesLabel =
    opp?.allowsTeamPreferences == null
      ? null
      : opp.allowsTeamPreferences
        ? t("opportunities.preview.yes", {}, { default: "Yes" })
        : t("opportunities.preview.no", {}, { default: "No" });

  const modalActions = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 6,
        width: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 16,
          width: "100%",
          flexWrap: "wrap",
        }}
      >
        <Button variant="outline" onClick={onClose}>
          {t("opportunities.preview.close", {}, { default: "Close" })}
        </Button>
        {canReturnToSponsor ? (
          <Button variant="outline" onClick={() => setReturnModalOpen(true)}>
            {t("opportunities.preview.returnToSponsor", {}, {
              default: "Return with comments",
            })}
          </Button>
        ) : null}
        {showMatchingRoundSection ? (
          showNoRoundHint ? (
            <span style={{ fontSize: 13, color: "#5f6871" }}>
              {t("opportunities.preview.matchingRound.noRoundHint", {}, {
                default:
                  "Create a matching round above to include this opportunity.",
              })}
            </span>
          ) : canManage ? (
            <Button
              variant={isInMatchingRound ? "outline" : "filled"}
              onClick={handleToggleMatchingRound}
              disabled={isToggling}
            >
              {matchingRoundButtonLabel}
            </Button>
          ) : null
        ) : null}
      </div>
      {canReturnToSponsor ? (
        <span
          style={{
            fontSize: 12,
            lineHeight: 1.4,
            color: "var(--MH-Theme-Neutrals-Dark, #5f6871)",
            textAlign: "right",
            maxWidth: 420,
          }}
        >
          {t("opportunities.preview.returnHelper", {}, {
            default:
              "Formally returns this opportunity for revision. Use Messages for ongoing conversation.",
          })}
        </span>
      ) : null}
    </div>
  );

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        size="large"
        maxWidth={showChatPane ? 1280 : 960}
        maxHeight="90vh"
        height="90vh"
        title={modalTitleNode}
        actions={modalActions}
        bodyStyle={{
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
        }}
      >
          {loading && !opp ? (
            <p style={{ margin: 0, color: "#5f6871" }}>
              {t("opportunities.preview.loading", {}, { default: "Loading opportunity…" })}
            </p>
          ) : null}

          {!loading && !opp ? (
            <p style={{ margin: 0, color: "#5f6871" }}>
              {t("opportunities.preview.notFound", {}, {
                default: "Opportunity not found, or no longer available.",
              })}
            </p>
          ) : null}

          {opp ? (
            <SplitShell $chatOpen={showChatPane}>
              <ContentPane $chatOpen={showChatPane}>
            <div style={{ display: "grid", gap: 24, color: "#171717" }}>
              {/* {(mentorName || orgName) ? (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    justifyContent: "flex-end",
                  }}
                >
                  {mentorName ? (
                    <Chip
                      label={mentorName}
                      shape="pill"
                      leading={chipLeadingImage(mentorAvatar, mentorName)}
                      onClick={
                        mentorProfileUrl
                          ? () =>
                              window.open(
                                mentorProfileUrl,
                                "_blank",
                                "noopener,noreferrer",
                              )
                          : undefined
                      }
                      ariaLabel={
                        mentorProfileUrl
                          ? tConnect(
                              "profileCard.viewProfile",
                              { name: mentorName },
                              { default: "View profile of {{name}}" },
                            )
                          : undefined
                      }
                    />
                  ) : null}
                  {orgName ? (
                    <Chip
                      label={orgName}
                      shape="pill"
                      leading={chipLeadingImage(orgLogo, orgName)}
                      onClick={
                        orgProfileUrl
                          ? () =>
                              window.open(
                                orgProfileUrl,
                                "_blank",
                                "noopener,noreferrer",
                              )
                          : undefined
                      }
                      ariaLabel={
                        orgProfileUrl
                          ? t(
                              "opportunities.preview.viewOrganization",
                              { name: orgName },
                              { default: "View organization {{name}}" },
                            )
                          : undefined
                      }
                    />
                  ) : null}
                </div>
              ) : null} */}
              {coverSrc ? (
                <div
                  role="img"
                  aria-label={opp.title}
                  style={{
                    width: "100%",
                    height: 220,
                    borderRadius: 12,
                    background: `url(${coverSrc}) center/cover no-repeat #eef1f2`,
                  }}
                />
              ) : null}

              {opp.shortDescription ? (
                <p style={{ margin: 0, color: "#625b71", fontSize: 15, lineHeight: 1.5 }}>
                  {opp.shortDescription}
                </p>
              ) : null}

              <ToolbarRow>
                <SummaryStrip>
                  {opp.requestsAppointment ? (
                    <SummaryItem
                      label={t("opportunities.preview.requestsAppointment", {}, {
                        default: "Appointment requested",
                      })}
                      value={t("opportunities.preview.yes", {}, { default: "Yes" })}
                      highlight
                    />
                  ) : null}
                  <SummaryItem
                    label={t("opportunities.preview.capacity", {}, { default: "Capacity" })}
                    value={opp.studentCapacity || 1}
                  />
                  <SummaryItem
                    label={t("opportunities.preview.teamSize", {}, { default: "Team size" })}
                    value={teamSizeLabel}
                  />
                  <SummaryItem
                    label={t("opportunities.preview.available", {}, { default: "Available" })}
                    value={from || to ? `${from || "—"} → ${to || "—"}` : null}
                  />
                  <SummaryItem
                    label={t("opportunities.preview.timeCommitment", {}, {
                      default: "Time commitment",
                    })}
                    value={opp.timeCommitment}
                  />
                  <SummaryItem
                    label={t("opportunities.preview.projectCategory", {}, {
                      default: "Project category",
                    })}
                    value={
                      categoryLabel
                        ? opp.projectCategory === "other" && opp.projectCategoryOther
                          ? `${categoryLabel}: ${opp.projectCategoryOther}`
                          : categoryLabel
                        : opp.projectCategoryOther
                    }
                  />
                  {opp.publicRatingCount > 0 ? (
                    <SummaryItem
                      label={t("opportunities.preview.publicRating", {}, {
                        default: "Public rating",
                      })}
                      value={`${opp.publicRatingAverage?.toFixed(1)} (${opp.publicRatingCount})`}
                    />
                  ) : null}
                </SummaryStrip>
                <ToolbarActions>
                  <Button
                    type="button"
                    variant="tonal"
                    style={TOOLBAR_TONAL_STYLE}
                    aria-pressed={resolvedTab === OPPORTUNITY_PREVIEW_TABS.people}
                    aria-label={t("opportunities.preview.tabs.people", {}, {
                      default: "People",
                    })}
                    title={t("opportunities.preview.tabs.people", {}, {
                      default: "People",
                    })}
                    leadingIcon={
                      <img
                        src="/assets/connect/group.svg"
                        alt=""
                        aria-hidden
                        width={20}
                        height={16}
                      />
                    }
                    onClick={() =>
                      setActiveTab((prev) =>
                        prev === OPPORTUNITY_PREVIEW_TABS.people
                          ? OPPORTUNITY_PREVIEW_TABS.detail
                          : OPPORTUNITY_PREVIEW_TABS.people,
                      )
                    }
                  >
                    {t("opportunities.preview.tabs.people", {}, {
                      default: "People",
                    })}
                  </Button>
                  {showChat ? (
                    <MessagesToggleWrap>
                      <Button
                        type="button"
                        variant="tonal"
                        style={TOOLBAR_TONAL_STYLE}
                        aria-pressed={chatOpen}
                        aria-label={messagesAriaLabel}
                        title={messagesAriaLabel}
                        leadingIcon={
                          <img
                            src="/assets/icons/message.svg"
                            alt=""
                            aria-hidden
                            width={20}
                            height={20}
                          />
                        }
                        onClick={() => setChatOpen((prev) => !prev)}
                      >
                        {messagesLabel}
                      </Button>
                      {!chatOpen && unreadCount > 0 ? (
                        <UnreadBadge aria-hidden>
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </UnreadBadge>
                      ) : null}
                    </MessagesToggleWrap>
                  ) : null}
                </ToolbarActions>
              </ToolbarRow>

              <NavWrap>
                <Navbar variant="tonal">
                  <FollowUpFormsNavSelect
                    primaryTab={OPPORTUNITY_PREVIEW_TABS.detail}
                    followUpForms={followUpForms}
                    activeTab={resolvedTab}
                    onSelectTab={setActiveTab}
                    proposalData={opp.proposalData}
                  />
                </Navbar>
              </NavWrap>

              {resolvedTab === OPPORTUNITY_PREVIEW_TABS.detail ? (
                <div style={{ display: "grid", gap: 24 }}>
                  {(gradeLevelsLabel ||
                    classTypesLabel ||
                    groupFormatLabel ||
                    allowsTeamPreferencesLabel) && (
                    <PreviewSection
                      title={t("opportunities.preview.preferences", {}, {
                        default: "Student preferences",
                      })}
                    >
                      <div style={SUMMARY_STRIP_STYLE}>
                        <SummaryItem
                          label={tConnect("mentorPreferences.gradeLevel.title", {}, {
                            default: "Grade level",
                          })}
                          value={gradeLevelsLabel}
                        />
                        <SummaryItem
                          label={tConnect("mentorPreferences.classType.title", {}, {
                            default: "Class type",
                          })}
                          value={classTypesLabel}
                        />
                        <SummaryItem
                          label={tConnect("opportunityEditor.groupFormat", {}, {
                            default: "Group format",
                          })}
                          value={groupFormatLabel}
                        />
                        <SummaryItem
                          label={t("opportunities.preview.allowsTeamPreferences", {}, {
                            default: "Team preferences allowed",
                          })}
                          value={allowsTeamPreferencesLabel}
                        />
                      </div>
                    </PreviewSection>
                  )}

                  {opp.classNetworks?.length > 0 ? (
                    <PreviewSection
                      title={tConnect("opportunityEditor.offeredInNetworks", {}, {
                        default: "Offered in class networks",
                      })}
                    >
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {opp.classNetworks.map((network) => (
                          <Chip key={network.id} label={network.title} shape="square" />
                        ))}
                      </div>
                    </PreviewSection>
                  ) : null}

                  {(directVideoSrc || embedUrl || fallbackIframeSrc) && (
                    <PreviewSection
                      title={tConnect("opportunityEditor.introVideo", {}, {
                        default: "Intro video",
                      })}
                    >
                      {directVideoSrc ? (
                        <video
                          src={directVideoSrc}
                          controls
                          style={{ width: "100%", borderRadius: 12, maxHeight: 360 }}
                        />
                      ) : (
                        <div
                          style={{
                            position: "relative",
                            paddingBottom: "56.25%",
                            height: 0,
                            overflow: "hidden",
                            borderRadius: 12,
                            background: "#111",
                          }}
                        >
                          <iframe
                            title={tConnect("opportunityEditor.introVideo", {}, {
                              default: "Intro video",
                            })}
                            src={embedUrl || fallbackIframeSrc}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              width: "100%",
                              height: "100%",
                              border: 0,
                            }}
                          />
                        </div>
                      )}
                    </PreviewSection>
                  )}

                  {(opp.description ||
                    showIntakeDefinitionForm ||
                    showLegacyProposalBlocks ||
                    (intakeFormLoading && intakeFormDefinitionId)) ? (
                    <div style={PROPOSAL_SECTION_STYLE}>
                      <h4 style={SECTION_TITLE_STYLE}>
                        {t("opportunities.preview.proposalSectionTitle", {}, {
                          default: "Proposal",
                        })}
                      </h4>

                      {opp.description ? (
                        <PreviewSection
                          title={t("opportunities.preview.aboutTitle", {}, {
                            default: "About this opportunity",
                          })}
                        >
                          <div style={ANSWER_BOX_STYLE}>
                            <ReadOnlyTipTap
                              dangerouslySetInnerHTML={{ __html: opp.description }}
                            />
                          </div>
                        </PreviewSection>
                      ) : null}

                      {intakeFormLoading && intakeFormDefinitionId ? (
                        <p style={{ margin: 0, color: "#5f6871" }}>
                          {t("opportunities.preview.loading", {}, {
                            default: "Loading opportunity…",
                          })}
                        </p>
                      ) : null}

                      {showIntakeDefinitionForm ? (
                        <DefinitionForm
                          definitionId={intakeFormDefinitionId}
                          proposalEntryFormDefinitionId={intakeFormDefinitionId}
                          entity={opp}
                          viewerRoles={PREVIEW_VIEWER_ROLES}
                          locale={router.locale}
                          onSubmit={async () => {}}
                          readOnly
                          hideSaveButton
                          hideUnansweredFields
                        />
                      ) : null}

                      {showLegacyProposalBlocks ? (
                        <PreviewSection
                          title={overviewLabel(
                            "title",
                            "Overview of Capstone Project Proposal",
                          )}
                        >
                          <div style={{ display: "grid", gap: 16 }}>
                            <TextBlock
                              label={overviewLabel("relevance", "Relevance to CUSP")}
                              value={proposal.relevance}
                            />
                            <TextBlock
                              label={overviewLabel(
                                "requiresSpecialResources",
                                "Special resources required",
                              )}
                              value={yesNoLabel(proposal.requiresSpecialResources)}
                            />
                            <TextBlock
                              label={overviewLabel(
                                "specialResourcesNotes",
                                "Special resources notes",
                              )}
                              value={proposal.specialResourcesNotes}
                            />
                            <TextBlock
                              label={overviewLabel(
                                "datasetProvision",
                                "Dataset provision",
                              )}
                              value={formatMultiOptions(
                                proposal.datasetProvision,
                                "datasetProvisionOptions",
                              )}
                            />
                            {proposal.datasetProvisionOther ? (
                              <TextBlock
                                label={overviewLabel(
                                  "datasetProvisionOther",
                                  "Other datasets",
                                )}
                                value={proposal.datasetProvisionOther}
                              />
                            ) : null}
                            <TextBlock
                              label={overviewLabel(
                                "expectedDeliverables",
                                "Expected deliverables",
                              )}
                              value={[
                                formatMultiOptions(
                                  proposal.expectedDeliverables,
                                  "deliverableOptions",
                                ),
                                proposal.expectedDeliverablesOther,
                              ]
                                .filter(Boolean)
                                .join(" — ")}
                            />
                            <TextBlock
                              label={overviewLabel(
                                "anticipatedObstacles",
                                "Anticipated obstacles",
                              )}
                              value={proposal.anticipatedObstacles}
                            />
                            <TextBlock
                              label={overviewLabel(
                                "fieldResearchRequired",
                                "Field research required",
                              )}
                              value={overviewOptionLabel(
                                "fieldResearchOptions",
                                proposal.fieldResearchRequired,
                              )}
                            />
                            <TextBlock
                              label={overviewLabel(
                                "fieldResearchTravelDetails",
                                "Field research details",
                              )}
                              value={proposal.fieldResearchTravelDetails}
                            />
                            <TextBlock
                              label={overviewLabel(
                                "requiredSoftware",
                                "Required software",
                              )}
                              value={formatMultiOptions(
                                proposal.requiredSoftware,
                                "softwareOptions",
                              )}
                            />
                            {proposal.requiredSoftwareOther ? (
                              <TextBlock
                                label={overviewLabel(
                                  "requiredSoftwareOther",
                                  "Other software",
                                )}
                                value={proposal.requiredSoftwareOther}
                              />
                            ) : null}
                            <TextBlock
                              label={overviewLabel(
                                "requiredHardware",
                                "Required hardware",
                              )}
                              value={formatMultiOptions(
                                proposal.requiredHardware,
                                "hardwareOptions",
                              )}
                            />
                            {proposal.requiredHardwareOther ? (
                              <TextBlock
                                label={overviewLabel(
                                  "requiredHardwareOther",
                                  "Other hardware",
                                )}
                                value={proposal.requiredHardwareOther}
                              />
                            ) : null}
                            <TextBlock
                              label={overviewLabel(
                                "additionalNotes",
                                "Additional notes",
                              )}
                              value={proposal.additionalNotes}
                            />
                            <TextBlock
                              label={overviewLabel(
                                "internshipInterest",
                                "Internship interest",
                              )}
                              value={overviewOptionLabel(
                                "internshipInterestOptions",
                                proposal.internshipInterest,
                              )}
                            />
                          </div>
                        </PreviewSection>
                      ) : null}
                    </div>
                  ) : null}

                  {(opp.scopeDescription ||
                    opp.potentialActivities ||
                    opp.specificSkills) && (
                    <PreviewSection
                      title={tConnect(
                        "opportunityEditor.followUpQuestionnaire.title",
                        {},
                        { default: "Follow-up questionnaire" },
                      )}
                    >
                      <div style={{ display: "grid", gap: 16 }}>
                        <TextBlock
                          label={tConnect(
                            "opportunityEditor.finalScope.scopeDescription",
                            {},
                            { default: "Scope of the project" },
                          )}
                          value={opp.scopeDescription}
                        />
                        <TextBlock
                          label={tConnect(
                            "opportunityEditor.followUpQuestionnaire.potentialActivities",
                            {},
                            { default: "Potential activities" },
                          )}
                          value={opp.potentialActivities}
                        />
                        <TextBlock
                          label={tConnect(
                            "opportunityEditor.followUpQuestionnaire.specificSkills",
                            {},
                            {
                              default: "Specific skills or qualifications",
                            },
                          )}
                          value={opp.specificSkills}
                        />
                      </div>
                    </PreviewSection>
                  )}

                  {opp.ratings?.length > 0 ? (
                    <PreviewSection
                      title={t("opportunities.preview.ratingsTitle", {}, {
                        default: "What past participants said",
                      })}
                    >
                      <div style={{ display: "grid", gap: 10 }}>
                        {opp.ratings.map((rating) => (
                          <div
                            key={rating.id}
                            style={{
                              display: "grid",
                              gap: 6,
                              padding: 14,
                              borderRadius: 10,
                              background: "var(--MH-Theme-Tertiary-Lighter, #f4f8f7)",
                              border: "1px solid var(--MH-Theme-Primary-Medium, #a3d6db)",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: 8,
                                flexWrap: "wrap",
                              }}
                            >
                              <span style={{ fontWeight: 600, color: "var(--MH-Theme-Neutrals-Black, #171717)", fontSize: 13 }}>
                                {displayName(rating.rater)}
                              </span>
                              <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                                <Stars value={rating.opportunityRating} />
                                <span style={{ color: "var(--MH-Theme-Neutrals-Dark, #5f6871)", fontSize: 12 }}>
                                  {formatDate(rating.createdAt)}
                                </span>
                              </div>
                            </div>
                            {rating.feedback ? (
                              <p style={{ ...BODY_TEXT_STYLE, margin: 0 }}>{rating.feedback}</p>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </PreviewSection>
                  ) : null}
                </div>
              ) : null}

              {resolvedTab === OPPORTUNITY_PREVIEW_TABS.people ? (
                <div style={{ display: "grid", gap: 16 }}>
                  {opp.organization || opp.mentor ? (
                    <PeopleGrid>
                      {opp.organization ? (
                        <OrganizationConnectCard org={opp.organization} />
                      ) : null}
                      {opp.mentor ? (
                        <ConnectProfileCard user={user} profile={opp.mentor} />
                      ) : null}
                    </PeopleGrid>
                  ) : (
                    <p style={BODY_TEXT_STYLE}>
                      {t("opportunities.preview.peopleEmpty", {}, {
                        default: "No organization or mentor details are available yet.",
                      })}
                    </p>
                  )}

                  {(opp.guidelinesAcknowledged ||
                    opp.sponsorIsMentor != null ||
                    (!opp.sponsorIsMentor && opp.mentorNotes)) ? (
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 12,
                        alignItems: "flex-start",
                      }}
                    >
                      {opp.guidelinesAcknowledged ? (
                        <MetaItem
                          label={t("opportunities.preview.guidelinesAcknowledged", {}, {
                            default: "Guidelines acknowledged",
                          })}
                          value={
                            opp.guidelinesAcknowledgedAt
                              ? formatDate(opp.guidelinesAcknowledgedAt)
                              : t("opportunities.preview.yes", {}, { default: "Yes" })
                          }
                          style={{
                            background: "var(--MH-Theme-Primary-Light, #def8fb)",
                            border: "1px solid var(--MH-Theme-Primary-Medium, #a3d6db)",
                          }}
                        />
                      ) : null}
                      {opp.sponsorIsMentor != null ? (
                        <MetaItem
                          label={t("opportunities.preview.sponsorIsMentor", {}, {
                            default: "Sponsor is mentor",
                          })}
                          value={
                            opp.sponsorIsMentor
                              ? t("opportunities.preview.yes", {}, { default: "Yes" })
                              : t("opportunities.preview.no", {}, { default: "No" })
                          }
                        />
                      ) : null}
                      {!opp.sponsorIsMentor && opp.mentorNotes ? (
                        <div style={{ flex: "1 1 240px", minWidth: 0 }}>
                          <TextBlock
                            label={t("opportunities.preview.mentorNotes", {}, {
                              default: "Mentor notes",
                            })}
                            value={opp.mentorNotes}
                          />
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {activeFollowUpForm ? (
                <OpportunityFollowUpFormPanel
                  opportunity={opp}
                  formMeta={activeFollowUpForm}
                  readOnly
                  hideSaveButton
                />
              ) : null}
            </div>
              </ContentPane>
              {showChatPane ? (
                <ChatPane>
                  <ChatPaneTitle>
                    {tConnect("reviewThread.title", {}, {
                      default: "Review conversation",
                    })}
                  </ChatPaneTitle>
                  <ChatThreadWrap>
                    <OpportunityReviewNotesThread
                      opportunityId={opp.id}
                      roundId={activeRoundId}
                      notes={roundReviewNotes}
                      viewerId={viewerId}
                      canCreate
                      messageKind={REVIEW_NOTE_KIND.REVIEWER_COMMENT}
                      mode="teacher"
                      refetchQueries={returnRefetchQueries}
                      showTitle={false}
                      layout="panel"
                    />
                  </ChatThreadWrap>
                </ChatPane>
              ) : null}
            </SplitShell>
          ) : null}
      </Modal>
      <ReturnOpportunityModal
        open={returnModalOpen}
        onClose={() => setReturnModalOpen(false)}
        onSuccess={handleReturnSuccess}
        opportunityId={opportunityId}
        roundId={activeRoundId}
        mentorId={opp?.mentor?.id}
        refetchQueries={returnRefetchQueries}
      />
    </>
  );
}
