import { useMemo } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import Link from "next/link";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

import { EXPLORE_OPPORTUNITY_DETAIL } from "../../../Queries/Opportunity";
import { TOGGLE_FAVORITE_OPPORTUNITY } from "../../../Mutations/Opportunity";
import { ReadOnlyTipTap } from "../../../TipTap/ReadOnlyTipTap";
import { hydrateProposalInputs } from "../../SponsorConnect/Opportunities/OpportunityProposalConfig";
import { formatOrganizationLabel } from "../../../../lib/organizationLabels";
import Chip from "../../../DesignSystem/Chip";
import FavoriteButton from "../../../DesignSystem/FavoriteButton";
import IconButton from "../../../DesignSystem/IconButton";
import { ArrowOutwardIcon, CheckIcon } from "../../../DesignSystem/Icons";

const DIRECT_VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogg|ogv)(\?|#|$)/i;

function isDirectVideoFile(url) {
  if (!url) return false;
  try {
    return DIRECT_VIDEO_EXT.test(new URL(url).pathname);
  } catch {
    return DIRECT_VIDEO_EXT.test(url);
  }
}

function extractUrl(raw) {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;
  const m = trimmed.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  return m ? m[1] : trimmed;
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

const Shell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 32px clamp(16px, 6vw, 64px);
  background-color: var(--MH-Theme-Neutrals-Lighter, #f7f9f8);
  min-height: 100vh;
  border-radius: 32px 0 0 32px;
`;

const BACK_CHEVRON = (
  <svg
    width="20"
    height="20"
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

const FavoriteRow = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
`;

const HeroCover = styled.div`
  width: 100%;
  height: clamp(200px, 32vw, 360px);
  border-radius: 16px;
  background: ${({ $src }) =>
    $src ? `url(${$src}) center/cover no-repeat #eef1f2` : "#eef1f2"};
`;

const Card = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0px 4px 24px rgba(0, 0, 0, 0.05);

  h2 {
    margin: 0;
    font: var(--MH-Type-Title-Large);
    letter-spacing: 0;
    color: #171717;
  }
`;

const TitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  align-items: flex-start;

  h1 {
    margin: 0;
    font: var(--MH-Type-Heading-Base);
    letter-spacing: 0;
    color: #171717;
  }

  .right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 6px;
  }
`;

const MetaGrid = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));

  .item {
    padding: 10px 14px;
    border-radius: 10px;
    background: #f7f9f8;

    .label {
      font: var(--MH-Type-Label-Small);
      letter-spacing: 0;
      color: #888;
      text-transform: uppercase;
    }
    .value {
      font: var(--MH-Type-Title-Small);
      letter-spacing: 0;
      color: #171717;
      margin-top: 2px;
    }
  }
`;

const MentorPanel = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: 12px;
  background: #f7f9f8;

  img {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    object-fit: cover;
    flex: none;
  }

  .placeholder {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: #d3dae0;
    color: #5f6871;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font: var(--MH-Type-Title-Large);
    letter-spacing: 0;
    flex: none;
  }

  .info {
    display: flex;
    flex-direction: column;
    gap: 2px;

    .name {
      font: var(--MH-Type-Title-Base);
      letter-spacing: 0;
      color: #171717;
    }
    .tagline {
      color: #5f6871;
      font: var(--MH-Type-Body-Base);
      letter-spacing: 0;
    }
    .org {
      color: #888;
      font: var(--MH-Type-Body-Base);
      letter-spacing: 0;
    }
  }

  a.profile-link {
    margin-left: auto;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: #336f8a;
    font: var(--MH-Type-Label-Base);
    letter-spacing: 0;
    text-decoration: none;
  }
`;

const RatingRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px;
  border-radius: 10px;
  background: #f7f9f8;

  .top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
  }
  .author {
    font: var(--MH-Type-Title-Small);
    letter-spacing: 0;
    color: #171717;
  }
  .when {
    color: #888;
    font: var(--MH-Type-Body-Base);
    letter-spacing: 0;
  }
  .body {
    color: #5f6871;
    font: var(--MH-Type-Body-Base);
    letter-spacing: 0;
  }
`;

function displayName(profile) {
  if (!profile) return "Unknown";
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
          style={{ color: n <= v ? "#f5b800" : "#d3dae0", fontSize: 14 }}
        >
          {n <= v ? "★" : "☆"}
        </span>
      ))}
    </span>
  );
}

export default function ExploreDetail({ opportunityId }) {
  const router = useRouter();
  const { t } = useTranslation("connect");
  const backLabel = t("exploreDetail.backLink", {}, {
    default: "Back to all opportunities",
  });
  const { data, loading, refetch } = useQuery(EXPLORE_OPPORTUNITY_DETAIL, {
    variables: { id: opportunityId },
    fetchPolicy: "cache-and-network",
  });
  const opp = data?.opportunity;
  const me = data?.authenticatedItem;

  const [toggleFavorite, { loading: toggling }] = useMutation(
    TOGGLE_FAVORITE_OPPORTUNITY,
  );

  // Is this opportunity in my favorites list?
  const isFavorite = useMemo(
    () =>
      !!(me?.favoriteOpportunities || []).find((o) => o.id === opportunityId),
    [me, opportunityId],
  );

  const handleToggleFavorite = async () => {
    if (!me?.id) return;
    await toggleFavorite({
      variables: {
        profileId: me.id,
        input: {
          favoriteOpportunities: isFavorite
            ? { disconnect: [{ id: opportunityId }] }
            : { connect: [{ id: opportunityId }] },
        },
      },
    });
    refetch();
  };

  if (loading && !opp) {
    return (
      <Shell>
        <p>
          {t("exploreDetail.loading", {}, { default: "Loading opportunity…" })}
        </p>
      </Shell>
    );
  }
  if (!opp) {
    return (
      <Shell>
        <p>
          {t("exploreDetail.notFound", {}, {
            default: "Opportunity not found, or no longer available.",
          })}
        </p>
        <IconButton
          variant="tonal"
          elevated={false}
          onClick={() => router.back()}
          ariaLabel={backLabel}
          title={backLabel}
          icon={BACK_CHEVRON}
        />
      </Shell>
    );
  }

  const proposal = hydrateProposalInputs(opp);

  const coverSrc = opp.coverImage?.url || opp.coverImageUrl || null;
  const cleanVideoUrl = extractUrl(opp.videoUrl);
  const directVideoSrc =
    opp.videoFile?.url ||
    (isDirectVideoFile(cleanVideoUrl) ? cleanVideoUrl : null);
  const embedUrl = !directVideoSrc ? getEmbedUrl(cleanVideoUrl) : null;
  const fallbackIframeSrc =
    !directVideoSrc && !embedUrl && cleanVideoUrl ? cleanVideoUrl : null;

  const mentorAvatar =
    opp.mentor?.image?.keystoneImage?.url ||
    opp.mentor?.image?.image?.publicUrlTransformed ||
    null;
  const mentorName = displayName(opp.mentor);
  const mentorOrgLabel = formatOrganizationLabel(opp.mentor?.organization);

  const from = formatDate(opp.availableFrom);
  const to = formatDate(opp.availableTo);

  return (
    <Shell>
      <IconButton
        variant="tonal"
        elevated={false}
        onClick={() => router.back()}
        ariaLabel={backLabel}
        title={backLabel}
        icon={BACK_CHEVRON}
      />

      {coverSrc && <HeroCover $src={coverSrc} />}

      <Card>
        <TitleRow>
          <div>
            <h1>{opp.title}</h1>
            {opp.shortDescription && (
              <div
                className="MH-Type-Body-Base"
                style={{
                  marginTop: 6,
                  color: "#5f6871",
                }}
              >
                {opp.shortDescription}
              </div>
            )}
          </div>
          <div className="right">
            <FavoriteRow>
              <FavoriteButton
                active={isFavorite}
                disabled={toggling || !me?.id}
                addLabel={t("a11y.favorite.add", {}, {
                  default: "Add to favorites",
                })}
                removeLabel={t("a11y.favorite.remove", {}, {
                  default: "Remove from favorites",
                })}
                onToggle={handleToggleFavorite}
              />
              <span className="MH-Type-Label-Base">
                {isFavorite
                  ? t("exploreDetail.favorited", {}, { default: "Favorited" })
                  : t("exploreDetail.saveToFavorites", {}, {
                      default: "Save to favorites",
                    })}
              </span>
            </FavoriteRow>
            {opp.publicRatingCount > 0 && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Stars value={opp.publicRatingAverage} />
                <span className="MH-Type-Body-Base" style={{ color: "#5f6871" }}>
                  {opp.publicRatingAverage?.toFixed(1)}{" "}
                  {t(
                    "exploreDetail.ratingSummary",
                    {
                      count: opp.publicRatingCount,
                      average: opp.publicRatingAverage?.toFixed(1),
                    },
                    {
                      default: "({{count}} reviews)",
                    },
                  )}
                </span>
              </div>
            )}
            <Chip
              variant="static"
              tone={opp.status === "published" ? "success" : "neutral"}
              label={opp.status}
            />
          </div>
        </TitleRow>

        <MetaGrid>
          {(from || to) && (
            <div className="item">
              <div className="label">
                {t("exploreDetail.available", {}, { default: "Available" })}
              </div>
              <div className="value">
                {from || "—"} → {to || "—"}
              </div>
            </div>
          )}
          {opp.timeCommitment && (
            <div className="item">
              <div className="label">
                {t("exploreDetail.timeCommitment", {}, {
                  default: "Time commitment",
                })}
              </div>
              <div className="value">{opp.timeCommitment}</div>
            </div>
          )}
          <div className="item">
            <div className="label">
              {t("exploreDetail.capacity", {}, { default: "Capacity" })}
            </div>
            <div className="value">{opp.studentCapacity || 1}</div>
          </div>
          <div className="item">
            <div className="label">
              {t("exploreDetail.teamSize", {}, { default: "Team size" })}
            </div>
            <div className="value">
              {opp.teamSize > 1
                ? t(
                    "exploreDetail.teamOf",
                    { count: opp.teamSize },
                    { default: "Team of {{count}}" },
                  )
                : t("exploreDetail.solo", {}, { default: "Solo" })}
            </div>
          </div>
        </MetaGrid>
      </Card>

      {(directVideoSrc || embedUrl || fallbackIframeSrc) && (
        <Card>
          <h2>
            {t("exploreDetail.introVideo", {}, { default: "Intro video" })}
          </h2>
          {directVideoSrc ? (
            <video
              controls
              preload="metadata"
              poster={coverSrc || undefined}
              src={directVideoSrc}
              style={{
                width: "100%",
                maxHeight: 480,
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
                title={`${opp.title} intro video`}
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
        </Card>
      )}

      {opp.description && (
        <Card>
          <h2>
            {t("exploreDetail.about", {}, {
              default: "About this opportunity",
            })}
          </h2>
          <ReadOnlyTipTap
            dangerouslySetInnerHTML={{ __html: opp.description }}
          />
        </Card>
      )}

      {proposal.relevance && (
        <Card>
          <h2>
            {t("exploreDetail.relevance", {}, {
              default: "Relevance to CUSP",
            })}
          </h2>
          <p style={{ margin: 0, color: "#5f6871", whiteSpace: "pre-wrap" }}>
            {proposal.relevance}
          </p>
        </Card>
      )}

      {(proposal.expectedDeliverables.length > 0 ||
        proposal.requiredSoftware.length > 0 ||
        proposal.requiredHardware.length > 0) && (
        <Card>
          <h2>
            {t("exploreDetail.requirements", {}, {
              default: "Project requirements",
            })}
          </h2>
          {proposal.expectedDeliverables.length > 0 && (
              <div>
                <h3
                  className="MH-Type-Title-Small"
                  style={{
                    margin: "0 0 6px",
                    color: "#171717",
                  }}
                >
                  {t("exploreDetail.expectedDeliverables", {}, {
                    default: "Expected deliverables",
                  })}
                </h3>
                <p style={{ margin: 0, color: "#5f6871" }}>
                  {proposal.expectedDeliverables.join(", ")}
                  {proposal.expectedDeliverablesOther
                    ? ` — ${proposal.expectedDeliverablesOther}`
                    : ""}
                </p>
              </div>
            )}
          {proposal.requiredSoftware.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <h3
                  className="MH-Type-Title-Small"
                  style={{
                    margin: "0 0 6px",
                    color: "#171717",
                  }}
                >
                  {t("exploreDetail.software", {}, { default: "Software" })}
                </h3>
                <p style={{ margin: 0, color: "#5f6871" }}>
                  {proposal.requiredSoftware.join(", ")}
                </p>
              </div>
            )}
          {proposal.requiredHardware.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <h3
                  className="MH-Type-Title-Small"
                  style={{
                    margin: "0 0 6px",
                    color: "#171717",
                  }}
                >
                  {t("exploreDetail.hardware", {}, { default: "Hardware" })}
                </h3>
                <p style={{ margin: 0, color: "#5f6871" }}>
                  {proposal.requiredHardware.join(", ")}
                </p>
              </div>
            )}
        </Card>
      )}

      {opp.organization && (
        <Card>
          <h2>
            {t("exploreDetail.hostedBy", {}, { default: "Hosted by" })}
          </h2>
          <MentorPanel>
            {opp.organization?.logo?.url ? (
              <img
                src={opp.organization.logo.url}
                alt={opp.organization.name}
              />
            ) : (
              <span className="placeholder">
                {(opp.organization.name || "?").charAt(0).toUpperCase()}
              </span>
            )}
            <div className="info">
              <span className="name">
                {opp.organization.name}
                {opp.organization.verified && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      marginLeft: 6,
                      color: "var(--MH-Theme-Success-Dark, #1d6b3a)",
                    }}
                    title={t("a11y.verified", {}, {
                      default: "Verified",
                    })}
                  >
                    <CheckIcon />
                  </span>
                )}
              </span>
              {opp.organization.tagline && (
                <span className="tagline">{opp.organization.tagline}</span>
              )}
              {(opp.organization.department ||
                opp.organization.location) && (
                <span className="org">
                  {opp.organization.department || ""}
                  {opp.organization.department && opp.organization.location
                    ? " · "
                    : ""}
                  {opp.organization.location || ""}
                </span>
              )}
            </div>
            <div
              style={{
                marginLeft: "auto",
                display: "inline-flex",
                gap: 12,
                alignItems: "center",
              }}
            >
              {opp.organization.website && (
                <a
                  href={opp.organization.website}
                  target="_blank"
                  rel="noreferrer"
                  className="profile-link"
                >
                  {t("exploreDetail.website", {}, { default: "Website" })}{" "}
                  <ArrowOutwardIcon />
                </a>
              )}
              <Link
                href={{
                  pathname: "/dashboard/connect/organizations",
                  query: { org: opp.organization.id },
                }}
                passHref
                legacyBehavior
              >
                <a className="profile-link">
                  {t("exploreDetail.viewOrganization", {}, {
                    default: "View organization",
                  })}{" "}
                  <ArrowOutwardIcon />
                </a>
              </Link>
            </div>
          </MentorPanel>
          {opp.organization.mission && (
            <ReadOnlyTipTap
              dangerouslySetInnerHTML={{
                __html: opp.organization.mission,
              }}
            />
          )}
        </Card>
      )}

      <Card>
        <h2>
          {t("exploreDetail.yourContact", {}, { default: "Your contact" })}
        </h2>
        <MentorPanel>
          {mentorAvatar ? (
            <img src={mentorAvatar} alt={mentorName} />
          ) : (
            <span className="placeholder">
              {mentorName.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="info">
            <span className="name">{mentorName}</span>
            {opp.mentor?.tagline && (
              <span className="tagline">{opp.mentor.tagline}</span>
            )}
            {mentorOrgLabel && (
              <span className="org">
                {mentorOrgLabel}
                {opp.mentor.department ? ` · ${opp.mentor.department}` : ""}
              </span>
            )}
            {opp.mentor?.timeCommitment && (
              <span className="org">
                {t(
                  "exploreDetail.mentorTimeCommitment",
                  { value: opp.mentor.timeCommitment },
                  { default: "Time commitment: {{value}}" },
                )}
              </span>
            )}
          </div>
          {opp.mentor?.publicId && (
            <Link
              href={{
                pathname: "/dashboard/connect/with",
                query: { id: opp.mentor.publicId },
              }}
              passHref
              legacyBehavior
            >
              <a className="profile-link">
                {t("exploreDetail.viewProfile", {}, {
                  default: "View profile",
                })}{" "}
                <ArrowOutwardIcon />
              </a>
            </Link>
          )}
        </MentorPanel>
        {opp.mentor?.bio && (
          <div className="MH-Type-Body-Base" style={{ color: "#5f6871" }}>
            {opp.mentor.bio}
          </div>
        )}
      </Card>

      {opp.ratings?.length > 0 && (
        <Card>
          <h2>
            {t("exploreDetail.pastParticipants", {}, {
              default: "What past participants said",
            })}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {opp.ratings.map((r) => (
              <RatingRow key={r.id}>
                <div className="top">
                  <span className="author">{displayName(r.rater)}</span>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Stars value={r.opportunityRating} />
                    <span className="when">
                      {r.createdAt
                        ? new Date(r.createdAt).toLocaleDateString()
                        : ""}
                    </span>
                  </div>
                </div>
                {r.feedback && <div className="body">{r.feedback}</div>}
              </RatingRow>
            ))}
          </div>
        </Card>
      )}
    </Shell>
  );
}
