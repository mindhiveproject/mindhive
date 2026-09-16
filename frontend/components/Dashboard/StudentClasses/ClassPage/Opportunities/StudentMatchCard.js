import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

import Chip from "../../../../DesignSystem/Chip";
import {
  displayName,
  getMatchStudents,
} from "../../../../../lib/connectBallotUtils";
import {
  formatOpportunityMentorLabel,
  formatOpportunitySponsorLabel,
} from "../../../../../lib/opportunityPeople";
import Button from "../../../../DesignSystem/Button";

const Card = styled.article`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  padding: 16px;
  box-sizing: border-box;
  border-radius: 12px;
  border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
  background: var(--MH-Theme-Neutrals-White, #ffffff);
`;

const HeadingRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
`;

const Title = styled.h2`
  margin: 0;
  font: var(--MH-Type-Title-Large, 600 22px/28px "Inter", sans-serif);
  letter-spacing: 0;
  color: var(--MH-Theme-Neutrals-Black, #171717);
`;

const Body = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
  gap: 16px 24px;
  align-items: start;
  width: 100%;
  min-width: 0;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const Column = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
`;

const Heading = styled.h3`
  margin: 0;
  font: var(--MH-Type-Label-Base, 500 14px/20px "Inter", sans-serif);
  letter-spacing: 0;
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
`;

const OpportunityTitle = styled.p`
  margin: 0;
  font: var(--MH-Type-Title-Base, 600 18px/24px "Inter", sans-serif);
  letter-spacing: 0;
  color: var(--MH-Theme-Neutrals-Black, #171717);
`;

const MemberRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

/**
 * Published-round match surface: team on the left, opportunity on the right.
 */
export default function StudentMatchCard({ match, onOpenOpportunity }) {
  const { t } = useTranslation("classes");

  if (!match?.id) return null;

  const opportunity = match.opportunity;
  const opportunityId = opportunity?.id;
  const opportunityTitle = opportunity?.title?.trim() || "—";
  const sponsorName = formatOpportunitySponsorLabel(opportunity);
  const mentorName = formatOpportunityMentorLabel(opportunity, t);
  const teammates = getMatchStudents(match)
    .filter((student) => student?.id)
    .slice()
    .sort((a, b) => displayName(a).localeCompare(displayName(b)));

  const title = t(
    "opportunities.studentView.matchCard.title",
    {},
    { default: "You've been matched" },
  );
  const teamHeading = t(
    "opportunities.studentView.matchCard.teamHeading",
    {},
    { default: "Your team" },
  );
  const sponsorLine = t(
    "opportunities.studentView.matchCard.sponsor",
    { name: sponsorName },
    { default: "Sponsor: {{name}}" },
  );
  const mentorLine = t(
    "opportunities.studentView.matchCard.mentor",
    { name: mentorName },
    { default: "Mentor: {{name}}" },
  );

  return (
    <Card aria-labelledby={`match-card-title-${match.id}`}>
      <HeadingRow>
        <Title id={`match-card-title-${match.id}`}>{title}</Title>
        <Button
          variant="subtle"
          type="button"
          disabled={!opportunityId}
          onClick={() => {
            if (!opportunityId || typeof onOpenOpportunity !== "function") return;
            onOpenOpportunity(opportunityId);
          }}
        >
          {t(
            "opportunities.preview.opportunityDetails",
            {},
            { default: "Opportunity details" },
          )}
        </Button>
      </HeadingRow>
      <Body>
        <Column>
          <Heading>{teamHeading}</Heading>
          <MemberRow>
            {teammates.map((student) => (
              <Chip
                key={student.id}
                variant="static"
                tone="neutral"
                label={displayName(student)}
              />
            ))}
          </MemberRow>
        </Column>
        <Column>
          <OpportunityTitle>{opportunityTitle}</OpportunityTitle>
           <Chip
            variant="static"
            tone="neutral"
            label={sponsorLine}
          />
            <Chip
              variant="static"
              tone="neutral"
              label={mentorLine}
            />
        </Column>
      </Body>
    </Card>
  );
}
