import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

import MessageCard from "../../../../DesignSystem/MessageCard";
import { CLASS_STUDENT_OPPORTUNITIES } from "../../../../Queries/ConnectRound";
import OpportunityCompactCard, {
  OpportunityCompactGrid,
} from "../../../Connect/Opportunities/OpportunityCompactCard";
import OpportunityPreviewModal from "../../../TeacherClasses/ClassPage/Modals/OpportunityPreviewModal";

/**
 * Matching rounds are "open for students" when status is preferences_open
 * (same gate as Connect Participate: students can view/rank then).
 */
const STUDENT_OPEN_ROUND_STATUS = "preferences_open";

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

  const { data, loading } = useQuery(CLASS_STUDENT_OPPORTUNITIES, {
    variables: { code: myclass?.code },
    skip: !myclass?.code,
    fetchPolicy: "cache-and-network",
  });

  const networks = data?.class?.networks || myclass?.networks || [];

  const { isOpenForStudents, opportunities } = useMemo(() => {
    const byId = new Map();
    let hasOpenRound = false;

    for (const network of networks) {
      for (const round of network?.connectRounds || []) {
        if (round?.status !== STUDENT_OPEN_ROUND_STATUS) continue;
        hasOpenRound = true;
        for (const opportunity of round.opportunities || []) {
          if (!opportunity?.id || byId.has(opportunity.id)) continue;
          byId.set(opportunity.id, opportunity);
        }
      }
    }

    return {
      isOpenForStudents: hasOpenRound,
      opportunities: Array.from(byId.values()),
    };
  }, [networks]);

  const handleOpenPreview = useCallback((id) => {
    setPreviewOpportunityId(id || null);
  }, []);

  const handleClosePreview = useCallback(() => {
    setPreviewOpportunityId(null);
  }, []);

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
