import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

import Chip from "../../../../DesignSystem/Chip";
import IconButton from "../../../../DesignSystem/IconButton";
import { CodeIcon, QuestionMarkIcon } from "../../../../DesignSystem/Icons";
import { EXPLORE_OPPORTUNITY_DETAIL } from "../../../../Queries/Opportunity";
import { ReadOnlyTipTap } from "../../../../TipTap/ReadOnlyTipTap";
import ReviewCard from "../../../../Forms/DefinitionForm/ReviewCard";
import ReviewField from "../../../../Forms/DefinitionForm/ReviewField";
import { getStudentPitchProposalFormDefinitionId } from "../../../../../lib/opportunityProposalData";
import {
  collectActiveRoundFollowUpForms,
  resolvePreviewFollowUpForms,
} from "../../../../../lib/opportunityPreviewTabs";
import {
  asLegacyMultiselectArray,
  hydrateProposalInputs,
} from "../../../SponsorConnect/Opportunities/OpportunityProposalConfig";
import StudentFollowUpAnswers from "./StudentFollowUpAnswers";
import ConnectProfileCard from "../../../Connect/ConnectProfileCard";
import { CARD_WIDTH } from "../../../Connect/ConnectBrowseLayout";
import OrganizationConnectCard from "../../../Connect/Organizations/OrganizationConnectCard";
import ManageFavoriteOpportunity from "../../../Connect/ManageFavoriteOpportunity";
import OpportunityClassForum from "../../../Connect/OpportunityClassForum";

function toOptionKey(value) {
  return String(value || "").replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

const TABS = {
  about: "about",
  people: "people",
  forum: "forum",
};

const CATEGORY_LABELS = {
  urban_health: "urbanHealth",
  urban_environment: "urbanEnvironment",
  urban_infrastructure: "urbanInfrastructure",
  other: "other",
};

const DIRECT_VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogg|ogv)(\?|#|$)/i;

const CONTENT_MAX_WIDTH = 960;
const CONTENT_BOTTOM_GAP = "24px";

const PageShell = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
  box-sizing: border-box;
  background: var(--MH-Theme-Neutrals-White, #ffffff);
  border-radius: 12px;
  border: 1px solid var(--MH-Theme-Neutrals-Medium, #E6E6E6);
  overflow: hidden;
`;

const PreviewChrome = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex-shrink: 0;
  align-items: center;
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  padding: 16px 24px 12px;
  box-sizing: border-box;
`;

const ChromeTitleWrap = styled.div`
  flex: 1 1 auto;
  min-width: 0;
`;

const ChromeTitle = styled.h1`
  margin: 0;
  font-family: Inter, sans-serif;
  font-size: 20px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--MH-Theme-Neutrals-Black, #171717);
  overflow-wrap: anywhere;
  word-break: break-word;
`;

const ContentPane = styled.div`
  flex: 1 1 0;
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  padding: 0 24px ${CONTENT_BOTTOM_GAP};
  box-sizing: border-box;
`;

const ContentInner = styled.div`
  width: 100%;
  max-width: ${CONTENT_MAX_WIDTH}px;
  margin: 0 auto;
  display: grid;
  gap: 8px;
  color: var(--MH-Theme-Neutrals-Black, #171717);
  box-sizing: border-box;
`;

const ChipSelectorRow = styled.div`
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-width: 0;
  padding: 8px 8px 16px 8px;
  box-sizing: border-box;
  border-bottom: 1px solid var(--MH-Theme-Neutrals-Light, #d3dae0);
  background: var(--MH-Theme-Neutrals-White, #ffffff);
`;

const MetaChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 8px;
  min-width: 0;

  > .DesignSystem-Chip {
    max-width: 100%;
  }
`;

/** Keep list chips wrapping instead of one full-width block per row. */
const LIST_CHIP_STYLE = {
  width: "auto",
  maxWidth: "100%",
  height: "auto",
  minHeight: 32,
  alignItems: "flex-start",
};

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

  > article {
    max-width: ${CARD_WIDTH};
  }
`;

const HeaderActions = styled.span`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
  margin-left: auto;
  align-self: flex-start;
`;

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

function PreviewSection({ title, children }) {
  if (!children) return null;
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <h4 style={SECTION_TITLE_STYLE}>{title}</h4>
      {children}
    </div>
  );
}

const CODE_CHIP_LEADING = (
  <CodeIcon width={18} height={18} style={{ display: "block" }} />
);

function ChipList({ label, items, ariaLabel, leading = null }) {
  const chips = (Array.isArray(items) ? items : [])
    .flatMap((item) => (Array.isArray(item) ? item : [item]))
    .map((item) => (item == null ? "" : String(item).trim()))
    .filter(Boolean);
  if (!chips.length) return null;
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {label ? <h4 style={SECTION_TITLE_STYLE}>{label}</h4> : null}
      <MetaChipRow role="list" aria-label={ariaLabel || label || undefined}>
        {chips.map((item, index) => (
          <Chip
            key={`${index}-${item}`}
            shape="pill"
            label={item}
            title={item}
            labelLines={4}
            leading={leading}
            style={LIST_CHIP_STYLE}
          />
        ))}
      </MetaChipRow>
    </div>
  );
}

function BulletList({ label, items }) {
  const entries = (Array.isArray(items) ? items : [])
    .flatMap((item) => (Array.isArray(item) ? item : [item]))
    .map((item) => (item == null ? "" : String(item).trim()))
    .filter(Boolean);
  if (!entries.length) return null;
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {label ? <h4 style={SECTION_TITLE_STYLE}>{label}</h4> : null}
      <ul
        style={{
          margin: 0,
          paddingLeft: 20,
          color: "var(--MH-Theme-Neutrals-Black, #171717)",
          fontFamily: "Lato, sans-serif",
          fontSize: 14,
          fontWeight: 400,
          lineHeight: 1.5,
        }}
      >
        {entries.map((item, index) => (
          <li key={`${index}-${item}`} style={{ marginBottom: 4 }}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Split free-text lists (comma / semicolon / newline) into chip labels when multi. */
function textListToChips(value) {
  if (value == null) return [];
  if (Array.isArray(value)) {
    return value.map((v) => String(v || "").trim()).filter(Boolean);
  }
  const text = String(value).trim();
  if (!text) return [];
  const parts = text
    .split(/\n|;|,(?![^(]*\))/)
    .map((part) => part.replace(/^[\s•\-\*]+/, "").trim())
    .filter(Boolean);
  return parts.length > 1 ? parts : [text];
}

/**
 * Student-facing opportunity preview — project pitch, not teacher review UI.
 * Full-page view (class header/tabs hidden); does not import OpportunityPreviewModal.
 */
export default function StudentOpportunityPreview({
  opportunityId,
  onClose,
  user = null,
  /** Class that owns this student preview (scopes the class FAQ). */
  classId = null,
  /** Matching round that surfaces this opportunity to the student class. */
  roundId = null,
}) {
  const { t } = useTranslation("classes");
  const { t: tConnect } = useTranslation("connect");
  const [activeTab, setActiveTab] = useState(TABS.about);

  const { data, loading } = useQuery(EXPLORE_OPPORTUNITY_DETAIL, {
    variables: { id: opportunityId },
    skip: !opportunityId,
    fetchPolicy: "cache-and-network",
  });

  const opp = data?.opportunity;

  useEffect(() => {
    setActiveTab(TABS.about);
  }, [opportunityId]);

  const coverSrc = opp?.coverImage?.url || opp?.coverImageUrl || null;
  const from = formatDate(opp?.availableFrom);
  const to = formatDate(opp?.availableTo);

  const categoryKey = CATEGORY_LABELS[opp?.projectCategory];
  const categoryLabel = categoryKey
    ? tConnect(`opportunityEditor.categorizationOptions.${categoryKey}`, {}, {
        default: opp?.projectCategory,
      })
    : opp?.projectCategory;
  const categoryDisplay = categoryLabel
    ? opp?.projectCategory === "other" && opp?.projectCategoryOther
      ? `${categoryLabel}: ${opp.projectCategoryOther}`
      : categoryLabel
    : opp?.projectCategoryOther || null;

  const teamSizeLabel =
    opp?.teamSize > 1
      ? t(
          "opportunities.preview.teamSizeTeam",
          { size: opp.teamSize },
          { default: "Team of {{size}}" },
        )
      : t("opportunities.preview.teamSizeSolo", {}, { default: "Solo" });

  const datesLabel =
    from || to
      ? t(
          "opportunities.studentView.meta.dates",
          { from: from || "—", to: to || "—" },
          { default: "{{from}} → {{to}}" },
        )
      : null;

  const ratingLabel =
    opp?.publicRatingCount > 0
      ? `${opp.publicRatingAverage?.toFixed(1)} (${opp.publicRatingCount})`
      : null;

  const cleanVideoUrl = extractUrl(opp?.videoUrl);
  const directVideoSrc =
    opp?.videoFile?.url ||
    (isDirectVideoFile(cleanVideoUrl) ? cleanVideoUrl : null);
  const embedUrl = !directVideoSrc ? getEmbedUrl(cleanVideoUrl) : null;
  const fallbackIframeSrc =
    !directVideoSrc && !embedUrl && cleanVideoUrl ? cleanVideoUrl : null;

  const followUpForms = useMemo(() => {
    if (!opp) return [];
    if (roundId) {
      return resolvePreviewFollowUpForms({
        activeRoundId: roundId,
        rounds: opp.rounds || [],
      });
    }
    // No round context: collect unique follow-up forms from every round on the opp.
    const byId = new Map();
    for (const round of opp.rounds || []) {
      for (const form of collectActiveRoundFollowUpForms(round)) {
        if (!byId.has(form.id)) byId.set(form.id, form);
      }
    }
    return Array.from(byId.values());
  }, [opp, roundId]);

  const pitchFormDefinitionId = useMemo(() => {
    const excludeIds = followUpForms.map((f) => f.id).filter(Boolean);
    return getStudentPitchProposalFormDefinitionId(
      opp?.proposalData,
      excludeIds,
    );
  }, [opp?.proposalData, followUpForms]);

  const proposal = useMemo(
    () => hydrateProposalInputs(opp, pitchFormDefinitionId),
    [opp, pitchFormDefinitionId],
  );

  const overviewOptionLabel = (group, value) => {
    if (!value) return null;
    return tConnect(
      `opportunityEditor.overview.${group}.${toOptionKey(value)}`,
      {},
      { default: value },
    );
  };

  const optionChipLabels = (values, group, other) => {
    const list = asLegacyMultiselectArray(values);
    const labels = list
      .map((value) => overviewOptionLabel(group, value))
      .filter(Boolean);
    const otherLabel = other != null ? String(other).trim() : "";
    if (otherLabel) labels.push(otherLabel);
    return labels;
  };

  const yesNoLabel = (value) =>
    value ? overviewOptionLabel("yesNo", value) : null;

  const fieldLabel = (key, fallback) =>
    t(`opportunities.studentView.preview.fields.${key}`, {}, { default: fallback });

  const deliverableChips = optionChipLabels(
    proposal.expectedDeliverables,
    "deliverableOptions",
    proposal.expectedDeliverablesOther,
  );
  const softwareChips = optionChipLabels(
    proposal.requiredSoftware,
    "softwareOptions",
    proposal.requiredSoftwareOther,
  );
  const hardwareChips = optionChipLabels(
    proposal.requiredHardware,
    "hardwareOptions",
    proposal.requiredHardwareOther,
  );
  const datasetChips = optionChipLabels(
    proposal.datasetProvision,
    "datasetProvisionOptions",
    proposal.datasetProvisionOther,
  );
  const skillsChips = textListToChips(opp?.specificSkills);

  const fieldResearchLabel = overviewOptionLabel(
    "fieldResearchOptions",
    proposal.fieldResearchRequired,
  );
  const specialResourcesLabel = yesNoLabel(proposal.requiresSpecialResources);
  const specialResourcesNotes =
    proposal.specialResourcesNotes != null
      ? String(proposal.specialResourcesNotes).trim()
      : "";
  // F2–3 combined: yes/no + notes in one row when both exist.
  const specialResourcesCombined =
    specialResourcesLabel && specialResourcesNotes
      ? `${specialResourcesLabel}: ${specialResourcesNotes}`
      : specialResourcesLabel || specialResourcesNotes || null;

  const fieldResearchTravel =
    proposal.fieldResearchTravelDetails != null
      ? String(proposal.fieldResearchTravelDetails).trim()
      : "";
  // F7 + sub-answer when travel/fieldwork details were provided.
  const fieldResearchCombined =
    fieldResearchLabel && fieldResearchTravel
      ? `${fieldResearchLabel}: ${fieldResearchTravel}`
      : fieldResearchLabel || fieldResearchTravel || null;

  const hasProposalDetails = Boolean(
    proposal.relevance ||
      specialResourcesCombined ||
      datasetChips.length ||
      deliverableChips.length ||
      proposal.anticipatedObstacles ||
      fieldResearchCombined ||
      softwareChips.length ||
      hardwareChips.length,
  );

  const hasProjectDetails = Boolean(
    opp?.scopeDescription ||
      opp?.potentialActivities ||
      skillsChips.length ||
      hasProposalDetails,
  );

  const pageTitle =
    opp?.title ||
    t("opportunities.studentView.preview.fallbackTitle", {}, {
      default: "Opportunity",
    });

  const aboutTabLabel = t("opportunities.studentView.preview.tabs.about", {}, {
    default: "About",
  });
  const peopleTabLabel = t(
    "opportunities.studentView.preview.tabs.whoYoullWorkWith",
    {},
    { default: "Who you’ll work with" },
  );
  const forumTabLabel = t(
    "opportunities.classForum.tab",
    {},
    { default: "Class FAQ" },
  );
  const backLabel = t("opportunities.studentView.preview.back", {}, {
    default: "Back to opportunities",
  });
  const backAria = t("opportunities.studentView.preview.backAria", {}, {
    default: "Back to opportunities",
  });

  return (
    <PageShell>
      <PreviewChrome>
        <IconButton
          variant="tonal"
          style={{
            background: "var(--MH-Theme-Neutrals-Lighter, #F3F3F3)",
          }}
          ariaLabel={backAria}
          title={backLabel}
          onClick={onClose}
          icon={
            <img
              src="/assets/icons/back.svg"
              alt=""
              width={12}
              height={12}
              style={{ width: 12, height: 12 }}
            />
          }
        />
        <ChromeTitleWrap>
          <ChromeTitle>{pageTitle}</ChromeTitle>
        </ChromeTitleWrap>
        <HeaderActions>
          <ManageFavoriteOpportunity
            user={user}
            opportunityId={opportunityId}
          />
        </HeaderActions>
      </PreviewChrome>

      <ContentPane>
        {loading && !opp ? (
          <ContentInner>
            <p style={MUTED_TEXT_STYLE}>
              {t("opportunities.studentView.preview.loading", {}, {
                default: "Loading opportunity…",
              })}
            </p>
          </ContentInner>
        ) : null}

        {!loading && !opp ? (
          <ContentInner>
            <p style={MUTED_TEXT_STYLE}>
              {t("opportunities.studentView.preview.notFound", {}, {
                default: "Opportunity not found, or no longer available.",
              })}
            </p>
          </ContentInner>
        ) : null}

        {opp ? (
          <ContentInner>
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
              role="group"
              aria-label={t(
                "opportunities.studentView.preview.tabsAria",
                {},
                { default: "Opportunity sections" },
              )}
            >
              <Chip
                label={aboutTabLabel}
                shape="square"
                style={{ padding: "16px" }}
                selected={activeTab === TABS.about}
                pressed={activeTab === TABS.about}
                onClick={() => setActiveTab(TABS.about)}
                ariaLabel={aboutTabLabel}
              />
              <Chip
                label={peopleTabLabel}
                shape="square"
                style={{ padding: "16px" }}
                selected={activeTab === TABS.people}
                pressed={activeTab === TABS.people}
                leading={
                  <img
                    src="/assets/connect/group.svg"
                    alt=""
                    aria-hidden
                    width={20}
                    height={16}
                  />
                }
                onClick={() => setActiveTab(TABS.people)}
                ariaLabel={peopleTabLabel}
              />
              <Chip
                label={forumTabLabel}
                shape="square"
                style={{ padding: "16px" }}
                selected={activeTab === TABS.forum}
                pressed={activeTab === TABS.forum}
                leading={<QuestionMarkIcon width={18} height={18} />}
                onClick={() => setActiveTab(TABS.forum)}
                ariaLabel={forumTabLabel}
              />
            </ChipSelectorRow>

            {activeTab === TABS.about ? (
              <div style={{ display: "grid", gap: 24 }}>
                <MetaChipRow
                  role="list"
                  aria-label={t(
                    "opportunities.studentView.preview.metaAria",
                    {},
                    { default: "Opportunity details" },
                  )}
                >
                  <Chip
                    shape="pill"
                    label={teamSizeLabel}
                    leading={
                      <img
                        src={
                          opp.teamSize > 1
                            ? "/assets/icons/group.svg"
                            : "/assets/icons/user.svg"
                        }
                        alt=""
                        aria-hidden
                        width={18}
                        height={18}
                      />
                    }
                  />
                  {opp.timeCommitment ? (
                    <Chip shape="pill" label={opp.timeCommitment} />
                  ) : null}
                  {datesLabel ? (
                    <Chip shape="pill" label={datesLabel} />
                  ) : null}
                  {categoryDisplay ? (
                    <Chip shape="pill" label={categoryDisplay} />
                  ) : null}
                  {ratingLabel ? (
                    <Chip shape="pill" label={ratingLabel} />
                  ) : null}
                  {specialResourcesLabel ? (
                    <Chip
                      shape="pill"
                      label={t(
                        "opportunities.studentView.preview.specialResourcesChip",
                        { value: specialResourcesLabel },
                        { default: "Special resources: {{value}}" },
                      )}
                    />
                  ) : null}
                  {fieldResearchLabel ? (
                    <Chip
                      shape="pill"
                      label={t(
                        "opportunities.studentView.preview.fieldResearchChip",
                        { value: fieldResearchLabel },
                        { default: "Field research: {{value}}" },
                      )}
                    />
                  ) : null}
                </MetaChipRow>

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

                {directVideoSrc || embedUrl || fallbackIframeSrc ? (
                  <PreviewSection
                    title={tConnect("opportunityEditor.introVideo", {}, {
                      default: "Intro video",
                    })}
                  >
                    {directVideoSrc ? (
                      <video
                        src={directVideoSrc}
                        controls
                        style={{
                          width: "100%",
                          borderRadius: 12,
                          maxHeight: 360,
                        }}
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
                ) : null}

                {opp.description ? (
                  <ReviewCard
                    title={t(
                      "opportunities.studentView.preview.aboutTitle",
                      {},
                      { default: "About this opportunity" },
                    )}
                  >
                    <ReviewField>
                      <ReadOnlyTipTap
                        dangerouslySetInnerHTML={{ __html: opp.description }}
                      />
                    </ReviewField>
                  </ReviewCard>
                ) : null}

                {hasProjectDetails ? (
                  <div style={{ display: "grid", gap: 20 }}>
                    <h4 style={SECTION_TITLE_STYLE}>
                      {t(
                        "opportunities.studentView.preview.projectDetails",
                        {},
                        { default: "Project details" },
                      )}
                    </h4>

                    <ReviewField
                      label={fieldLabel("scope", "Scope of the project")}
                      value={opp.scopeDescription}
                    />
                    <ReviewField
                      label={fieldLabel(
                        "potentialActivities",
                        "Potential activities",
                      )}
                      value={opp.potentialActivities}
                    />
                    <ChipList
                      label={fieldLabel(
                        "specificSkills",
                        "Specific skills or qualifications",
                      )}
                      items={skillsChips}
                    />
                    <ReviewField
                      label={fieldLabel(
                        "background",
                        "Project background",
                      )}
                      value={proposal.relevance}
                    />
                    <ReviewField
                      label={fieldLabel(
                        "specialResources",
                        "Special resources required",
                      )}
                      value={specialResourcesCombined}
                    />

                    <BulletList
                      label={fieldLabel("datasets", "Datasets")}
                      items={datasetChips}
                    />
                    <ChipList
                      label={fieldLabel(
                        "expectedDeliverables",
                        "Expected deliverables",
                      )}
                      items={deliverableChips}
                      ariaLabel={fieldLabel(
                        "expectedDeliverables",
                        "Expected deliverables",
                      )}
                    />

                    <ReviewField
                      label={fieldLabel(
                        "anticipatedObstacles",
                        "Anticipated obstacles",
                      )}
                      value={proposal.anticipatedObstacles}
                    />
                    <ReviewField
                      label={fieldLabel(
                        "fieldResearch",
                        "Field research / site visits",
                      )}
                      value={fieldResearchCombined}
                    />

                    <ChipList
                      label={fieldLabel(
                        "requiredSoftware",
                        "Required software",
                      )}
                      items={softwareChips}
                      ariaLabel={fieldLabel(
                        "requiredSoftware",
                        "Required software",
                      )}
                      leading={CODE_CHIP_LEADING}
                    />
                    <ChipList
                      label={fieldLabel(
                        "requiredHardware",
                        "Required hardware",
                      )}
                      items={hardwareChips}
                      ariaLabel={fieldLabel(
                        "requiredHardware",
                        "Required hardware",
                      )}
                    />
                  </div>
                ) : null}

                {followUpForms.length > 0 ? (
                  <StudentFollowUpAnswers
                    opportunity={opp}
                    forms={followUpForms}
                  />
                ) : null}

                {opp.ratings?.length > 0 ? (
                  <PreviewSection
                    title={t(
                      "opportunities.studentView.preview.ratingsTitle",
                      {},
                      { default: "What past participants said" },
                    )}
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
                            background:
                              "var(--MH-Theme-Neutrals-Lighter, #f3f3f3)",
                            border:
                              "1px solid var(--MH-Theme-Neutrals-Medium, #a1a1a1)",
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
                            <span
                              style={{
                                fontWeight: 600,
                                color:
                                  "var(--MH-Theme-Neutrals-Black, #171717)",
                                fontSize: 13,
                              }}
                            >
                              {displayName(rating.rater)}
                            </span>
                            <div
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 8,
                              }}
                            >
                              <Stars value={rating.opportunityRating} />
                              <span
                                style={{
                                  color:
                                    "var(--MH-Theme-Neutrals-Dark, #6a6a6a)",
                                  fontSize: 12,
                                }}
                              >
                                {formatDate(rating.createdAt)}
                              </span>
                            </div>
                          </div>
                          {rating.feedback ? (
                            <p style={{ ...BODY_TEXT_STYLE, margin: 0 }}>
                              {rating.feedback}
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </PreviewSection>
                ) : null}
              </div>
            ) : null}

            {activeTab === TABS.people ? (
              <div style={{ display: "grid", gap: 16 }}>
                {opp.organization || opp.mentor ? (
                  <PeopleColumns>
                    {opp.mentor ? (
                      <PeoplePanel>
                        <h4>
                          {t("opportunities.preview.mentorContact", {}, {
                            default: "Your contact",
                          })}
                        </h4>
                        <ConnectProfileCard
                          user={user}
                          profile={opp.mentor}
                        />
                        {opp.mentorNotes ? (
                          <div style={{ width: "100%", minWidth: 0 }}>
                            <ReviewField
                              label={t(
                                "opportunities.studentView.preview.mentorNotes",
                                {},
                                { default: "Mentoring notes" },
                              )}
                              value={opp.mentorNotes}
                            />
                          </div>
                        ) : null}
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
                        {opp.organization.mission ||
                        opp.organization.department ||
                        opp.organization.website ? (
                          <div
                            style={{
                              display: "grid",
                              gap: 12,
                              width: "100%",
                              minWidth: 0,
                            }}
                          >
                            <ReviewField
                              label={t(
                                "opportunities.studentView.preview.orgMission",
                                {},
                                { default: "Mission" },
                              )}
                              value={opp.organization.mission}
                            />
                            <ReviewField
                              label={t(
                                "opportunities.studentView.preview.orgDepartment",
                                {},
                                { default: "Department" },
                              )}
                              value={opp.organization.department}
                            />
                            <ReviewField
                              label={t(
                                "opportunities.studentView.preview.orgWebsite",
                                {},
                                { default: "Website" },
                              )}
                              value={opp.organization.website}
                            />
                          </div>
                        ) : null}
                      </PeoplePanel>
                    ) : null}
                  </PeopleColumns>
                ) : (
                  <p style={BODY_TEXT_STYLE}>
                    {t(
                      "opportunities.studentView.preview.peopleEmpty",
                      {},
                      {
                        default:
                          "No organization or mentor details are available yet.",
                      },
                    )}
                  </p>
                )}
              </div>
            ) : null}

            {activeTab === TABS.forum ? (
              <div style={{ display: "grid", gap: 16 }}>
                <OpportunityClassForum
                  opportunityId={opportunityId}
                  classId={classId}
                  user={user}
                />
              </div>
            ) : null}
          </ContentInner>
        ) : null}
      </ContentPane>
    </PageShell>
  );
}
