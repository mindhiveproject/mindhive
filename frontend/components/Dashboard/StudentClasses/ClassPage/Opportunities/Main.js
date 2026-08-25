import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

import MessageCard from "../../../../DesignSystem/MessageCard";
import { RECORD_OPPORTUNITY_PREVIEW_VISIT } from "../../../../Mutations/Log";
import { CLASS_STUDENT_OPPORTUNITIES } from "../../../../Queries/ConnectRound";
import OpportunityCompactCard, {
  OpportunityCompactGrid,
} from "../../../Connect/OpportunityCompactCard";
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

const CardHitArea = styled.div`
  display: block;
  width: 100%;
  cursor: pointer;
  border-radius: 14px;

  &:focus-visible {
    outline: 2px solid var(--MH-Theme-Primary-Dark, #336f8a);
    outline-offset: 3px;
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

function mentorDisplayName(mentor) {
  if (!mentor) return null;
  const full = [mentor.firstName, mentor.lastName].filter(Boolean).join(" ");
  return full || mentor.username || null;
}

function buildStudentOpportunityMeta(opportunity, t) {
  const parts = [];
  const sponsor = mentorDisplayName(opportunity.mentor);
  if (sponsor) {
    parts.push(
      t(
        "opportunities.studentView.meta.sponsor",
        { name: sponsor },
        { default: "Sponsor: {{name}}" },
      ),
    );
  }
  if (opportunity.organization?.name) {
    parts.push(opportunity.organization.name);
  }
  if (opportunity.shortDescription) {
    parts.push(opportunity.shortDescription);
  } else {
    const from = formatDate(opportunity.availableFrom);
    const to = formatDate(opportunity.availableTo);
    if (from || to) {
      parts.push(
        t(
          "opportunities.studentView.meta.dates",
          { from: from || "—", to: to || "—" },
          { default: "{{from}} → {{to}}" },
        ),
      );
    }
  }
  return parts.join(" · ");
}

export default function StudentClassOpportunities({ myclass }) {
  const { t } = useTranslation("classes");
  const [previewOpportunityId, setPreviewOpportunityId] = useState(null);

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

  return (
    <div className="classTabPage opportunities">
      <Page>
        <OpportunityCompactGrid>
          {opportunities.map((opportunity) => {
            const openLabel = t(
              "opportunities.studentView.openAria",
              { title: opportunity.title || "" },
              { default: "View opportunity: {{title}}" },
            );
            return (
              <CardHitArea
                key={opportunity.id}
                role="button"
                tabIndex={0}
                aria-label={openLabel}
                onClick={() => handleOpenPreview(opportunity.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleOpenPreview(opportunity.id);
                  }
                }}
              >
                <OpportunityCompactCard
                  title={opportunity.title}
                  metaLine={buildStudentOpportunityMeta(opportunity, t)}
                />
              </CardHitArea>
            );
          })}
        </OpportunityCompactGrid>
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
