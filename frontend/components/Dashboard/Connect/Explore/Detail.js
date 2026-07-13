import { useMemo } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import Link from "next/link";
import styled from "styled-components";
import { Icon, Label } from "semantic-ui-react";

import { EXPLORE_OPPORTUNITY_DETAIL } from "../../../Queries/Opportunity";
import { TOGGLE_FAVORITE_OPPORTUNITY } from "../../../Mutations/Opportunity";
import { ReadOnlyTipTap } from "../../../TipTap/ReadOnlyTipTap";
import { hydrateProposalInputs } from "../Opportunities/OpportunityProposalConfig";

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
  background-color: #f7f9f8;
  min-height: 100vh;
  border-radius: 32px 0 0 32px;
`;

const BackLink = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: #336f8a;
  font-family: "Nunito", sans-serif;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  padding: 0;
  width: max-content;
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
    font-family: "Lato", sans-serif;
    font-size: 18px;
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
    font-family: "Lato", sans-serif;
    font-size: clamp(28px, 4vw, 36px);
    font-weight: 600;
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
      font-size: 11px;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .value {
      font-size: 14px;
      color: #171717;
      font-weight: 600;
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
    font-weight: 600;
    font-size: 22px;
    flex: none;
  }

  .info {
    display: flex;
    flex-direction: column;
    gap: 2px;

    .name {
      font-weight: 600;
      color: #171717;
    }
    .tagline {
      color: #5f6871;
      font-size: 13px;
    }
    .org {
      color: #888;
      font-size: 12px;
    }
  }

  a.profile-link {
    margin-left: auto;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: #336f8a;
    font-size: 13px;
    font-weight: 600;
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
    font-weight: 600;
    font-size: 13px;
    color: #171717;
  }
  .when {
    color: #888;
    font-size: 12px;
  }
  .body {
    color: #5f6871;
    font-size: 14px;
    line-height: 1.5;
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

  // Find any active round that includes this opportunity AND covers a class
  // network I'm a student in. Pick the soonest-closing one.
  const activeRound = useMemo(() => {
    const seen = new Map();
    (me?.studentIn || []).forEach((cls) => {
      (cls.networks || []).forEach((net) => {
        (net.connectRounds || []).forEach((round) => {
          // We may see the same round via multiple classes — dedupe.
          if (!seen.has(round.id)) seen.set(round.id, round);
        });
      });
    });
    const rounds = Array.from(seen.values()).filter((r) => {
      if (r.status === "draft") return false;
      const now = Date.now();
      const openAt = r.openAt ? new Date(r.openAt).getTime() : null;
      const closeAt = r.closeAt ? new Date(r.closeAt).getTime() : null;
      if (openAt && now < openAt) return false;
      if (closeAt && now > closeAt) return false;
      return true;
    });
    rounds.sort((a, b) => {
      const ac = a.closeAt ? new Date(a.closeAt).getTime() : Infinity;
      const bc = b.closeAt ? new Date(b.closeAt).getTime() : Infinity;
      return ac - bc;
    });
    return rounds[0] || null;
  }, [me]);

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
        <p>Loading opportunity…</p>
      </Shell>
    );
  }
  if (!opp) {
    return (
      <Shell>
        <p>Opportunity not found, or no longer available.</p>
        <BackLink type="button" onClick={() => router.back()}>
          <Icon name="arrow left" /> Back
        </BackLink>
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

  const from = formatDate(opp.availableFrom);
  const to = formatDate(opp.availableTo);

  return (
    <Shell>
      <BackLink type="button" onClick={() => router.back()}>
        <Icon name="arrow left" /> Back to all opportunities
      </BackLink>

      {coverSrc && <HeroCover $src={coverSrc} />}

      {activeRound && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
            padding: "16px 20px",
            borderRadius: 16,
            background: "#e3f4ec",
            border: "1px solid #b6dec7",
          }}
        >
          <div
            style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 36,
                height: 36,
                borderRadius: 50,
                background: "#1d6b3a",
                color: "#ffffff",
                flex: "none",
              }}
            >
              <Icon name="bullhorn" style={{ margin: 0 }} />
            </span>
            <div>
              <div style={{ fontWeight: 600, color: "#1d6b3a" }}>
                Active in &ldquo;{activeRound.title}&rdquo;
              </div>
              <div style={{ fontSize: 13, color: "#1d6b3a" }}>
                {activeRound.closeAt ? (
                  <>
                    Preferences close on{" "}
                    {new Date(activeRound.closeAt).toLocaleDateString()}
                    {activeRound.classNetwork?.title &&
                      ` · ${activeRound.classNetwork.title}`}
                  </>
                ) : (
                  <>Preferences are open now</>
                )}
              </div>
            </div>
          </div>
          <Link
            href={{
              pathname: "/dashboard/connect/participate",
              query: { round: activeRound.id },
            }}
            passHref
            legacyBehavior
          >
            <a
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 18px",
                borderRadius: 100,
                background: "#1d6b3a",
                color: "#ffffff",
                fontFamily: "Nunito, sans-serif",
                fontWeight: 600,
                fontSize: 14,
                textDecoration: "none",
              }}
            >
              Submit preferences <Icon name="arrow right" />
            </a>
          </Link>
        </div>
      )}

      <Card>
        <TitleRow>
          <div>
            <h1>{opp.title}</h1>
            {opp.shortDescription && (
              <div
                style={{
                  marginTop: 6,
                  color: "#5f6871",
                  fontSize: 15,
                }}
              >
                {opp.shortDescription}
              </div>
            )}
          </div>
          <div className="right">
            <button
              type="button"
              onClick={handleToggleFavorite}
              disabled={toggling || !me?.id}
              aria-label={
                isFavorite ? "Remove from favorites" : "Save to favorites"
              }
              style={{
                padding: "8px 14px",
                borderRadius: 100,
                border: `1px solid ${isFavorite ? "#e8174c" : "#d3dae0"}`,
                background: isFavorite ? "#ffeef2" : "#ffffff",
                color: isFavorite ? "#e8174c" : "#5f6871",
                fontFamily: "Nunito, sans-serif",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Icon
                name={isFavorite ? "heart" : "heart outline"}
                style={{ margin: 0 }}
              />
              {isFavorite ? "Favorited" : "Save to favorites"}
            </button>
            {opp.publicRatingCount > 0 && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Stars value={opp.publicRatingAverage} />
                <span style={{ color: "#5f6871", fontSize: 13 }}>
                  {opp.publicRatingAverage?.toFixed(1)} (
                  {opp.publicRatingCount} review
                  {opp.publicRatingCount === 1 ? "" : "s"})
                </span>
              </div>
            )}
            <Label
              color={opp.status === "published" ? "green" : "grey"}
              size="tiny"
            >
              {opp.status}
            </Label>
          </div>
        </TitleRow>

        <MetaGrid>
          {(from || to) && (
            <div className="item">
              <div className="label">Available</div>
              <div className="value">
                {from || "—"} → {to || "—"}
              </div>
            </div>
          )}
          {opp.timeCommitment && (
            <div className="item">
              <div className="label">Time commitment</div>
              <div className="value">{opp.timeCommitment}</div>
            </div>
          )}
          <div className="item">
            <div className="label">Capacity</div>
            <div className="value">{opp.studentCapacity || 1}</div>
          </div>
          <div className="item">
            <div className="label">Team size</div>
            <div className="value">
              {opp.teamSize > 1 ? `Team of ${opp.teamSize}` : "Solo"}
            </div>
          </div>
        </MetaGrid>
      </Card>

      {(directVideoSrc || embedUrl || fallbackIframeSrc) && (
        <Card>
          <h2>Intro video</h2>
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
          <h2>About this opportunity</h2>
          <ReadOnlyTipTap
            dangerouslySetInnerHTML={{ __html: opp.description }}
          />
        </Card>
      )}

      {proposal.relevance && (
        <Card>
          <h2>Relevance to CUSP</h2>
          <p style={{ margin: 0, color: "#5f6871", whiteSpace: "pre-wrap" }}>
            {proposal.relevance}
          </p>
        </Card>
      )}

      {(proposal.expectedDeliverables.length > 0 ||
        proposal.requiredSoftware.length > 0 ||
        proposal.requiredHardware.length > 0) && (
        <Card>
          <h2>Project requirements</h2>
          {proposal.expectedDeliverables.length > 0 && (
              <div>
                <h3
                  style={{
                    margin: "0 0 6px",
                    fontSize: 14,
                    color: "#171717",
                    fontWeight: 600,
                  }}
                >
                  Expected deliverables
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
                  style={{
                    margin: "0 0 6px",
                    fontSize: 14,
                    color: "#171717",
                    fontWeight: 600,
                  }}
                >
                  Software
                </h3>
                <p style={{ margin: 0, color: "#5f6871" }}>
                  {proposal.requiredSoftware.join(", ")}
                </p>
              </div>
            )}
          {proposal.requiredHardware.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <h3
                  style={{
                    margin: "0 0 6px",
                    fontSize: 14,
                    color: "#171717",
                    fontWeight: 600,
                  }}
                >
                  Hardware
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
          <h2>Hosted by</h2>
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
                  <Icon
                    name="check circle"
                    style={{
                      color: "#1d6b3a",
                      marginLeft: 6,
                    }}
                    title="Verified organization"
                  />
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
                  Website <Icon name="external alternate" />
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
                  View organization <Icon name="arrow right" />
                </a>
              </Link>
            </div>
          </MentorPanel>
          {opp.organization.mission && (
            <div
              style={{
                color: "#5f6871",
                fontSize: 14,
                lineHeight: 1.5,
                whiteSpace: "pre-wrap",
              }}
            >
              {opp.organization.mission}
            </div>
          )}
        </Card>
      )}

      <Card>
        <h2>Your contact</h2>
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
            {opp.mentor?.organization && (
              <span className="org">
                {opp.mentor.organization}
                {opp.mentor.department ? ` · ${opp.mentor.department}` : ""}
              </span>
            )}
            {opp.mentor?.timeCommitment && (
              <span className="org">
                Time commitment: {opp.mentor.timeCommitment}
              </span>
            )}
          </div>
          {opp.mentor?.publicReadableId && (
            <Link
              href={{
                pathname: "/dashboard/connect/with",
                query: { id: opp.mentor.publicReadableId },
              }}
              passHref
              legacyBehavior
            >
              <a className="profile-link">
                View profile <Icon name="arrow right" />
              </a>
            </Link>
          )}
        </MentorPanel>
        {opp.mentor?.bio && (
          <div style={{ color: "#5f6871", fontSize: 14, lineHeight: 1.5 }}>
            {opp.mentor.bio}
          </div>
        )}
      </Card>

      {opp.ratings?.length > 0 && (
        <Card>
          <h2>What past participants said</h2>
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
