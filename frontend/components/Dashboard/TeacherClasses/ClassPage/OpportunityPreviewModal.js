import { useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { Modal } from "semantic-ui-react";
import useTranslation from "next-translate/useTranslation";

import Button from "../../../DesignSystem/Button";
import Chip from "../../../DesignSystem/Chip";
import StyledModal from "../../../styles/StyledModal";
import { EXPLORE_OPPORTUNITY_DETAIL } from "../../../Queries/Opportunity";
import { GET_CONNECT_ROUND, NETWORK_OPPORTUNITIES_FOR_ROUND } from "../../../Queries/ConnectRound";
import { ReadOnlyTipTap } from "../../../TipTap/ReadOnlyTipTap";
import { hydrateProposalInputs } from "../../Connect/Opportunities/OpportunityProposalConfig";
import ReturnOpportunityModal from "../../Connect/ReturnOpportunityModal";
import { isReturnableOpportunityStatus } from "../../Connect/returnOpportunityUtils";

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

function toOptionKey(value) {
  return value.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

const META_ITEM_STYLE = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  width: "auto",
  justifyContent: "space-between",
  padding: "10px 14px",
  borderRadius: 10,
  background: "#f7f9f8",
};

const META_LABEL_STYLE = {
  fontSize: 11,
  color: "#888",
  textTransform: "uppercase",
};

const META_VALUE_STYLE = {
  marginTop: 2,
  fontWeight: 600,
  color: "#171717",
};

const SECTION_TITLE_STYLE = {
  margin: 0,
  fontSize: 16,
  fontWeight: 700,
  color: "#171717",
};

const BODY_TEXT_STYLE = {
  margin: 0,
  color: "#5f6871",
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

function PreviewSection({ title, children }) {
  if (!children) return null;
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <h4 style={SECTION_TITLE_STYLE}>{title}</h4>
      {children}
    </div>
  );
}

const ANSWER_BOX_STYLE = {
  padding: "12px 14px",
  borderRadius: 10,
  background: "#f7f9f8",
};

function TextBlock({ label, value, html = false }) {
  if (!value) return null;
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <strong style={{ fontSize: 14, color: "#171717" }}>{label}</strong>
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

function ProfilePanel({ imageSrc, name, lines = [] }) {
  if (!name) return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        width: "fit-content",
        gap: 14,
        padding: 14,
        borderRadius: 12,
        background: "#f7f9f8",
        border: "1px solid #A1A1A1",
      }}
    >
      {imageSrc ? (
        <img
          src={imageSrc}
          alt=""
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            objectFit: "cover",
            flex: "none",
            boxShadow: "0 0 0 1px #A1A1A1", // outer border using box-shadow
       
          }}
        />
      ) : (
        <span
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "#d3dae0",
            color: "#5f6871",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 600,
            fontSize: 22,
            flex: "none",
          }}
        >
          {name.charAt(0).toUpperCase()}
        </span>
      )}
      <div style={{ display: "grid", gap: 4, minWidth: 0 }}>
        <span style={{ fontWeight: 600, color: "#171717" }}>{name}</span>
        {lines.filter(Boolean).map((line) => (
          <span key={line} style={{ color: "#5f6871", fontSize: 13 }}>
            {line}
          </span>
        ))}
      </div>
    </div>
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
}) {
  const { t } = useTranslation("classes");
  const { t: tConnect } = useTranslation("connect");
  const [returnModalOpen, setReturnModalOpen] = useState(false);

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
  const proposal = useMemo(() => hydrateProposalInputs(opp), [opp]);

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

  const overviewLabel = (key, fallback) =>
    tConnect(`opportunityEditor.overview.${key}`, {}, { default: fallback });

  const overviewOptionLabel = (group, value) => {
    if (!value) return null;
    return tConnect(`opportunityEditor.overview.${group}.${toOptionKey(value)}`, {}, {
      default: value,
    });
  };

  const formatMultiOptions = (values, group) => {
    const list = Array.isArray(values) ? values : [];
    if (!list.length) return null;
    return list.map((value) => overviewOptionLabel(group, value)).join(", ");
  };

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

  const yesNoLabel = (value) =>
    value
      ? overviewOptionLabel("yesNo", value)
      : null;

  return (
    <Modal open={open} onClose={onClose} size="large">
      <Modal.Header>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12}}>
          <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.3, color: "#171717" }}>
            {opp?.title ||
              t("opportunities.networkOpportunitiesTitle", {}, {
                default: "Network opportunities",
              })}
          </div>
          {(mentorName || orgName) && (
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
                      ? () => window.open(mentorProfileUrl, "_blank", "noopener,noreferrer")
                      : undefined
                  }
                  ariaLabel={
                    mentorProfileUrl
                      ? tConnect("profileCard.viewProfile", { name: mentorName }, {
                          default: "View profile of {{name}}",
                        })
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
                      ? () => window.open(orgProfileUrl, "_blank", "noopener,noreferrer")
                      : undefined
                  }
                  ariaLabel={
                    orgProfileUrl
                      ? t("opportunities.preview.viewOrganization", { name: orgName }, {
                          default: "View organization {{name}}",
                        })
                      : undefined
                  }
                />
              ) : null}
            </div>
          )}
        </div>
      </Modal.Header>
      <Modal.Content scrolling>
        <StyledModal>
          {loading && !opp ? (
            <p>{t("opportunities.preview.loading", {}, { default: "Loading opportunity…" })}</p>
          ) : null}

          {!loading && !opp ? (
            <p>
              {t("opportunities.preview.notFound", {}, {
                default: "Opportunity not found, or no longer available.",
              })}
            </p>
          ) : null}

          {opp ? (
            <div style={{ display: "grid", gap: 24 }}>
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

              <PreviewSection
                title={t("opportunities.preview.opportunityDetails", {}, { default: "Opportunity details" })}
              >
              <div
                style={{
                  display: "grid",
                  gap: 12,
                  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                }}
              >
                <MetaItem
                  label={t("opportunities.preview.status", {}, { default: "Status" })}
                  value={statusLabel}
                />
                {opp.requestsAppointment ? (
                  <MetaItem
                    label={t("opportunities.preview.requestsAppointment", {}, {
                      default: "Appointment requested",
                    })}
                    value={t("opportunities.preview.yes", {}, { default: "Yes" })}
                    style={{ background: "#FDF2D0" }}
                  />
                ) : null}
                <MetaItem
                  label={t("opportunities.preview.available", {}, { default: "Available" })}
                  value={from || to ? `${from || "—"} → ${to || "—"}` : null}
                />
                <MetaItem
                  label={t("opportunities.preview.timeCommitment", {}, { default: "Time commitment" })}
                  value={opp.timeCommitment}
                />
                <MetaItem
                  label={t("opportunities.preview.capacity", {}, { default: "Capacity" })}
                  value={opp.studentCapacity || 1}
                />
                <MetaItem
                  label={t("opportunities.preview.teamSize", {}, { default: "Team size" })}
                  value={
                    opp.teamSize > 1
                      ? t(
                          "opportunities.preview.teamSizeTeam",
                          { size: opp.teamSize },
                          { default: "Team of {{size}}" },
                        )
                      : t("opportunities.preview.teamSizeSolo", {}, { default: "Solo" })
                  }
                />
                <MetaItem
                  label={t("opportunities.preview.projectCategory", {}, { default: "Project category" })}
                  value={
                    categoryLabel
                      ? opp.projectCategory === "other" && opp.projectCategoryOther
                        ? `${categoryLabel}: ${opp.projectCategoryOther}`
                        : categoryLabel
                      : opp.projectCategoryOther
                  }
                />
                <MetaItem
                  label={t("opportunities.preview.allowsTeamPreferences", {}, {
                    default: "Team preferences allowed",
                  })}
                  value={
                    opp.allowsTeamPreferences == null
                      ? null
                      : opp.allowsTeamPreferences
                        ? t("opportunities.preview.yes", {}, { default: "Yes" })
                        : t("opportunities.preview.no", {}, { default: "No" })
                  }
                />
                {opp.publicRatingCount > 0 ? (
                  <MetaItem
                    label={t("opportunities.preview.publicRating", {}, { default: "Public rating" })}
                    value={`${opp.publicRatingAverage?.toFixed(1)} (${opp.publicRatingCount})`}
                  />
                ) : null}
              </div>
              </PreviewSection>
              {(gradeLevelsLabel || classTypesLabel || groupFormatLabel) && (
                <PreviewSection
                  title={t("opportunities.preview.preferences", {}, { default: "Student preferences" })}
                >
                  <div
                    style={{
                      display: "grid",
                      gap: 12,
                      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    }}
                  >
                    <MetaItem
                      label={tConnect("mentorPreferences.gradeLevel.title", {}, { default: "Grade level" })}
                      value={gradeLevelsLabel}
                    />
                    <MetaItem
                      label={tConnect("mentorPreferences.classType.title", {}, { default: "Class type" })}
                      value={classTypesLabel}
                    />
                    <MetaItem
                      label={tConnect("opportunityEditor.groupFormat", {}, { default: "Group format" })}
                      value={groupFormatLabel}
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
                  title={tConnect("opportunityEditor.introVideo", {}, { default: "Intro video" })}
                >
                  {directVideoSrc ? (
                    <video
                      controls
                      preload="metadata"
                      poster={coverSrc || undefined}
                      src={directVideoSrc}
                      style={{
                        width: "100%",
                        maxHeight: 420,
                        borderRadius: 12,
                        background: "#000",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        position: "relative",
                        paddingBottom: "56.25%",
                        height: 0,
                        borderRadius: 12,
                        overflow: "hidden",
                        background: "#000",
                      }}
                    >
                      <iframe
                        src={embedUrl || fallbackIframeSrc}
                        title={opp.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        frameBorder="0"
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                        }}
                      />
                    </div>
                  )}
                </PreviewSection>
              )}

              {opp.description ? (
                <PreviewSection
                  title={t("opportunities.preview.aboutTitle", {}, { default: "About this opportunity" })}
                >
                  <ReadOnlyTipTap dangerouslySetInnerHTML={{ __html: opp.description }} />
                </PreviewSection>
              ) : null}

              {(proposal.relevance ||
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
                proposal.internshipInterest) && (
                <PreviewSection
                  title={overviewLabel("title", "Overview of Capstone Project Proposal")}
                >
                  <div style={{ display: "grid", gap: 16 }}>
                    <TextBlock
                      label={overviewLabel("relevance", "Relevance to CUSP")}
                      value={proposal.relevance}
                    />
                    <TextBlock
                      label={overviewLabel("requiresSpecialResources", "Special resources required")}
                      value={yesNoLabel(proposal.requiresSpecialResources)}
                    />
                    <TextBlock
                      label={overviewLabel("specialResourcesNotes", "Special resources notes")}
                      value={proposal.specialResourcesNotes}
                    />
                    <TextBlock
                      label={overviewLabel("datasetProvision", "Dataset provision")}
                      value={formatMultiOptions(proposal.datasetProvision, "datasetProvisionOptions")}
                    />
                    {proposal.datasetProvisionOther ? (
                      <TextBlock
                        label={overviewLabel("datasetProvisionOther", "Other datasets")}
                        value={proposal.datasetProvisionOther}
                      />
                    ) : null}
                    <TextBlock
                      label={overviewLabel("expectedDeliverables", "Expected deliverables")}
                      value={[
                        formatMultiOptions(proposal.expectedDeliverables, "deliverableOptions"),
                        proposal.expectedDeliverablesOther,
                      ]
                        .filter(Boolean)
                        .join(" — ")}
                    />
                    <TextBlock
                      label={overviewLabel("anticipatedObstacles", "Anticipated obstacles")}
                      value={proposal.anticipatedObstacles}
                    />
                    <TextBlock
                      label={overviewLabel("fieldResearchRequired", "Field research required")}
                      value={overviewOptionLabel(
                        "fieldResearchOptions",
                        proposal.fieldResearchRequired,
                      )}
                    />
                    <TextBlock
                      label={overviewLabel("fieldResearchTravelDetails", "Field research details")}
                      value={proposal.fieldResearchTravelDetails}
                    />
                    <TextBlock
                      label={overviewLabel("requiredSoftware", "Required software")}
                      value={formatMultiOptions(proposal.requiredSoftware, "softwareOptions")}
                    />
                    {proposal.requiredSoftwareOther ? (
                      <TextBlock
                        label={overviewLabel("requiredSoftwareOther", "Other software")}
                        value={proposal.requiredSoftwareOther}
                      />
                    ) : null}
                    <TextBlock
                      label={overviewLabel("requiredHardware", "Required hardware")}
                      value={formatMultiOptions(proposal.requiredHardware, "hardwareOptions")}
                    />
                    {proposal.requiredHardwareOther ? (
                      <TextBlock
                        label={overviewLabel("requiredHardwareOther", "Other hardware")}
                        value={proposal.requiredHardwareOther}
                      />
                    ) : null}
                    <TextBlock
                      label={overviewLabel("additionalNotes", "Additional notes")}
                      value={proposal.additionalNotes}
                    />
                    <TextBlock
                      label={overviewLabel("internshipInterest", "Internship interest")}
                      value={overviewOptionLabel(
                        "internshipInterestOptions",
                        proposal.internshipInterest,
                      )}
                    />
                  </div>
                </PreviewSection>
              )}

              {(opp.scopeDescription || opp.potentialActivities || opp.specificSkills) && (
                <PreviewSection
                  title={tConnect("opportunityEditor.followUpQuestionnaire.title", {}, {
                    default: "Follow-up questionnaire",
                  })}
                >
                  <div style={{ display: "grid", gap: 16 }}>
                    <TextBlock
                      label={tConnect("opportunityEditor.finalScope.scopeDescription", {}, {
                        default: "Scope of the project",
                      })}
                      value={opp.scopeDescription}
                    />
                    <TextBlock
                      label={tConnect("opportunityEditor.followUpQuestionnaire.potentialActivities", {}, {
                        default: "Potential activities",
                      })}
                      value={opp.potentialActivities}
                    />
                    <TextBlock
                      label={tConnect("opportunityEditor.followUpQuestionnaire.specificSkills", {}, {
                        default: "Specific skills or qualifications",
                      })}
                      value={opp.specificSkills}
                    />
                  </div>
                </PreviewSection>
              )}
              
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                {opp.organization ? (
                  <PreviewSection
                    title={t("opportunities.preview.hostedBy", {}, { default: "Hosted by" })}
                  >
                    <ProfilePanel
                      imageSrc={orgLogo}
                      name={opp.organization.name}
                      lines={[
                        opp.organization.tagline,
                        [opp.organization.department, opp.organization.location]
                          .filter(Boolean)
                          .join(" · "),
                        opp.organization.primaryDomain,
                        opp.organization.website,
                        opp.organization.verified
                          ? t("opportunities.preview.verifiedOrganization", {}, {
                              default: "Verified organization",
                            })
                          : null,
                      ]}
                    />
                    {opp.organization.mission ? (
                      <p style={BODY_TEXT_STYLE}>{opp.organization.mission}</p>
                    ) : null}
                  </PreviewSection>
                ) : null}

                {opp.mentor ? (
                  <PreviewSection
                    title={t("opportunities.preview.mentorContact", {}, { default: "Your contact" })}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "flex-start",
                        gap: 12,
                      }}
                    >
                      <ProfilePanel
                        imageSrc={mentorAvatar}
                        name={mentorName}
                        lines={[
                          opp.mentor.tagline,
                          opp.mentor.email,
                          [opp.mentor.organization, opp.mentor.department]
                            .filter(Boolean)
                            .join(" · "),
                          opp.mentor.primaryDomain,
                          opp.mentor.timeCommitment
                            ? `${t("opportunities.preview.timeCommitment", {}, { default: "Time commitment" })}: ${opp.mentor.timeCommitment}`
                            : null,
                        ]}
                      />
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "row",
                          gap: 10,
                          flex: "1 1 180px",
                          minWidth: 160,
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
                            style={{ background: "#e3f4ec" }}
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
                      </div>
                    </div>
                    {!opp.sponsorIsMentor && opp.mentorNotes ? (
                      <TextBlock
                        label={t("opportunities.preview.mentorNotes", {}, {
                          default: "Mentor notes",
                        })}
                        value={opp.mentorNotes}
                      />
                    ) : null}
                    {opp.mentor.bio ? <p style={BODY_TEXT_STYLE}>{opp.mentor.bio}</p> : null}
                  </PreviewSection>
                ) : null}
              </div>
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
                          background: "#f7f9f8",
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
                          <span style={{ fontWeight: 600, color: "#171717", fontSize: 13 }}>
                            {displayName(rating.rater)}
                          </span>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                            <Stars value={rating.opportunityRating} />
                            <span style={{ color: "#888", fontSize: 12 }}>
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
        </StyledModal>
      </Modal.Content>
      <Modal.Actions style={{ padding: "1rem 1.5rem", gap: "8px" }}>
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
            ) : (
              <span />
            )
          ) : (
            <span />
          )}
        </div>
      </Modal.Actions>
      <ReturnOpportunityModal
        open={returnModalOpen}
        onClose={() => setReturnModalOpen(false)}
        onSuccess={handleReturnSuccess}
        opportunityId={opportunityId}
        roundId={activeRoundId}
        mentorId={opp?.mentor?.id}
        refetchQueries={returnRefetchQueries}
      />
    </Modal>
  );
}
