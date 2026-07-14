import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import Link from "next/link";
import styled from "styled-components";
import { Icon, Dropdown } from "semantic-ui-react";

import {
  EXPLORE_CONTEXT,
  EXPLORE_OPPORTUNITIES_PAGED,
} from "../../../Queries/Opportunity";
import { TOGGLE_FAVORITE_OPPORTUNITY } from "../../../Mutations/Opportunity";
import FilterBar from "../FilterBar";

const PAGE_SIZE = 12;

const Shell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding: 32px clamp(16px, 6vw, 64px);
  background-color: #f7f9f8;
  min-height: 100vh;
  border-radius: 32px 0 0 32px;
`;

const Header = styled.div`
  h1 {
    margin: 0;
    font-family: "Lato", sans-serif;
    font-size: clamp(28px, 4vw, 40px);
    font-weight: 600;
    color: #171717;
  }
  p {
    margin: 4px 0 0;
    color: #5f6871;
    font-size: 14px;
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
  background: #ffffff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0px 4px 24px rgba(0, 0, 0, 0.05);
  position: relative;
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0px 8px 32px rgba(0, 0, 0, 0.1);
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
    $src ? `url(${$src}) center/cover no-repeat #eef1f2` : "#eef1f2"};
  position: relative;

  .video-tag {
    position: absolute;
    top: 12px;
    right: 12px;
    padding: 4px 10px;
    border-radius: 100px;
    background: rgba(0, 0, 0, 0.7);
    color: #ffffff;
    font-size: 11px;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
`;

const FavoriteButton = styled.button`
  position: absolute;
  top: 10px;
  left: 10px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.95);
  color: ${({ $active }) => ($active ? "#e8174c" : "#5f6871")};
  cursor: pointer;
  font-size: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  transition: transform 0.15s ease, color 0.15s ease;
  z-index: 2;

  &:hover {
    transform: scale(1.08);
    color: #e8174c;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 18px 20px 20px;
  flex: 1;

  h3 {
    margin: 0;
    font-family: "Lato", sans-serif;
    font-size: 18px;
    font-weight: 600;
    color: #171717;
  }
  p {
    margin: 0;
    color: #5f6871;
    font-size: 13px;
    line-height: 1.4;
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
  font-size: 11px;
  color: #888;

  span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .rating {
    color: #5f6871;
    font-weight: 600;
  }
`;

const Empty = styled.div`
  padding: 48px 24px;
  text-align: center;
  background: #ffffff;
  border-radius: 16px;
  color: #5f6871;
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  padding: 16px;

  button {
    padding: 8px 16px;
    border-radius: 100px;
    border: 1px solid #d3dae0;
    background: #ffffff;
    color: #336f8a;
    font-family: "Inter", sans-serif;
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .info {
    font-size: 13px;
    color: #5f6871;
  }
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
  // Step 1: lightweight context fetch (which networks the user is in,
  // which opportunities they've favorited).
  const { data: ctxData, refetch: refetchContext } = useQuery(EXPLORE_CONTEXT, {
    fetchPolicy: "cache-and-network",
  });
  const me = ctxData?.authenticatedItem;
  const profileId = me?.id;

  // Collect every network the user can see opportunities through —
  // a student via studentIn, a teacher via teacherIn, a mentor via mentorIn.
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
      key: n.id,
      text: n.title,
      value: n.id,
    }));
  }, [me]);

  const favoriteIds = useMemo(
    () => new Set((me?.favoriteOpportunities || []).map((o) => o.id)),
    [me],
  );

  // Filter state
  const [search, setSearch] = useState("");
  const [networkFilter, setNetworkFilter] = useState(null);
  const [groupFilter, setGroupFilter] = useState(null);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [page, setPage] = useState(1);

  // Build the GraphQL `where` filter from the current state.
  const where = useMemo(() => {
    const conditions = [{ status: { equals: "published" } }];

    // Scope to the user's networks. If a specific network is selected, use it.
    if (networkFilter) {
      conditions.push({
        classNetworks: { some: { id: { equals: networkFilter } } },
      });
    } else if (networkIds.length > 0) {
      conditions.push({
        classNetworks: { some: { id: { in: networkIds } } },
      });
    } else {
      // User belongs to no networks at all — match nothing.
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
      // Favorites only with no favorites = empty result
      conditions.push({ id: { equals: "__no_favorites__" } });
    }

    return { AND: conditions };
  }, [networkFilter, networkIds, search, groupFilter, favoritesOnly, favoriteIds]);

  // Reset to page 1 when any filter changes
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
    skip: !me, // wait until we know which networks the user is in
  });

  const opportunities = pagedData?.opportunities || [];
  const total = pagedData?.opportunitiesCount || 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const [toggleFavorite] = useMutation(TOGGLE_FAVORITE_OPPORTUNITY);

  const handleToggleFavorite = async (oppId) => {
    if (!profileId) return;
    const isFavorited = favoriteIds.has(oppId);
    await toggleFavorite({
      variables: {
        profileId,
        input: {
          favoriteOpportunities: isFavorited
            ? { disconnect: [{ id: oppId }] }
            : { connect: [{ id: oppId }] },
        },
      },
    });
    refetchContext();
  };

  return (
    <Shell>
      <Header>
        <h1>Explore opportunities</h1>
        <p>
          Browse every published opportunity available to your class networks.
          Tap the heart on any card to save it for later, or open the
          opportunity for full details, intro video, and mentor info.
        </p>
      </Header>

      {networkIds.length > 0 && (
        <FilterBar>
          <input
            className="search"
            placeholder="Search opportunities…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {networkOptions.length > 1 && (
            <Dropdown
              selection
              clearable
              search
              placeholder="All networks"
              options={networkOptions}
              value={networkFilter}
              onChange={(_, { value }) => setNetworkFilter(value || null)}
            />
          )}
          <Dropdown
            selection
            clearable
            placeholder="Solo or team"
            options={[
              { key: "solo", text: "Solo (1 student)", value: "solo" },
              { key: "team", text: "Team (2+ students)", value: "team" },
            ]}
            value={groupFilter}
            onChange={(_, { value }) => setGroupFilter(value || null)}
          />
          <button
            type="button"
            onClick={() => setFavoritesOnly((v) => !v)}
            style={{
              padding: "0 18px",
              height: 42,
              borderRadius: 12,
              border: `1px solid ${favoritesOnly ? "#e8174c" : "#d3dae0"}`,
              background: favoritesOnly ? "#ffeef2" : "#ffffff",
              color: favoritesOnly ? "#e8174c" : "#5f6871",
              fontFamily: "Inter, sans-serif",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Icon name={favoritesOnly ? "heart" : "heart outline"} />
            Favorites only
          </button>
        </FilterBar>
      )}

      {networkIds.length === 0 && (
        <Empty>
          You&apos;re not in any class networks yet. Once a teacher adds you to
          a class with a network, opportunities will show up here.
        </Empty>
      )}

      {networkIds.length > 0 && loading && opportunities.length === 0 && (
        <Empty>Loading…</Empty>
      )}

      {networkIds.length > 0 && !loading && total === 0 && (
        <Empty>
          {favoritesOnly
            ? "You haven't favorited any opportunities yet. Tap the heart on a card to save it."
            : "No opportunities match the current filters."}
        </Empty>
      )}

      {opportunities.length > 0 && (
        <Grid>
          {opportunities.map((opp) => {
            const coverSrc = opp.coverImage?.url || opp.coverImageUrl || null;
            const hasVideo = !!opp.videoFile?.url || !!opp.videoUrl;
            const mentorName =
              opp.mentor?.firstName ||
              opp.mentor?.username ||
              "Unknown mentor";
            const from = formatDate(opp.availableFrom);
            const to = formatDate(opp.availableTo);
            const isFavorite = favoriteIds.has(opp.id);
            return (
              <Card key={opp.id}>
                <FavoriteButton
                  type="button"
                  $active={isFavorite}
                  aria-label={
                    isFavorite ? "Remove from favorites" : "Save to favorites"
                  }
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleToggleFavorite(opp.id);
                  }}
                >
                  <Icon
                    name={isFavorite ? "heart" : "heart outline"}
                    style={{ margin: 0 }}
                  />
                </FavoriteButton>
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
                        <span className="video-tag">
                          <Icon name="play" /> Video
                        </span>
                      )}
                    </Cover>
                    <Body>
                      <h3>{opp.title}</h3>
                      {opp.shortDescription && <p>{opp.shortDescription}</p>}
                      <Meta>
                        <span>
                          <Icon name="user" /> {mentorName}
                        </span>
                        {opp.teamSize > 1 ? (
                          <span>
                            <Icon name="group" /> Team of {opp.teamSize}
                          </span>
                        ) : (
                          <span>
                            <Icon name="user outline" /> Solo
                          </span>
                        )}
                        {(from || to) && (
                          <span>
                            <Icon name="calendar outline" /> {from || "—"} →{" "}
                            {to || "—"}
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
        <Pagination>
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <Icon name="chevron left" /> Previous
          </button>
          <span className="info">
            Page {page} of {totalPages} · {total} total
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next <Icon name="chevron right" />
          </button>
        </Pagination>
      )}
    </Shell>
  );
}
