import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";
import clsx from "clsx";
import styled from "styled-components";

import Button from "../../../../DesignSystem/Button";
import Chip from "../../../../DesignSystem/Chip";
import MessageCard from "../../../../DesignSystem/MessageCard";
import Modal from "../../../../DesignSystem/Modal";
import { EXPLORE_OPPORTUNITY_DETAIL } from "../../../../Queries/Opportunity";
import { GET_CONNECT_ROUND, NETWORK_OPPORTUNITIES_FOR_ROUND } from "../../../../Queries/ConnectRound";
import { FORM_DEFINITION_BY_ID } from "../../../../Queries/FormDefinition";
import { MARK_OPPORTUNITY_REVIEW_NOTES_READ } from "../../../../Mutations/OpportunityReviewNote";
import { ReadOnlyTipTap } from "../../../../TipTap/ReadOnlyTipTap";
import { hydrateProposalInputs } from "../../../Connect/Opportunities/OpportunityProposalConfig";
import ReturnOpportunityModal from "../../../Connect/ReturnOpportunityModal";
import OpportunityReviewNotesThread from "../../../Connect/OpportunityReviewNotesThread";
import OpportunityFollowUpFormPanel from "../../../SponsorConnect/Opportunities/OpportunityFollowUpFormPanel";
import DefinitionForm from "../../../../Forms/DefinitionForm";
import ReviewCard from "../../../../Forms/DefinitionForm/ReviewCard";
import ReviewField from "../../../../Forms/DefinitionForm/ReviewField";
import { isReturnableOpportunityStatus } from "../../../Connect/returnOpportunityUtils";
import ConnectProfileCard from "../../../Connect/ConnectProfileCard";
import { CARD_WIDTH } from "../../../Connect/ConnectBrowseLayout";
import OrganizationConnectCard from "../../../Connect/Organizations/OrganizationConnectCard";
import { useUser } from "../../../../Utils/Access/User";
import {
  getUnreadSponsorReplyNotes,
  REVIEW_NOTE_KIND,
} from "../../../../../lib/reviewThreadRound";
import {
  OPPORTUNITY_PREVIEW_TABS,
  formTabKey,
  parseFormTabKey,
  resolveOpportunityPreviewTab,
  resolvePreviewFollowUpForms,
} from "../../../../../lib/opportunityPreviewTabs";
import {
  getIntakeProposalFormDefinitionId,
  isProposalFormAnswerComplete,
} from "../../../../../lib/opportunityProposalData";

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

const ChipSelectorRow = styled.div`
  position: sticky;
  top: -4px;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  width: calc(100% + ${(p) => (p.$chatOpen ? "40px" : "24px")});
  min-width: 0;
  margin-left: -24px;
  /* Breathing room under frosted header; keep bottom pad for chip row */
  padding: 8px ${(p) => (p.$chatOpen ? "16px" : "0")} 8px 24px;
  box-sizing: border-box;
  border-bottom: 1px solid rgba(211, 218, 224, 0.45);
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(12px) saturate(1.2);
  -webkit-backdrop-filter: blur(12px) saturate(1.2);
`;

const FieldsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px 16px;
  width: 100%;
  min-width: 0;

  > * {
    min-width: 0;
  }
`;

const FormStatusText = styled.p`
  margin: 0;
  font-size: 13px;
  line-height: 1.4;
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
`;

const SplitShell = styled.div`
  display: grid;
  grid-template-columns: ${(p) => (p.$chatOpen ? "minmax(0, 1fr) minmax(300px, 400px)" : "minmax(0, 1fr)")};
  gap: 0;
  min-height: 0;
  flex: 1;
  height: 100%;

  @media (max-width: 900px) {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: ${(p) => (p.$chatOpen ? "minmax(0, 1fr) minmax(240px, 40%)" : "minmax(0, 1fr)")};
  }
`;

/**
 * Clearance under DesignSystem Modal frostedChrome overlays.
 * Modal measures title/actions and sets --ds-modal-frosted-pad-top/bottom
 * so multi-line titles do not cover sticky chip rows.
 */
const FROSTED_CHROME_PAD_TOP = "var(--ds-modal-frosted-pad-top, 64px)";
const FROSTED_CHROME_PAD_BOTTOM = "var(--ds-modal-frosted-pad-bottom, 96px)";

const ContentPane = styled.div`
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  padding-top: ${FROSTED_CHROME_PAD_TOP};
  padding-bottom: ${FROSTED_CHROME_PAD_BOTTOM};
  padding-right: ${(p) => (p.$chatOpen ? "16px" : "0")};
  scrollbar-width: none;
  -ms-overflow-style: none;
  box-sizing: border-box;

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
  gap: 12px;
  padding-top: ${FROSTED_CHROME_PAD_TOP};
  padding-bottom: ${FROSTED_CHROME_PAD_BOTTOM};
  padding-left: 16px;
  padding-right: 16px;
  border-left: 1px solid var(--MH-Theme-Neutrals-Light, #d3dae0);
  background: transparent;
  box-sizing: border-box;

  @media (max-width: 900px) {
    border-left: none;
    border-top: 1px solid var(--MH-Theme-Neutrals-Light, #d3dae0);
    padding-left: 0;
    padding-right: 0;
    padding-top: 16px;
    padding-bottom: ${FROSTED_CHROME_PAD_BOTTOM};
  }
`;

const ChatPaneTitle = styled.h3`
  margin: 0;
  flex-shrink: 0;
  font-family: Inter, sans-serif;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--MH-Theme-Neutrals-Black, #171717);
`;

const ChatThreadWrap = styled.div`
  flex: 1 1 0;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

/**
 * The People tab keeps the real Connect card rather than inventing a shape that
 * exists on one screen. Each entity sits in a tinted panel that supplies the
 * heading and, for the contact, the opportunity fields they attested to — so
 * the card itself renders exactly as it does on the browse pages.
 */
const PeopleColumns = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  align-items: start;

  @media (max-width: 900px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const PeoplePanel = styled.section`
  display: grid;
  /* Heading and card sit centred; only the meta grid below stretches (see the
     rule at the bottom), since its fields need the panel's full width. */
  justify-items: center;
  gap: 12px;
  min-width: 0;
  padding: 16px;
  border-radius: 12px;
  background: var(--MH-Theme-Primary-Lighter, #f4f8f7);
  box-sizing: border-box;

  h4 {
    margin: 0;
    font-family: "Inter", sans-serif;
    font-weight: 600;
    font-size: 16px;
    line-height: 24px;
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }

  /* Hold the card to its browse width so it reads as the same object here. */
  > article {
    max-width: ${CARD_WIDTH};
  }

  /* Meta fields span the panel rather than the card. */
  > *:not(article):not(h4) {
    justify-self: stretch;
    min-width: 0;
  }
`;

const TitleRow = styled.span`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  min-width: 0;
  flex-wrap: nowrap;
`;

const TitleText = styled.span`
  flex: 1 1 auto;
  min-width: 0;
  overflow-wrap: anywhere;
  word-break: break-word;
  white-space: normal;
`;

const HeaderActions = styled.span`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
  margin-left: auto;
  align-self: flex-start;
`;

const MessagesToggleWrap = styled.div`
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

const META_ITEM_STYLE = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: 6,
  minWidth: 0,
  width: "100%",
};

const META_LABEL_STYLE = {
  fontSize: 14,
  fontWeight: 600,
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
};

const META_VALUE_STYLE = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid var(--MH-Theme-Neutrals-Medium, #a1a1a1)",
  background: "var(--MH-Theme-Neutrals-Lighter, #f3f3f3)",
  fontSize: 14,
  fontWeight: 400,
  lineHeight: 1.4,
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
  minWidth: 0,
  overflowWrap: "anywhere",
  whiteSpace: "pre-wrap",
};

const FieldItemShell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  width: 100%;
`;

const FIELD_LABEL_STYLE = {
  fontSize: 14,
  fontWeight: 600,
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
};

const FIELD_VALUE_STYLE = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid var(--MH-Theme-Neutrals-Medium, #a1a1a1)",
  background: "var(--MH-Theme-Neutrals-Lighter, #f3f3f3)",
  fontSize: 14,
  fontWeight: 400,
  lineHeight: 1.4,
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
};

/** Highlight keeps a border weight cue plus text; color is not the only signal. */
const FIELD_VALUE_HIGHLIGHT_STYLE = {
  background: "var(--MH-Theme-Neutrals-Light, #e6e6e6)",
  border: "2px solid var(--MH-Theme-Neutrals-Dark, #6a6a6a)",
  fontWeight: 600,
};

/** Messages: tonal variant with tertiary fill. */
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
  color: "var(--MH-Theme-Neutrals-Dark, #6a6a6a)",
  fontSize: 14,
  lineHeight: 1.6,
  whiteSpace: "pre-wrap",
};

const MUTED_TEXT_STYLE = {
  margin: 0,
  color: "var(--MH-Theme-Neutrals-Dark, #6a6a6a)",
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

function MetaItem({ label, value, style, valueStyle }) {
  if (value == null || value === "") return null;
  return (
    <div style={style ? { ...META_ITEM_STYLE, ...style } : META_ITEM_STYLE}>
      <div style={META_LABEL_STYLE}>{label}</div>
      <div
        style={
          valueStyle
            ? { ...META_VALUE_STYLE, ...valueStyle }
            : META_VALUE_STYLE
        }
      >
        {value}
      </div>
    </div>
  );
}

/**
 * Guidelines / mentor-role fields for the sponsor profile on this opportunity.
 * These sit inside the contact's own panel, so the value carries no name — the
 * card directly above it already says who acknowledged.
 */
function SponsorProfileOpportunityMeta({ opportunity, t }) {
  if (!opportunity) return null;

  const showGuidelines = !!opportunity.guidelinesAcknowledged;
  const showSponsorIsMentor = opportunity.sponsorIsMentor != null;
  const showMentorNotes =
    !opportunity.sponsorIsMentor && !!opportunity.mentorNotes;

  if (!showGuidelines && !showSponsorIsMentor && !showMentorNotes) {
    return null;
  }

  const acknowledgedAt = formatDate(opportunity.guidelinesAcknowledgedAt);
  const guidelinesValue =
    acknowledgedAt || t("opportunities.preview.yes", {}, { default: "Yes" });

  return (
    <FieldsGrid>
      {showGuidelines ? (
        <MetaItem
          label={t("opportunities.preview.guidelinesAcknowledged", {}, {
            default: "Guidelines acknowledged",
          })}
          value={guidelinesValue}
          valueStyle={{
            background: "var(--MH-Theme-Neutrals-Light, #e6e6e6)",
            border: "2px solid var(--MH-Theme-Neutrals-Dark, #6a6a6a)",
            fontWeight: 600,
          }}
        />
      ) : null}
      {showSponsorIsMentor ? (
        <MetaItem
          label={t("opportunities.preview.sponsorIsMentor", {}, {
            default: "Sponsor is mentor",
          })}
          value={
            opportunity.sponsorIsMentor
              ? t("opportunities.preview.yes", {}, { default: "Yes" })
              : t("opportunities.preview.no", {}, { default: "No" })
          }
        />
      ) : null}
      {showMentorNotes ? (
        <div style={{ gridColumn: "1 / -1", minWidth: 0 }}>
          <ReviewField
            label={t("opportunities.preview.mentorNotes", {}, {
              default: "Mentor notes",
            })}
            value={opportunity.mentorNotes}
          />
        </div>
      ) : null}
    </FieldsGrid>
  );
}

function FieldItem({ label, value, highlight, className }) {
  if (value == null || value === "") return null;
  const valueStyle = {
    ...FIELD_VALUE_STYLE,
    ...(highlight ? FIELD_VALUE_HIGHLIGHT_STYLE : null),
  };
  return (
    <FieldItemShell className={clsx(className)}>
      <span style={FIELD_LABEL_STYLE}>{label}</span>
      <span style={valueStyle}>{value}</span>
    </FieldItemShell>
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

function Stars({ value }) {
  const v = Math.round(value || 0);
  return (
    <span aria-label={`${v} of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          style={{
            color:
              n <= v
                ? "var(--MH-Theme-Neutrals-Black, #171717)"
                : "var(--MH-Theme-Neutrals-Dark, #6a6a6a)",
            fontSize: 14,
          }}
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
  /** Hide workflow status chip (e.g. student read-only class view). */
  hideStatus = false,
}) {
  const { t } = useTranslation("classes");
  const { t: tConnect } = useTranslation("connect");
  const router = useRouter();
  const { user } = useUser();
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(OPPORTUNITY_PREVIEW_TABS.detail);
  const [chatOpen, setChatOpen] = useState(false);
  const [toggleFlash, setToggleFlash] = useState(null);
  const markedReadNoteIdsRef = useRef(new Set());

  const isInMatchingRound =
    opportunityId &&
    matchingRoundContext?.selectedOpportunityIds?.includes(opportunityId);
  const isToggling =
    matchingRoundContext?.togglingOpportunityId === opportunityId;
  const canManage = matchingRoundContext?.canManageOpportunities;
  const showNoRoundHint = matchingRoundContext?.noRoundForNetwork;
  const showMatchingRoundSection = Boolean(matchingRoundContext);

  const matchingRoundTitle =
    matchingRoundContext?.roundTitle ||
    t("opportunities.matchingRound.title", {}, { default: "Matching round" });

  const handleToggleMatchingRound = async () => {
    if (!opportunityId || !canManage || isToggling) return;
    const wasInRound = Boolean(isInMatchingRound);
    const ok = await matchingRoundContext?.toggleOpportunity?.(opportunityId);
    if (!ok) return;
    setToggleFlash(
      wasInRound
        ? t(
            "opportunities.preview.matchingRound.removedFromRound",
            { title: matchingRoundTitle },
            { default: "Removed from {{title}}." },
          )
        : t(
            "opportunities.preview.matchingRound.addedToRound",
            { title: matchingRoundTitle },
            { default: "Added to {{title}}." },
          ),
    );
  };

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
      setToggleFlash(null);
      return;
    }
    const nextTab =
      initialTab === OPPORTUNITY_PREVIEW_TABS.chat
        ? OPPORTUNITY_PREVIEW_TABS.detail
        : initialTab || OPPORTUNITY_PREVIEW_TABS.detail;
    setActiveTab(nextTab);
    setChatOpen(false);
    setToggleFlash(null);
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

  const messagesToggleButton = showChat ? (
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
  ) : null;

  const modalTitleNode = (
    <TitleRow>
      <TitleText>{modalTitle}</TitleText>
      <HeaderActions>
        {statusLabel && !hideStatus ? (
          <Chip label={statusLabel} shape="square" />
        ) : null}
        {messagesToggleButton}
      </HeaderActions>
    </TitleRow>
  );

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

  const opportunityFormLabel = t("opportunities.preview.tabs.detail", {}, {
    default: "Original intake form",
  });
  const peopleTabLabel = t("opportunities.preview.tabs.peopleAndOrganization", {}, {
    default: "People & Organization",
  });
  const followUpFallbackLabel = tConnect(
    "opportunityEditor.tabs.followUpFallback",
    {},
    { default: "Follow-up form" },
  );

  const resolveFormStatusLabel = (kind) => {
    if (kind === "intake") {
      return tConnect("opportunityEditor.tabs.originalIntake", {}, {
        default: "Original intake",
      });
    }
    if (kind === "complete") {
      return tConnect("opportunityEditor.tabs.complete", {}, {
        default: "Complete",
      });
    }
    return tConnect("opportunityEditor.tabs.incomplete", {}, {
      default: "Incomplete",
    });
  };

  const selectorChips = [
    {
      key: OPPORTUNITY_PREVIEW_TABS.detail,
      label: opportunityFormLabel,
    },
    ...followUpForms.map((form) => ({
      key: formTabKey(form.id),
      label: form.title || followUpFallbackLabel,
    })),
    {
      key: OPPORTUNITY_PREVIEW_TABS.people,
      label: peopleTabLabel,
      leading: (
        <img
          src="/assets/connect/group.svg"
          alt=""
          aria-hidden
          width={20}
          height={16}
        />
      ),
    },
  ];

  const selectPreviewTab = (tabKey) => {
    setActiveTab(tabKey);
  };

  const deselectPreviewTab = () => {
    setActiveTab(OPPORTUNITY_PREVIEW_TABS.detail);
  };

  const activeFormStatusLabel = (() => {
    if (resolvedTab === OPPORTUNITY_PREVIEW_TABS.detail) {
      return resolveFormStatusLabel("intake");
    }
    if (activeFollowUpForm) {
      const complete = isProposalFormAnswerComplete(
        opp?.proposalData,
        activeFollowUpForm.id,
        opp?.videoFile,
      );
      return resolveFormStatusLabel(complete ? "complete" : "incomplete");
    }
    return null;
  })();

  const modalActions = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        gap: 12,
        width: "100%",
      }}
    >
      {toggleFlash ? (
        <MessageCard
          variant="success"
          message={toggleFlash}
          onClose={() => setToggleFlash(null)}
          closeAriaLabel={t("opportunities.preview.flashDismiss", {}, {
            default: "Dismiss",
          })}
        />
      ) : null}
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
            <span style={{ fontSize: 13, ...MUTED_TEXT_STYLE }}>
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
        frostedChrome
        bodyStyle={{
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
        }}
      >
          {loading && !opp ? (
            <p
              style={{
                ...MUTED_TEXT_STYLE,
                paddingTop: FROSTED_CHROME_PAD_TOP,
                paddingBottom: FROSTED_CHROME_PAD_BOTTOM,
              }}
            >
              {t("opportunities.preview.loading", {}, { default: "Loading opportunity…" })}
            </p>
          ) : null}

          {!loading && !opp ? (
            <p
              style={{
                ...MUTED_TEXT_STYLE,
                paddingTop: FROSTED_CHROME_PAD_TOP,
                paddingBottom: FROSTED_CHROME_PAD_BOTTOM,
              }}
            >
              {t("opportunities.preview.notFound", {}, {
                default: "Opportunity not found, or no longer available.",
              })}
            </p>
          ) : null}

          {opp ? (
            <SplitShell $chatOpen={showChatPane}>
              <ContentPane $chatOpen={showChatPane}>
            <div
              style={{
                display: "grid",
                gap: 8,
                color: "var(--MH-Theme-Neutrals-Black, #171717)",
              }}
            >
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

              <ChipSelectorRow
                $chatOpen={showChatPane}
                role="group"
                aria-label={t("opportunities.preview.tabsAria", {}, {
                  default: "Opportunity sections",
                })}
              >
                {selectorChips.map((chip) => {
                  const isSelected = resolvedTab === chip.key;
                  return (
                    <Chip
                      key={chip.key}
                      label={chip.label}
                      shape="square"
                      style={{
                        padding: "16px",
                      }}
                      selected={isSelected}
                      pressed={isSelected}
                      leading={chip.leading}
                      onClick={() => selectPreviewTab(chip.key)}
                      ariaLabel={chip.label}
                    />
                  );
                })}
              </ChipSelectorRow>

              {resolvedTab === OPPORTUNITY_PREVIEW_TABS.detail ? (
                <div style={{ display: "grid", gap: 24 }}>
                  {opp.shortDescription ? (
                    <p
                      style={{
                        margin: 0,
                        color: "var(--MH-Theme-Neutrals-Dark, #6a6a6a)",
                        fontSize: 15,
                        lineHeight: 1.5,
                      }}
                    >
                      {opp.shortDescription}
                    </p>
                  ) : null}

                  <PreviewSection
                    title={t("opportunities.preview.summaryTitle", {}, {
                      default: "Summary",
                    })}
                  >
                    <FieldsGrid>
                      {opp.requestsAppointment ? (
                        <FieldItem
                          label={t("opportunities.preview.requestsAppointment", {}, {
                            default: "Appointment requested",
                          })}
                          value={t("opportunities.preview.yes", {}, { default: "Yes" })}
                          highlight
                        />
                      ) : null}
                      <FieldItem
                        label={t("opportunities.preview.capacity", {}, { default: "Capacity" })}
                        value={opp.studentCapacity || 1}
                      />
                      <FieldItem
                        label={t("opportunities.preview.teamSize", {}, { default: "Team size" })}
                        value={teamSizeLabel}
                      />
                      <FieldItem
                        label={t("opportunities.preview.available", {}, { default: "Available" })}
                        value={from || to ? `${from || "—"} → ${to || "—"}` : null}
                      />
                      <FieldItem
                        label={t("opportunities.preview.timeCommitment", {}, {
                          default: "Time commitment",
                        })}
                        value={opp.timeCommitment}
                      />
                      <FieldItem
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
                        <FieldItem
                          label={t("opportunities.preview.publicRating", {}, {
                            default: "Public rating",
                          })}
                          value={`${opp.publicRatingAverage?.toFixed(1)} (${opp.publicRatingCount})`}
                        />
                      ) : null}
                    </FieldsGrid>
                  </PreviewSection>

                  {activeFormStatusLabel ? (
                    <FormStatusText>
                      {t(
                        "opportunities.preview.formStatusLabel",
                        { status: activeFormStatusLabel },
                        { default: "Status: {{status}}" },
                      )}
                    </FormStatusText>
                  ) : null}
                  {(gradeLevelsLabel ||
                    classTypesLabel ||
                    groupFormatLabel ||
                    allowsTeamPreferencesLabel) && (
                    <ReviewCard
                      title={t("opportunities.preview.preferences", {}, {
                        default: "Student preferences",
                      })}
                    >
                      <ReviewField
                        label={tConnect("mentorPreferences.gradeLevel.title", {}, {
                          default: "Grade level",
                        })}
                        value={gradeLevelsLabel}
                      />
                      <ReviewField
                        label={tConnect("mentorPreferences.classType.title", {}, {
                          default: "Class type",
                        })}
                        value={classTypesLabel}
                      />
                      <ReviewField
                        label={tConnect("opportunityEditor.groupFormat", {}, {
                          default: "Group format",
                        })}
                        value={groupFormatLabel}
                      />
                      <ReviewField
                        label={t("opportunities.preview.allowsTeamPreferences", {}, {
                          default: "Team preferences allowed",
                        })}
                        value={allowsTeamPreferencesLabel}
                      />
                    </ReviewCard>
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
                        <ReviewCard
                          title={t("opportunities.preview.aboutTitle", {}, {
                            default: "About this opportunity",
                          })}
                        >
                          <ReviewField>
                            <ReadOnlyTipTap
                              dangerouslySetInnerHTML={{ __html: opp.description }}
                            />
                          </ReviewField>
                        </ReviewCard>
                      ) : null}

                      {intakeFormLoading && intakeFormDefinitionId ? (
                        <p style={MUTED_TEXT_STYLE}>
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
                        />
                      ) : null}

                      {showLegacyProposalBlocks ? (
                        <ReviewCard
                          title={overviewLabel(
                            "title",
                            "Overview of Capstone Project Proposal",
                          )}
                        >
                          <ReviewField
                            label={overviewLabel("relevance", "Relevance to CUSP")}
                            value={proposal.relevance}
                          />
                          <ReviewField
                            label={overviewLabel(
                              "requiresSpecialResources",
                              "Special resources required",
                            )}
                            value={yesNoLabel(proposal.requiresSpecialResources)}
                          />
                          <ReviewField
                            label={overviewLabel(
                              "specialResourcesNotes",
                              "Special resources notes",
                            )}
                            value={proposal.specialResourcesNotes}
                          />
                          <ReviewField
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
                            <ReviewField
                              label={overviewLabel(
                                "datasetProvisionOther",
                                "Other datasets",
                              )}
                              value={proposal.datasetProvisionOther}
                            />
                          ) : null}
                          <ReviewField
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
                          <ReviewField
                            label={overviewLabel(
                              "anticipatedObstacles",
                              "Anticipated obstacles",
                            )}
                            value={proposal.anticipatedObstacles}
                          />
                          <ReviewField
                            label={overviewLabel(
                              "fieldResearchRequired",
                              "Field research required",
                            )}
                            value={overviewOptionLabel(
                              "fieldResearchOptions",
                              proposal.fieldResearchRequired,
                            )}
                          />
                          <ReviewField
                            label={overviewLabel(
                              "fieldResearchTravelDetails",
                              "Field research details",
                            )}
                            value={proposal.fieldResearchTravelDetails}
                          />
                          <ReviewField
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
                            <ReviewField
                              label={overviewLabel(
                                "requiredSoftwareOther",
                                "Other software",
                              )}
                              value={proposal.requiredSoftwareOther}
                            />
                          ) : null}
                          <ReviewField
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
                            <ReviewField
                              label={overviewLabel(
                                "requiredHardwareOther",
                                "Other hardware",
                              )}
                              value={proposal.requiredHardwareOther}
                            />
                          ) : null}
                          <ReviewField
                            label={overviewLabel(
                              "additionalNotes",
                              "Additional notes",
                            )}
                            value={proposal.additionalNotes}
                          />
                          <ReviewField
                            label={overviewLabel(
                              "internshipInterest",
                              "Internship interest",
                            )}
                            value={overviewOptionLabel(
                              "internshipInterestOptions",
                              proposal.internshipInterest,
                            )}
                          />
                        </ReviewCard>
                      ) : null}
                    </div>
                  ) : null}

                  {(opp.scopeDescription ||
                    opp.potentialActivities ||
                    opp.specificSkills) && (
                    <ReviewCard
                      title={tConnect(
                        "opportunityEditor.followUpQuestionnaire.title",
                        {},
                        { default: "Follow-up questionnaire" },
                      )}
                    >
                      <ReviewField
                        label={tConnect(
                          "opportunityEditor.finalScope.scopeDescription",
                          {},
                          { default: "Scope of the project" },
                        )}
                        value={opp.scopeDescription}
                      />
                      <ReviewField
                        label={tConnect(
                          "opportunityEditor.followUpQuestionnaire.potentialActivities",
                          {},
                          { default: "Potential activities" },
                        )}
                        value={opp.potentialActivities}
                      />
                      <ReviewField
                        label={tConnect(
                          "opportunityEditor.followUpQuestionnaire.specificSkills",
                          {},
                          {
                            default: "Specific skills or qualifications",
                          },
                        )}
                        value={opp.specificSkills}
                      />
                    </ReviewCard>
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
                              background: "var(--MH-Theme-Neutrals-Lighter, #f3f3f3)",
                              border: "1px solid var(--MH-Theme-Neutrals-Medium, #a1a1a1)",
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
                                <span style={{ color: "var(--MH-Theme-Neutrals-Dark, #6a6a6a)", fontSize: 12 }}>
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
                    <PeopleColumns>
                      {opp.mentor ? (
                        <PeoplePanel>
                          <h4>
                            {t("opportunities.preview.primaryContact", {}, {
                              default: "Primary contact",
                            })}
                          </h4>
                          <ConnectProfileCard
                            user={user}
                            profile={opp.mentor}
                          />
                          <SponsorProfileOpportunityMeta
                            opportunity={opp}
                            t={t}
                          />
                        </PeoplePanel>
                      ) : null}

                      {opp.organization ? (
                        <PeoplePanel>
                          <h4>
                            {t("opportunities.preview.organization", {}, {
                              default: "Organization",
                            })}
                          </h4>
                          <OrganizationConnectCard org={opp.organization} />
                        </PeoplePanel>
                      ) : null}
                    </PeopleColumns>
                  ) : null}

                  {/* Meta without a contact panel to live in — still show it. */}
                  {!opp.mentor ? (
                    <SponsorProfileOpportunityMeta opportunity={opp} t={t} />
                  ) : null}

                  {!opp.organization &&
                  !opp.mentor &&
                  !opp.guidelinesAcknowledged &&
                  opp.sponsorIsMentor == null &&
                  !opp.mentorNotes ? (
                    <p style={BODY_TEXT_STYLE}>
                      {t("opportunities.preview.peopleEmpty", {}, {
                        default: "No organization or mentor details are available yet.",
                      })}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {activeFollowUpForm ? (
                <div style={{ display: "grid", gap: 16 }}>
                  {activeFormStatusLabel ? (
                    <FormStatusText>
                      {t(
                        "opportunities.preview.formStatusLabel",
                        { status: activeFormStatusLabel },
                        { default: "Status: {{status}}" },
                      )}
                    </FormStatusText>
                  ) : null}
                  <OpportunityFollowUpFormPanel
                    opportunity={opp}
                    formMeta={activeFollowUpForm}
                    readOnly
                    hideSaveButton
                  />
                </div>
              ) : null}
            </div>
              </ContentPane>
              {showChatPane ? (
                <ChatPane>
                  {/* <ChatPaneTitle>
                    {tConnect("reviewThread.title", {}, {
                      default: "Review conversation",
                    })}
                  </ChatPaneTitle> */}
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
