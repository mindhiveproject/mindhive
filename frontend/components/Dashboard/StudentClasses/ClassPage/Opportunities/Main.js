import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

import Chip from "../../../../DesignSystem/Chip";
import MessageCard from "../../../../DesignSystem/MessageCard";
import {
  SearchIcon,
  StarFilledIcon,
  StarIcon,
} from "../../../../DesignSystem/Icons";
import { RECORD_OPPORTUNITY_PREVIEW_VISIT } from "../../../../Mutations/Log";
import { CLASS_STUDENT_OPPORTUNITIES } from "../../../../Queries/ConnectRound";
import {
  getDistinctProjectCategories,
  getProjectCategoryDisplay,
} from "../../../../../lib/opportunityCategory";
import {
  BrowseCardsGrid,
  BrowseSearchField,
} from "../../../Connect/ConnectBrowseLayout";
import OpportunityConnectCard from "../../../Connect/OpportunityConnectCard";
import StudentOpportunityPreview from "./StudentOpportunityPreview";
import StudentPreferenceSubmission from "./StudentPreferenceSubmission";

/**
 * Matching rounds are "open for students" when status is preferences_open
 * (same gate as Connect Participate: students can view/rank then).
 */
const STUDENT_OPEN_ROUND_STATUS = "preferences_open";
const MIN_DWELL_MS = 1000;

function opportunitySearchHaystack(opportunity) {
  const mentor = [
    opportunity?.mentor?.firstName,
    opportunity?.mentor?.lastName,
    opportunity?.mentor?.username,
  ]
    .filter(Boolean)
    .join(" ");
  return [
    opportunity?.title,
    opportunity?.shortDescription,
    opportunity?.organization?.name,
    mentor,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

const Page = styled.div`
  display: grid;
  gap: 20px;
  width: 100%;
  max-width: 920px;
  justify-self: center;
`;

const RankBanners = styled.div`
  display: grid;
  gap: 12px;
  width: 100%;
`;

const Filters = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 16px;
  width: 100%;
`;

const FilterRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`;

const CategoryFilterRow = styled(FilterRow)`
  margin-left: auto;
`;

const SearchField = styled(BrowseSearchField)`
  flex: 1 1 220px;
  min-width: min(100%, 220px);
  max-width: 480px;
`;

export default function StudentClassOpportunities({ myclass, user, query }) {
  const { t } = useTranslation("classes");
  const { t: tConnect } = useTranslation("connect");
  const router = useRouter();
  const [filterMode, setFilterMode] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const sessionRef = useRef(null);
  const flushedRef = useRef(false);
  const startPreviewSessionRef = useRef(null);

  const [recordVisit] = useMutation(RECORD_OPPORTUNITY_PREVIEW_VISIT);

  const classCode = myclass?.code;
  // Prefer router.query so shallow back navigation clears the rank/preview subviews.
  const requestedRoundId =
    typeof router.query?.round === "string" ? router.query.round : null;
  const requestedOpportunityId =
    typeof router.query?.opportunity === "string"
      ? router.query.opportunity
      : null;

  const { data, loading } = useQuery(CLASS_STUDENT_OPPORTUNITIES, {
    variables: { code: classCode },
    skip: !classCode,
    fetchPolicy: "cache-and-network",
  });

  const networks = data?.class?.networks || myclass?.networks || [];
  const classId = data?.class?.id || myclass?.id || null;

  const favoriteIds = useMemo(
    () =>
      new Set((user?.favoriteOpportunities || []).map((opp) => opp?.id).filter(Boolean)),
    [user?.favoriteOpportunities],
  );

  const {
    isOpenForStudents,
    opportunities,
    opportunityRoundIds,
    openRounds,
    classRoundIds,
    opportunityIds,
  } = useMemo(() => {
    const byId = new Map();
    const roundByOpportunityId = new Map();
    const openById = new Map();
    const allRoundIds = new Set();
    let hasOpenRound = false;

    for (const network of networks) {
      for (const round of network?.connectRounds || []) {
        if (!round?.id) continue;
        allRoundIds.add(round.id);

        if (round.status === STUDENT_OPEN_ROUND_STATUS) {
          hasOpenRound = true;
          if (!openById.has(round.id)) {
            openById.set(round.id, {
              id: round.id,
              title: round.title || "",
            });
          }
          for (const opportunity of round.opportunities || []) {
            if (!opportunity?.id) continue;
            if (!byId.has(opportunity.id)) {
              byId.set(opportunity.id, opportunity);
            }
            if (!roundByOpportunityId.has(opportunity.id)) {
              roundByOpportunityId.set(opportunity.id, round.id);
            }
          }
        }
      }
    }

    return {
      isOpenForStudents: hasOpenRound,
      opportunities: Array.from(byId.values()),
      opportunityRoundIds: roundByOpportunityId,
      openRounds: Array.from(openById.values()),
      classRoundIds: allRoundIds,
      opportunityIds: new Set(byId.keys()),
    };
  }, [networks]);

  const clearOpportunitiesQuery = useCallback(() => {
    if (!classCode) return;
    router.push({
      pathname: `/dashboard/classes/${classCode}`,
      query: { page: "opportunities" },
    });
  }, [classCode, router]);

  const clearRoundQuery = useCallback(() => {
    if (!classCode) return;
    router.push({
      pathname: `/dashboard/classes/${classCode}`,
      query: { page: "opportunities" },
    });
  }, [classCode, router]);

  // Invalid deep-links: replace so the bad URL does not stay in history.
  const stripInvalidOpportunitiesQuery = useCallback(() => {
    if (!classCode) return;
    router.replace({
      pathname: `/dashboard/classes/${classCode}`,
      query: { page: "opportunities" },
    });
  }, [classCode, router]);

  const openRankRound = useCallback(
    (roundId) => {
      if (!classCode || !roundId) return;
      router.push({
        pathname: `/dashboard/classes/${classCode}`,
        query: { page: "opportunities", round: roundId },
      });
    },
    [classCode, router],
  );

  // Strip invalid round deep-links once class rounds are known.
  useEffect(() => {
    if (!requestedRoundId || loading) return;
    if (!data?.class && !myclass?.networks) return;
    if (classRoundIds.has(requestedRoundId)) return;
    stripInvalidOpportunitiesQuery();
  }, [
    requestedRoundId,
    loading,
    data?.class,
    myclass?.networks,
    classRoundIds,
    stripInvalidOpportunitiesQuery,
  ]);

  // Strip invalid opportunity deep-links once class opportunities are known.
  // Preview wins over ranking when both params are present.
  useEffect(() => {
    if (!requestedOpportunityId || loading) return;
    if (!data?.class && !myclass?.networks) return;
    if (opportunityIds.has(requestedOpportunityId)) return;
    stripInvalidOpportunitiesQuery();
  }, [
    requestedOpportunityId,
    loading,
    data?.class,
    myclass?.networks,
    opportunityIds,
    stripInvalidOpportunitiesQuery,
  ]);

  // Preview wins over ranking when both params are present. Show immediately so
  // the class chrome (already hidden by ClassPage) is not replaced by the list.
  const showPreviewSubview = Boolean(requestedOpportunityId);

  const showRankSubview =
    !showPreviewSubview && Boolean(requestedRoundId);

  const categoryOptions = useMemo(
    () => getDistinctProjectCategories(opportunities),
    [opportunities],
  );

  const showCategoryFilters = categoryOptions.length >= 2;

  useEffect(() => {
    if (
      categoryFilter &&
      (!showCategoryFilters || !categoryOptions.includes(categoryFilter))
    ) {
      setCategoryFilter(null);
    }
  }, [categoryFilter, categoryOptions, showCategoryFilters]);

  const filteredOpportunities = useMemo(() => {
    let list = opportunities;
    if (filterMode === "favorites") {
      list = list.filter((opp) => favoriteIds.has(opp.id));
    }
    if (categoryFilter) {
      list = list.filter((opp) => opp.projectCategory === categoryFilter);
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((opp) => opportunitySearchHaystack(opp).includes(q));
    }
    return list;
  }, [opportunities, filterMode, favoriteIds, categoryFilter, searchQuery]);

  const flushPreviewSession = useCallback(async () => {
    const session = sessionRef.current;
    if (!session || flushedRef.current) return;

    const closeAt = new Date();
    const dwellMs = closeAt.getTime() - session.openAt.getTime();
    flushedRef.current = true;
    sessionRef.current = null;

    if (
      dwellMs < MIN_DWELL_MS ||
      !session.opportunityId ||
      !session.roundId ||
      !session.classId
    ) {
      return;
    }

    try {
      await recordVisit({
        variables: {
          opportunityId: session.opportunityId,
          classId: session.classId,
          roundId: session.roundId,
          openAt: session.openAt.toISOString(),
          closeAt: closeAt.toISOString(),
        },
      });
    } catch (err) {
      // Preview tracking must not block leaving the preview.
      console.warn("Failed to record opportunity preview visit", err);
    }
  }, [recordVisit]);

  const startPreviewSession = useCallback(
    (opportunityId) => {
      if (!opportunityId || !classId) return;
      const roundId = opportunityRoundIds.get(opportunityId);
      if (!roundId) return;
      if (
        sessionRef.current?.opportunityId === opportunityId &&
        sessionRef.current?.classId === classId &&
        sessionRef.current?.roundId === roundId &&
        !flushedRef.current
      ) {
        return;
      }
      flushedRef.current = false;
      sessionRef.current = {
        opportunityId,
        classId,
        roundId,
        openAt: new Date(),
      };
    },
    [classId, opportunityRoundIds],
  );
  startPreviewSessionRef.current = startPreviewSession;

  const handleOpenPreview = useCallback(
    (id) => {
      if (!classCode || !id) return;
      if (requestedOpportunityId && requestedOpportunityId !== id) {
        void flushPreviewSession();
      }
      router.push({
        pathname: `/dashboard/classes/${classCode}`,
        query: { page: "opportunities", opportunity: id },
      });
    },
    [classCode, flushPreviewSession, requestedOpportunityId, router],
  );

  const handleClosePreview = useCallback(() => {
    void flushPreviewSession();
    clearOpportunitiesQuery();
  }, [clearOpportunitiesQuery, flushPreviewSession]);

  const handleCategoryChipClick = useCallback((value) => {
    setCategoryFilter((prev) => (prev === value ? null : value));
  }, []);

  // Start (or resume) dwell once class/round context is available.
  useEffect(() => {
    if (!showPreviewSubview || !requestedOpportunityId) return;
    startPreviewSession(requestedOpportunityId);
  }, [requestedOpportunityId, showPreviewSubview, startPreviewSession]);

  useEffect(() => {
    if (!showPreviewSubview || !requestedOpportunityId) return undefined;

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        void flushPreviewSession();
      } else if (
        document.visibilityState === "visible" &&
        requestedOpportunityId &&
        !sessionRef.current
      ) {
        startPreviewSessionRef.current?.(requestedOpportunityId);
      }
    };

    const onPageHide = () => {
      void flushPreviewSession();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHide);
      void flushPreviewSession();
    };
  }, [flushPreviewSession, requestedOpportunityId, showPreviewSubview]);

  if (showPreviewSubview) {
    return (
      <StudentOpportunityPreview
        opportunityId={requestedOpportunityId}
        onClose={handleClosePreview}
        user={user}
        classId={classId}
        roundId={opportunityRoundIds.get(requestedOpportunityId) || null}
      />
    );
  }

  if (showRankSubview) {
    return (
      <StudentPreferenceSubmission
        roundId={requestedRoundId}
        user={user}
        onBack={clearRoundQuery}
      />
    );
  }

  if (loading && !data?.class) {
    return (
      <div className="classTabPage opportunities">
        <MessageCard
          variant="information"
          message={t("opportunities.studentView.loading", {}, {
            default: "Loading opportunities…",
          })}
        />
      </div>
    );
  }

  if (!isOpenForStudents) {
    const title = t("opportunities.studentView.notAvailableTitle", {}, {
      default: "Opportunities aren’t available yet",
    });
    const hint = t("opportunities.studentView.notAvailableHint", {}, {
      default:
        "When your teacher opens the matching round, selected opportunities will appear here.",
    });
    return (
      <div className="classTabPage opportunities">
        <MessageCard
          variant="neutral"
          message={`${title} ${hint}`}
          ariaLabel={`${title} ${hint}`}
        />
      </div>
    );
  }

  if (opportunities.length === 0) {
    const title = t("opportunities.studentView.emptyTitle", {}, {
      default: "No opportunities yet",
    });
    const hint = t("opportunities.studentView.emptyHint", {}, {
      default:
        "Your teacher hasn’t selected any opportunities for this round yet. Check back soon.",
    });
    return (
      <div className="classTabPage opportunities">
        {openRounds.length > 0 ? (
          <RankBanners>
            {openRounds.map((round) => {
              const roundTitle = round.title?.trim() || round.id;
              const message = t(
                "opportunities.studentView.rankBanner",
                { roundTitle },
                {
                  default:
                    "Rank your favorite opportunity in {{roundTitle}}",
                },
              );
              return (
                <MessageCard
                  key={round.id}
                  variant="information"
                  message={message}
                  ariaLabel={message}
                  onClick={() => openRankRound(round.id)}
                />
              );
            })}
          </RankBanners>
        ) : null}
        <MessageCard
          variant="neutral"
          message={`${title} ${hint}`}
          ariaLabel={`${title} ${hint}`}
        />
      </div>
    );
  }

  const filterAllLabel = t("opportunities.studentView.filterAll", {}, {
    default: "All",
  });
  const filterFavoritesLabel = t(
    "opportunities.studentView.filterFavorites",
    {},
    { default: "Favorites" },
  );

  const emptyFavoritesTitle = t(
    "opportunities.studentView.emptyFavoritesTitle",
    {},
    { default: "No favorites yet" },
  );
  const emptyFavoritesHint = t(
    "opportunities.studentView.emptyFavoritesHint",
    {},
    {
      default:
        "Tap the star on an opportunity to save it here.",
    },
  );
  const emptyCategoryTitle = t(
    "opportunities.studentView.emptyCategoryTitle",
    {},
    { default: "No opportunities in this category" },
  );
  const emptyCategoryHint = t(
    "opportunities.studentView.emptyCategoryHint",
    {},
    {
      default:
        "Try another category, or clear the category filter.",
    },
  );
  const emptySearchTitle = t(
    "opportunities.studentView.emptySearchTitle",
    {},
    { default: "No matching opportunities" },
  );
  const emptySearchHint = t(
    "opportunities.studentView.emptySearchHint",
    {},
    {
      default: "Try a different search, or clear the search field.",
    },
  );
  const searchLabel = t(
    "opportunities.studentView.searchLabel",
    {},
    { default: "Search opportunities" },
  );
  const searchPlaceholder = t(
    "opportunities.studentView.searchPlaceholder",
    {},
    { default: "Search by title, sponsor, or organization…" },
  );

  const hasSearch = Boolean(searchQuery.trim());
  let emptyTitle = emptyFavoritesTitle;
  let emptyHint = emptyFavoritesHint;
  if (hasSearch) {
    emptyTitle = emptySearchTitle;
    emptyHint = emptySearchHint;
  } else if (categoryFilter) {
    emptyTitle = emptyCategoryTitle;
    emptyHint = emptyCategoryHint;
  }

  return (
    <div className="classTabPage opportunities">
      {openRounds.length > 0 ? (
        <RankBanners>
          {openRounds.map((round) => {
            const roundTitle = round.title?.trim() || round.id;
            const message = t(
              "opportunities.studentView.rankBanner",
              { roundTitle },
              {
                default: "Rank your favorite opportunity in {{roundTitle}}",
              },
            );
            return (
              <MessageCard
                key={round.id}
                variant="information"
                message={message}
                ariaLabel={message}
                onClick={() => openRankRound(round.id)}
              />
            );
          })}
        </RankBanners>
      ) : null}

      <Filters>
        <FilterRow
          role="group"
          aria-label={t(
            "opportunities.studentView.filterLabel",
            {},
            { default: "Filter opportunities" },
          )}
        >
          <Chip
            shape="square"
            label={filterAllLabel}
            selected={filterMode === "all"}
            onClick={() => setFilterMode("all")}
            ariaLabel={filterAllLabel}
          />
          <Chip
            shape="square"
            label={filterFavoritesLabel}
            selected={filterMode === "favorites"}
            onClick={() => setFilterMode("favorites")}
            ariaLabel={filterFavoritesLabel}
            leading={
              filterMode === "favorites" ? (
                <StarFilledIcon width={18} height={18} />
              ) : (
                <StarIcon width={18} height={18} />
              )
            }
          />
        </FilterRow>

        <SearchField>
          <SearchIcon className="search-icon" width={20} height={20} />
          <input
            type="search"
            name="opportunitySearch"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchLabel}
          />
        </SearchField>

        {showCategoryFilters ? (
          <CategoryFilterRow
            role="group"
            aria-label={t(
              "opportunities.studentView.filterCategoryLabel",
              {},
              { default: "Filter by project category" },
            )}
          >
            {categoryOptions.map((value) => {
              const label =
                getProjectCategoryDisplay(value, null, tConnect) || value;
              return (
                <Chip
                  key={value}
                  shape="pill"
                  label={label}
                  selected={categoryFilter === value}
                  onClick={() => handleCategoryChipClick(value)}
                  ariaLabel={label}
                />
              );
            })}
          </CategoryFilterRow>
        ) : null}
      </Filters>

      <Page>
        {filteredOpportunities.length === 0 ? (
          <MessageCard
            variant="neutral"
            message={`${emptyTitle} ${emptyHint}`}
            ariaLabel={`${emptyTitle} ${emptyHint}`}
          />
        ) : (
          <BrowseCardsGrid>
            {filteredOpportunities.map((opportunity) => (
              <OpportunityConnectCard
                key={opportunity.id}
                opportunity={opportunity}
                onOpen={handleOpenPreview}
                user={user}
              />
            ))}
          </BrowseCardsGrid>
        )}
      </Page>
    </div>
  );
}
