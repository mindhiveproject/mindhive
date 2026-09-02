import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import Link from "next/link";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

import {
  EXPLORE_CONTEXT,
  EXPLORE_OPPORTUNITIES_PAGED,
} from "../../../Queries/Opportunity";
import Button from "../../../DesignSystem/Button";
import Chip from "../../../DesignSystem/Chip";
import DropdownSelect from "../../../DesignSystem/DropdownSelect";
import GuardedFavoriteOpportunityButton from "../GuardedFavoriteOpportunityButton";
import { GroupIcon, StarFilledIcon, StarIcon } from "../../../DesignSystem/Icons";
import FilterBar from "../FilterBar";
import {
  formatOpportunityMentorLabel,
  formatOpportunitySponsorLabel,
} from "../../../../lib/opportunityPeople";

const PAGE_SIZE = 12;

const Shell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding: 32px clamp(16px, 6vw, 64px);
  background-color: var(--MH-Theme-Neutrals-Lighter, #f7f9f8);
  min-height: 100vh;
  border-radius: 32px 0 0 32px;
`;

const Header = styled.div`
  h1 {
    margin: 0;
    font: var(--MH-Type-Heading-Base);
    letter-spacing: 0;
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }
  p {
    margin: 4px 0 0;
    color: var(--MH-Theme-Neutrals-Dark, #5f6871);
    font: var(--MH-Type-Body-Base);
    letter-spacing: 0;
    max-width: 640px;
  }
`;

const Grid = styled.div`
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
`;

const Card = styled.div`
  display: flex;
  flex-direction: column;
  background: var(--MH-Theme-Neutrals-White, #ffffff);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: var(--MH-Theme-Elevation-Low, 0px 4px 24px rgba(0, 0, 0, 0.05));
  position: relative;
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--MH-Theme-Elevation-Medium, 0px 8px 32px rgba(0, 0, 0, 0.1));
  }
`;

const CardLink = styled.a`
  text-decoration: none;
  color: inherit;
  display: flex;
  flex-direction: column;
  flex: 1;
  cursor: pointer;
`;

const Cover = styled.div`
  height: 140px;
  background: ${({ $src }) =>
    $src
      ? `url(${$src}) center/cover no-repeat var(--MH-Theme-Neutrals-Light, #eef1f2)`
      : "var(--MH-Theme-Neutrals-Light, #eef1f2)"};
  position: relative;
`;

const VideoTag = styled.div`
  position: absolute;
  top: 12px;
  right: 12px;
`;

const FavoriteWrap = styled.div`
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 2;
`;

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 18px 20px 20px;
  flex: 1;

  h3 {
    margin: 0;
    font: var(--MH-Type-Title-Base);
    letter-spacing: 0;
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }
  p {
    margin: 0;
    color: var(--MH-Theme-Neutrals-Dark, #5f6871);
    font: var(--MH-Type-Body-Base);
    letter-spacing: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;

const Meta = styled.div`
  margin-top: auto;
  padding-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font: var(--MH-Type-Body-Base);
  letter-spacing: 0;
  color: var(--MH-Theme-Neutrals-Medium, #888);

  span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .rating {
    color: var(--MH-Theme-Neutrals-Dark, #5f6871);
    font: var(--MH-Type-Label-Small);
    letter-spacing: 0;
  }
`;

const MetaIcon = styled.img`
  width: 16px;
  height: 16px;
  display: block;
  flex-shrink: 0;
`;

const Empty = styled.div`
  padding: 48px 24px;
  text-align: center;
  background: var(--MH-Theme-Neutrals-White, #ffffff);
  border-radius: 16px;
  color: var(--MH-Theme-Neutrals-Dark, #5f6871);
`;

const Pagination = styled.nav`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  padding: 16px;
  flex-wrap: wrap;

  .info {
    font: var(--MH-Type-Body-Base);
    letter-spacing: 0;
    color: var(--MH-Theme-Neutrals-Dark, #5f6871);
  }
`;

const FilterDropdown = styled.div`
  flex: 0 0 auto;
  min-width: 180px;
`;

function formatDate(value) {
  if (!value) return null;
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return null;
  }
}

export default function ExploreList() {
  const { t } = useTranslation("connect");

  const { data: ctxData, refetch: refetchContext } = useQuery(EXPLORE_CONTEXT, {
    fetchPolicy: "cache-and-network",
  });
  const me = ctxData?.authenticatedItem;
  const profileId = me?.id;

  const networkIds = useMemo(() => {
    const set = new Set();
    const groups = [me?.studentIn || [], me?.mentorIn || [], me?.teacherIn || []];
    groups.forEach((classes) => {
      classes.forEach((cls) => {
        (cls.networks || []).forEach((n) => {
          if (n?.id) set.add(n.id);
        });
      });
    });
    return Array.from(set);
  }, [me]);

  const networkOptions = useMemo(() => {
    const seen = new Map();
    const groups = [me?.studentIn || [], me?.mentorIn || [], me?.teacherIn || []];
    groups.forEach((classes) => {
      classes.forEach((cls) => {
        (cls.networks || []).forEach((n) => {
          if (n?.id && !seen.has(n.id)) seen.set(n.id, n);
        });
      });
    });
    return Array.from(seen.values()).map((n) => ({
      value: n.id,
      label: n.title,
    }));
  }, [me]);

  const favoriteIds = useMemo(
    () => new Set((me?.favoriteOpportunities || []).map((o) => o.id)),
    [me],
  );

  const [search, setSearch] = useState("");
  const [networkFilter, setNetworkFilter] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [page, setPage] = useState(1);

  const groupOptions = useMemo(
    () => [
      {
        value: "solo",
        label: t("exploreList.groupSolo", {}, { default: "Solo (1 student)" }),
      },
      {
        value: "team",
        label: t("exploreList.groupTeam", {}, { default: "Team (2+ students)" }),
      },
    ],
    [t],
  );

  const where = useMemo(() => {
    const conditions = [{ status: { equals: "published" } }];

    if (networkFilter) {
      conditions.push({
        classNetworks: { some: { id: { equals: networkFilter } } },
      });
    } else if (networkIds.length > 0) {
      conditions.push({
        classNetworks: { some: { id: { in: networkIds } } },
      });
    } else {
      conditions.push({ id: { equals: "__no_networks__" } });
    }

    if (search.trim()) {
      const q = search.trim();
      conditions.push({
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { shortDescription: { contains: q, mode: "insensitive" } },
        ],
      });
    }

    if (groupFilter === "solo") {
      conditions.push({ teamSize: { lte: 1 } });
    } else if (groupFilter === "team") {
      conditions.push({ teamSize: { gt: 1 } });
    }

    if (favoritesOnly && favoriteIds.size > 0) {
      conditions.push({ id: { in: Array.from(favoriteIds) } });
    } else if (favoritesOnly) {
      conditions.push({ id: { equals: "__no_favorites__" } });
    }

    return { AND: conditions };
  }, [networkFilter, networkIds, search, groupFilter, favoritesOnly, favoriteIds]);

  useEffect(() => {
    setPage(1);
  }, [search, networkFilter, groupFilter, favoritesOnly]);

  const { data: pagedData, loading } = useQuery(EXPLORE_OPPORTUNITIES_PAGED, {
    variables: {
      where,
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    },
    fetchPolicy: "cache-and-network",
    skip: !me,
  });

  const opportunities = pagedData?.opportunities || [];
  const total = pagedData?.opportunitiesCount || 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <Shell>
      <Header>
        <h1>
          {t("exploreList.pageTitle", {}, { default: "Explore opportunities" })}
        </h1>
        <p>
          {t("exploreList.description", {}, {
            default:
              "Browse every published opportunity available to your class networks. Tap the star on any card to save it for later, or open the opportunity for full details, intro video, and mentor info.",
          })}
        </p>
      </Header>

      {networkIds.length > 0 && (
        <FilterBar>
          <input
            className="search"
            type="search"
            placeholder={t("exploreList.searchPlaceholder", {}, {
              default: "Search opportunities…",
            })}
            aria-label={t("exploreList.searchLabel", {}, {
              default: "Search opportunities",
            })}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {networkOptions.length > 1 && (
            <FilterDropdown>
              <DropdownSelect
                value={networkFilter}
                options={networkOptions}
                onChange={setNetworkFilter}
                fitContent
                searchableSingle
                placeholder={t("exploreList.networkFilterPlaceholder", {}, {
                  default: "All networks",
                })}
                ariaLabel={t("exploreList.networkFilterLabel", {}, {
                  default: "Filter by network",
                })}
              />
            </FilterDropdown>
          )}
          <FilterDropdown>
            <DropdownSelect
              value={groupFilter}
              options={groupOptions}
              onChange={setGroupFilter}
              fitContent
              placeholder={t("exploreList.groupFilterPlaceholder", {}, {
                default: "Solo or team",
              })}
              ariaLabel={t("exploreList.groupFilterLabel", {}, {
                default: "Filter by team size",
              })}
            />
          </FilterDropdown>
          <Chip
            variant="interactive"
            selected={favoritesOnly}
            label={t("exploreList.favoritesOnly", {}, { default: "Favorites only" })}
            leading={
              <span
                aria-hidden
                style={{
                  display: "flex",
                  color: favoritesOnly
                    ? "var(--MH-Theme-Accent-Base, #f2be42)"
                    : "currentColor",
                }}
              >
                {favoritesOnly ? <StarFilledIcon /> : <StarIcon />}
              </span>
            }
            onClick={() => setFavoritesOnly((v) => !v)}
            aria-pressed={favoritesOnly}
          />
        </FilterBar>
      )}

      {networkIds.length === 0 && (
        <Empty>
          {t("exploreList.noNetworks", {}, {
            default:
              "You're not in any class networks yet. Once a teacher adds you to a class with a network, opportunities will show up here.",
          })}
        </Empty>
      )}

      {networkIds.length > 0 && loading && opportunities.length === 0 && (
        <Empty>
          {t("exploreList.loading", {}, { default: "Loading…" })}
        </Empty>
      )}

      {networkIds.length > 0 && !loading && total === 0 && (
        <Empty>
          {favoritesOnly
            ? t("exploreList.emptyFavorites", {}, {
                default:
                  "You haven't favorited any opportunities yet. Tap the star on a card to save it.",
              })
            : t("exploreList.emptyFiltered", {}, {
                default: "No opportunities match the current filters.",
              })}
        </Empty>
      )}

      {opportunities.length > 0 && (
        <Grid>
          {opportunities.map((opp) => {
            const coverSrc = opp.coverImage?.url || opp.coverImageUrl || null;
            const hasVideo = !!opp.videoFile?.url || !!opp.videoUrl;
            const sponsorName = formatOpportunitySponsorLabel(opp);
            const mentorName = formatOpportunityMentorLabel(opp, t);
            const from = formatDate(opp.availableFrom);
            const to = formatDate(opp.availableTo);
            const isFavorite = favoriteIds.has(opp.id);
            return (
              <Card key={opp.id}>
                <FavoriteWrap>
                  <GuardedFavoriteOpportunityButton
                    opportunityId={opp.id}
                    isFavorite={isFavorite}
                    refetchQueries={[{ query: EXPLORE_CONTEXT }]}
                    onAfterToggle={refetchContext}
                  />
                </FavoriteWrap>
                <Link
                  href={{
                    pathname: "/dashboard/connect/explore",
                    query: { op: opp.id },
                  }}
                  passHref
                  legacyBehavior
                >
                  <CardLink>
                    <Cover $src={coverSrc}>
                      {hasVideo && (
                        <VideoTag>
                          <Chip
                            variant="static"
                            tone="neutral"
                            label={t("exploreList.videoTag", {}, {
                              default: "Video",
                            })}
                            leading={
                              <MetaIcon
                                src="/assets/icons/builder/play.svg"
                                alt=""
                                aria-hidden
                              />
                            }
                          />
                        </VideoTag>
                      )}
                    </Cover>
                    <Body>
                      <h3>{opp.title}</h3>
                      {opp.shortDescription && <p>{opp.shortDescription}</p>}
                      <Meta>
                        <span>
                          <MetaIcon
                            src="/assets/connect/user.svg"
                            alt=""
                            aria-hidden
                          />
                          {sponsorName}
                        </span>
                        <span>
                          <MetaIcon
                            src="/assets/connect/user.svg"
                            alt=""
                            aria-hidden
                          />
                          {mentorName}
                        </span>
                        {opp.teamSize > 1 ? (
                          <span>
                            <GroupIcon />
                            {t(
                              "exploreList.teamOf",
                              { count: opp.teamSize },
                              { default: "Team of {{count}}" },
                            )}
                          </span>
                        ) : (
                          <span>
                            <MetaIcon
                              src="/assets/connect/user.svg"
                              alt=""
                              aria-hidden
                            />
                            {t("exploreList.solo", {}, { default: "Solo" })}
                          </span>
                        )}
                        {(from || to) && (
                          <span>
                            {from || "—"} → {to || "—"}
                          </span>
                        )}
                        {opp.publicRatingCount > 0 && (
                          <span className="rating">
                            <span style={{ color: "#f5b800" }}>★</span>
                            {opp.publicRatingAverage?.toFixed(1)} (
                            {opp.publicRatingCount})
                          </span>
                        )}
                      </Meta>
                    </Body>
                  </CardLink>
                </Link>
              </Card>
            );
          })}
        </Grid>
      )}

      {totalPages > 1 && (
        <Pagination
          aria-label={t("exploreList.paginationLabel", {}, {
            default: "Opportunities pagination",
          })}
        >
          <Button
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            {t("exploreList.previous", {}, { default: "Previous" })}
          </Button>
          <span className="info">
            {t(
              "exploreList.paginationInfo",
              { page, totalPages, total },
              {
                default: "Page {{page}} of {{totalPages}} · {{total}} total",
              },
            )}
          </span>
          <Button
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            {t("exploreList.next", {}, { default: "Next" })}
          </Button>
        </Pagination>
      )}
    </Shell>
  );
}
