import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

import { StarFilledIcon, StarIcon } from "../../../../DesignSystem/Icons";
import { studentDisplayName } from "./ClassmateRankList";

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SectionTitle = styled.h3`
  margin: 0;
  font: var(--MH-Type-Title-Base, 600 18px/24px "Inter", sans-serif);
  letter-spacing: 0;
  color: var(--MH-Theme-Neutrals-Black, #171717);
`;

const EmptyNote = styled.p`
  margin: 0;
  font: var(--MH-Type-Body-Base, 400 14px/20px "Inter", sans-serif);
  letter-spacing: 0;
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
`;

const ReviewList = styled.ol`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ReviewItem = styled.li`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid var(--MH-Theme-Neutrals-Medium, #e6e6e6);
  background: var(--MH-Theme-Neutrals-Lighter, #f9f9f9);
`;

const ReviewRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
`;

const RankBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  padding: 0 8px;
  border-radius: 999px;
  font: var(--MH-Type-Label-Base, 500 14px/20px "Inter", sans-serif);
  background: var(--MH-Theme-Neutrals-White, #ffffff);
  color: var(--MH-Theme-Neutrals-Black, #171717);
  border: 1px solid var(--MH-Theme-Neutrals-Medium, #e6e6e6);
`;

const ItemTitle = styled.span`
  font: var(--MH-Type-Title-Small, 600 16px/22px "Inter", sans-serif);
  letter-spacing: 0;
  color: var(--MH-Theme-Neutrals-Black, #171717);
`;

const Meta = styled.span`
  font: var(--MH-Type-Body-Base, 400 14px/20px "Inter", sans-serif);
  letter-spacing: 0;
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
`;

const StarRow = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  color: #f5b800;
`;

const NotesField = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;

  span {
    font: var(--MH-Type-Label-Base, 500 14px/20px "Inter", sans-serif);
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }

  textarea {
    padding: 10px 14px;
    border: 1px solid #d3dae0;
    border-radius: 12px;
    background: #ffffff;
    font: var(--MH-Type-Body-Base, 400 14px/20px "Inter", sans-serif);
    letter-spacing: 0;
    color: #171717;
    min-height: 90px;
    resize: vertical;
    outline: none;

    &:focus {
      border-color: #336f8a;
    }

    &:disabled {
      background: var(--MH-Theme-Neutrals-Lighter, #f3f3f3);
      cursor: not-allowed;
    }
  }
`;

function truncate(text, max = 120) {
  const trimmed = (text || "").trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

function buildOpportunityReviewList(opportunities, rankings) {
  return [...opportunities]
    .filter((opp) => {
      const r = rankings[opp.id] || {};
      return (
        r.rank !== "" &&
        r.rank !== undefined &&
        r.rank !== null
      );
    })
    .sort(
      (a, b) =>
        Number(rankings[a.id]?.rank ?? 999) -
        Number(rankings[b.id]?.rank ?? 999),
    );
}

export default function PreferenceSubmissionReview({
  students,
  classmateOrder,
  opportunities,
  rankings,
  notes,
  onNotesChange,
  isOpen,
}) {
  const { t } = useTranslation("classes");

  const studentById = new Map(
    (students || []).filter((s) => s?.id).map((s) => [s.id, s]),
  );

  const rankedOpportunities = buildOpportunityReviewList(
    opportunities,
    rankings,
  );

  return (
    <>
      <Section>
        <SectionTitle>
          {t("opportunities.studentView.rankForm.reviewClassmates", {}, {
            default: "Preferred classmates",
          })}
        </SectionTitle>
        {classmateOrder.length === 0 ? (
          <EmptyNote>
            {t("opportunities.studentView.rankForm.reviewNoClassmates", {}, {
              default: "None selected",
            })}
          </EmptyNote>
        ) : (
          <ReviewList>
            {classmateOrder.map((id, index) => {
              const student = studentById.get(id);
              return (
                <ReviewItem key={id}>
                  <ReviewRow>
                    <RankBadge>{index + 1}</RankBadge>
                    <ItemTitle>
                      {studentDisplayName(student) || id}
                    </ItemTitle>
                  </ReviewRow>
                </ReviewItem>
              );
            })}
          </ReviewList>
        )}
      </Section>

      <Section>
        <SectionTitle>
          {t("opportunities.studentView.rankForm.reviewOpportunities", {}, {
            default: "Ranked opportunities",
          })}
        </SectionTitle>
        {rankedOpportunities.length === 0 ? (
          <EmptyNote>
            {t("opportunities.studentView.rankForm.reviewNoOpportunities", {}, {
              default: "No opportunities ranked yet",
            })}
          </EmptyNote>
        ) : (
          <ReviewList>
            {rankedOpportunities.map((opp) => {
              const r = rankings[opp.id] || {};
              const stars =
                r.starRating === "" || r.starRating == null
                  ? 0
                  : Number(r.starRating);
              const comment = truncate(r.comment);
              return (
                <ReviewItem key={opp.id}>
                  <ReviewRow>
                    <RankBadge>{r.rank}</RankBadge>
                    <ItemTitle>{opp.title}</ItemTitle>
                    {stars > 0 ? (
                      <StarRow aria-label={`${stars} stars`}>
                        {[1, 2, 3, 4, 5].map((n) =>
                          n <= stars ? (
                            <StarFilledIcon
                              key={n}
                              width={18}
                              height={18}
                              aria-hidden
                            />
                          ) : (
                            <StarIcon
                              key={n}
                              width={18}
                              height={18}
                              aria-hidden
                            />
                          ),
                        )}
                      </StarRow>
                    ) : null}
                  </ReviewRow>
                  {comment ? <Meta>{comment}</Meta> : null}
                </ReviewItem>
              );
            })}
          </ReviewList>
        )}
      </Section>

      <NotesField>
        <span>
          {t("opportunities.studentView.rankForm.reviewNotesLabel", {}, {
            default: "Additional notes",
          })}
        </span>
        <span className="hint" style={{ color: "#6a6a6a", fontWeight: 400 }}>
          {t("opportunities.studentView.rankForm.reviewNotesHint", {}, {
            default: "Anything else you want the teacher to know.",
          })}
        </span>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          disabled={!isOpen}
        />
      </NotesField>
    </>
  );
}
