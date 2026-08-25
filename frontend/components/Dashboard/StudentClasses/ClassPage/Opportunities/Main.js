import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

import Chip from "../../../../DesignSystem/Chip";
import MessageCard from "../../../../DesignSystem/MessageCard";
import { StarFilledIcon, StarIcon } from "../../../../DesignSystem/Icons";
import { RECORD_OPPORTUNITY_PREVIEW_VISIT } from "../../../../Mutations/Log";
import { CLASS_STUDENT_OPPORTUNITIES } from "../../../../Queries/ConnectRound";
import { BrowseCardsGrid } from "../../../Connect/ConnectBrowseLayout";
import OpportunityConnectCard from "../../../Connect/OpportunityConnectCard";
import OpportunityPreviewModal from "../../../TeacherClasses/ClassPage/Modals/OpportunityPreviewModal";

/**
 * Matching rounds are "open for students" when status is preferences_open
 * (same gate as Connect Participate: students can view/rank then).
 */
const STUDENT_OPEN_ROUND_STATUS = "preferences_open";
const MIN_DWELL_MS = 1000;

const Page = styled.div`
  display: grid;
  gap: 20px;
`;

const FilterRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
`;

export default function StudentClassOpportunities({ myclass, user }) {
  const { t } = useTranslation("classes");
  const [previewOpportunityId, setPreviewOpportunityId] = useState(null);
  const [filterMode, setFilterMode] = useState("all");

  const sessionRef = useRef(null);
  const flushedRef = useRef(false);

  const [recordVisit] = useMutation(RECORD_OPPORTUNITY_PREVIEW_VISIT);

  const { data, loading } = useQuery(CLASS_STUDENT_OPPORTUNITIES, {
    variables: { code: myclass?.code },
    skip: !myclass?.code,
    fetchPolicy: "cache-and-network",
  });

  const networks = data?.class?.networks || myclass?.networks || [];
  const classId = data?.class?.id || myclass?.id || null;

  const favoriteIds = useMemo(
    () =>
      new Set((user?.favoriteOpportunities || []).map((opp) => opp?.id).filter(Boolean)),
    [user?.favoriteOpportunities],
  );

  const { isOpenForStudents, opportunities, opportunityRoundIds } =
    useMemo(() => {
      const byId = new Map();
      const roundByOpportunityId = new Map();
      let hasOpenRound = false;

      for (const network of networks) {
        for (const round of network?.connectRounds || []) {
          if (round?.status !== STUDENT_OPEN_ROUND_STATUS) continue;
          hasOpenRound = true;
          for (const opportunity of round.opportunities || []) {
            if (!opportunity?.id) continue;
            if (!byId.has(opportunity.id)) {
              byId.set(opportunity.id, opportunity);
            }
            if (!roundByOpportunityId.has(opportunity.id) && round.id) {
              roundByOpportunityId.set(opportunity.id, round.id);
            }
          }
        }
      }

      return {
        isOpenForStudents: hasOpenRound,
        opportunities: Array.from(byId.values()),
        opportunityRoundIds: roundByOpportunityId,
      };
    }, [networks]);

  const filteredOpportunities = useMemo(() => {
    if (filterMode !== "favorites") return opportunities;
    return opportunities.filter((opp) => favoriteIds.has(opp.id));
  }, [opportunities, filterMode, favoriteIds]);

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
      // Preview tracking must not block closing the modal.
      console.warn("Failed to record opportunity preview visit", err);
    }
  }, [recordVisit]);

  const startPreviewSession = useCallback(
    (opportunityId) => {
      if (!opportunityId || !classId) return;
      const roundId = opportunityRoundIds.get(opportunityId);
      if (!roundId) return;
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

  const handleOpenPreview = useCallback(
    (id) => {
      const nextId = id || null;
      if (previewOpportunityId && previewOpportunityId !== nextId) {
        void flushPreviewSession();
      }
      setPreviewOpportunityId(nextId);
      if (nextId) {
        startPreviewSession(nextId);
      }
    },
    [flushPreviewSession, previewOpportunityId, startPreviewSession],
  );

  const handleClosePreview = useCallback(() => {
    void flushPreviewSession();
    setPreviewOpportunityId(null);
  }, [flushPreviewSession]);

  useEffect(() => {
    if (!previewOpportunityId) return undefined;

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        void flushPreviewSession();
      } else if (
        document.visibilityState === "visible" &&
        previewOpportunityId &&
        !sessionRef.current
      ) {
        startPreviewSession(previewOpportunityId);
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
  }, [flushPreviewSession, previewOpportunityId, startPreviewSession]);

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

  return (
    <div className="classTabPage opportunities">
      <Page>
        <FilterRow role="group" aria-label={t(
          "opportunities.studentView.filterLabel",
          {},
          { default: "Filter opportunities" },
        )}>
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

        {filteredOpportunities.length === 0 ? (
          <MessageCard
            variant="neutral"
            message={`${emptyFavoritesTitle} ${emptyFavoritesHint}`}
            ariaLabel={`${emptyFavoritesTitle} ${emptyFavoritesHint}`}
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

      <OpportunityPreviewModal
        open={!!previewOpportunityId}
        opportunityId={previewOpportunityId}
        onClose={handleClosePreview}
        hideStatus
      />
    </div>
  );
}
