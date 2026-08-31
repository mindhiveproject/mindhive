"use client";

import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

const ALGORITHM_KEYS = {
  stable_matching: "stableMatching",
  score_based: "scoreBased",
  teacher_curated: "teacherCurated",
};

const Section = styled.div`
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);

  &:first-of-type {
    margin-top: 0;
    padding-top: 0;
    border-top: none;
  }
`;

const H3 = styled.h3`
  margin: 0 0 8px;
  font: var(--MH-Type-Title-Base);
  color: var(--MH-Theme-Neutrals-Black, #171717);
`;

const Chip = styled.span`
  display: inline-block;
  padding: 2px 10px;
  border-radius: 100px;
  background: #eef5f9;
  color: #336f8a;
  font: var(--MH-Type-Label-Base);
  margin-bottom: 8px;
  border: 2px solid transparent;

  &[data-active="true"] {
    border-color: var(--MH-Theme-Primary-Dark, #336f8a);
    background: var(--MH-Theme-Primary-Light, #def8fb);
  }
`;

const Kbd = styled.span`
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
  background: #f2f4f6;
  border: 1px solid #d3dae0;
  border-radius: 4px;
  padding: 1px 6px;
  font-size: 12px;
  line-height: 16px;
  color: #5f6871;
`;

const CurrentCallout = styled.p`
  margin: 0 0 16px;
  padding: 10px 14px;
  border-radius: 10px;
  background: var(--MH-Theme-Primary-Light, #def8fb);
  color: var(--MH-Theme-Neutrals-Black, #171717);
  font: var(--MH-Type-Label-Base);
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 12px;
  font: var(--MH-Type-Body-Base);
`;

const ThTd = styled.td`
  border: 1px solid #d3dae0;
  padding: 8px 10px;
  vertical-align: top;
  text-align: left;
`;

const Th = styled.th`
  border: 1px solid #d3dae0;
  padding: 8px 10px;
  vertical-align: top;
  text-align: left;
  background: #f7f9f8;
`;

const FooterNote = styled.p`
  margin-top: 20px;
  font: var(--MH-Type-Body-Base);
  color: #5f6871;
`;

const BodyText = styled.p`
  margin: 0 0 8px;
  font: var(--MH-Type-Body-Base);
  color: var(--MH-Theme-Neutrals-Black, #171717);

  &:last-child {
    margin-bottom: 0;
  }
`;

const List = styled.ol`
  margin: 4px 0 8px;
  padding-left: 22px;
  font: var(--MH-Type-Body-Base);
  color: var(--MH-Theme-Neutrals-Black, #171717);
`;

const BulletList = styled.ul`
  margin: 4px 0 8px;
  padding-left: 22px;
  font: var(--MH-Type-Body-Base);
  color: var(--MH-Theme-Neutrals-Black, #171717);
`;

function tKey(t, key, defaultValue) {
  return t(
    `opportunities.matchingRound.matchingInfo.${key}`,
    {},
    { default: defaultValue },
  );
}

function getAlgorithmLabel(t, matchingAlgorithm) {
  const algoKey = ALGORITHM_KEYS[matchingAlgorithm];
  if (!algoKey) return matchingAlgorithm || "";
  return t(
    `opportunities.matchingRound.algorithm.${algoKey}`,
    {},
    {
      default:
        matchingAlgorithm === "stable_matching"
          ? "Stable matching"
          : matchingAlgorithm === "score_based"
            ? "Score-based"
            : matchingAlgorithm === "teacher_curated"
              ? "Teacher-curated"
              : matchingAlgorithm,
    },
  );
}

/**
 * Long-form matching algorithm + ballot workflow help content.
 * Descriptions are grounded in matchingAlgorithm.js; update when algorithm changes.
 */
export default function MatchingAlgorithmInfoContent({
  matchingAlgorithm,
  showBallotWorkflow = false,
}) {
  const { t } = useTranslation("classes");

  const isStable = matchingAlgorithm === "stable_matching";
  const isScore = matchingAlgorithm === "score_based";
  const isCurated = matchingAlgorithm === "teacher_curated";
  const algorithmLabel = matchingAlgorithm
    ? getAlgorithmLabel(t, matchingAlgorithm)
    : null;

  return (
    <div className="matchingAlgorithmInfoContent">
      {algorithmLabel ? (
        <CurrentCallout>
          {t(
            "opportunities.matchingRound.matchingInfo.currentAlgorithmLabel",
            { algorithm: algorithmLabel },
            { default: "This round uses: {{algorithm}}" },
          )}
        </CurrentCallout>
      ) : null}

      {showBallotWorkflow ? (
        <Section>
          <H3>
            {tKey(t, "ballotWorkflowTitle", "Using Student ballots")}
          </H3>
          <BodyText>
            {tKey(
              t,
              "ballotWorkflowIntro",
              "After students submit ranked preferences, this panel summarizes who submitted, who is matched, and splits students into two review queues.",
            )}
          </BodyText>
          <BodyText>
            {tKey(
              t,
              "ballotSummary",
              "The header counts show submitted ballots, matched students, and how many sit in each queue (project-first vs team-first).",
            )}
          </BodyText>
          <BodyText>
            {tKey(
              t,
              "queueProjectFirstExplain",
              "Project-first queue — students who did not rank classmates. Process these first.",
            )}
          </BodyText>
          <BodyText>
            {tKey(
              t,
              "queueTeamFirstExplain",
              "Team-first queue — students who ranked classmates. Review mutual picks here.",
            )}
          </BodyText>
          <BodyText>
            {tKey(
              t,
              "mutualClassmatesExplain",
              "Mutual means both students ranked each other. One-way means only one student ranked the other. Received counts classmates who ranked this student but were not ranked back.",
            )}
          </BodyText>
          <BodyText>
            {tKey(
              t,
              "manualAssignExplain",
              "When the round uses teacher-curated matching, each unmatched student row shows an Assign to opportunity dropdown ranked by the same scoring formula the automatic algorithms use.",
            )}
          </BodyText>
          <BodyText>
            {tKey(
              t,
              "connectMigration",
              "Matching algorithm selection and Run matching currently live in Connect → Matches. Matches computed there appear on this screen. Those controls are moving into Student Ranking here.",
            )}
          </BodyText>
        </Section>
      ) : null}

      <Section>
        <BodyText style={{ marginTop: 0 }}>
          {tKey(
            t,
            "intro",
            "Three modes are available. All three share the same scoring foundation; they differ in how they assign students to opportunities once every pair has a score.",
          )}
        </BodyText>
      </Section>

      <Section>
        <H3>{tKey(t, "sharedFoundationTitle", "Shared foundation")}</H3>
        <BodyText>
          {tKey(
            t,
            "scoreFormulaIntro",
            "Every student-opportunity pair gets a score from the student's submitted preference:",
          )}
        </BodyText>
        <BodyText style={{ marginLeft: 12 }}>
          <Kbd>
            {tKey(t, "scoreFormula", "score = rankBonus × 10 + starRating × 2")}
          </Kbd>
        </BodyText>
        <BodyText>
          {tKey(
            t,
            "rankBonusExplain",
            "rankBonus = max(0, totalOpps − rank + 1). In a 5-opportunity round, rank #1 gives a bonus of 5, #2 gives 4, unranked gives 0. Star rating is 0–5.",
          )}
        </BodyText>
        <BodyText>
          {tKey(
            t,
            "teamCoherence",
            "Team coherence bonus: both automatic algorithms add +5 per mutual team-preference pair already placed on the same opportunity.",
          )}
        </BodyText>
      </Section>

      <Section aria-current={isStable ? "true" : undefined}>
        <Chip data-active={isStable || undefined}>
          {tKey(t, "stableMatchingChip", "Stable matching")}
        </Chip>
        <H3>{tKey(t, "stableMatchingTitle", "Gale-Shapley, many-to-one")}</H3>
        <BodyText>
          {tKey(
            t,
            "stableMatchingGuarantee",
            "Guarantee: the assignment is stable.",
          )}
        </BodyText>
        <BodyText>
          <strong>{tKey(t, "stableMatchingHowTitle", "How it runs:")}</strong>
        </BodyText>
        <List>
          <li>{tKey(t, "stableMatchingStep1", "Sort each student's opportunities by score.")}</li>
          <li>{tKey(t, "stableMatchingStep2", "Every unassigned student proposes to their next unproposed opportunity.")}</li>
          <li>{tKey(t, "stableMatchingStep3", "Each opportunity keeps the top studentCapacity proposers by score and rejects the rest.")}</li>
          <li>{tKey(t, "stableMatchingStep4", "Rejected students propose to their next choice until stable.")}</li>
        </List>
        <BodyText>
          {tKey(
            t,
            "stableMatchingExampleTitle",
            "Micro-example — Alice, Bob, Carol; Opps X and Y (each cap 1).",
          )}
        </BodyText>
        <BulletList>
          <li>{tKey(t, "stableMatchingExample1", "Round 1: all three propose to X.")}</li>
          <li>{tKey(t, "stableMatchingExample2", "Round 2: Alice and Carol propose to Y.")}</li>
          <li>{tKey(t, "stableMatchingExample3", "Round 3: Carol has no more options → unmatched.")}</li>
        </BulletList>
        <BodyText>
          <strong>
            {tKey(t, "stableMatchingResult", "Result: Bob→X, Alice→Y, Carol unmatched.")}
          </strong>
        </BodyText>
        <BodyText>
          {tKey(t, "stableMatchingPick", "Pick this when you want a defensible answer if a student asks why they didn't get X.")}
        </BodyText>
      </Section>

      <Section aria-current={isScore ? "true" : undefined}>
        <Chip data-active={isScore || undefined}>
          {tKey(t, "scoreBasedChip", "Score-based")}
        </Chip>
        <H3>{tKey(t, "scoreBasedTitle", "Greedy, one pass")}</H3>
        <BodyText>
          {tKey(t, "scoreBasedGuarantee", "Guarantee: each placement maximizes score at the moment it's made.")}
        </BodyText>
        <BodyText>
          <strong>{tKey(t, "scoreBasedHowTitle", "How it runs:")}</strong>
        </BodyText>
        <List>
          <li>{tKey(t, "scoreBasedStep1", "Flatten every (student, opportunity, score) triple into one list.")}</li>
          <li>{tKey(t, "scoreBasedStep2", "Sort by descending score. Tie-break by lower preference rank.")}</li>
          <li>{tKey(t, "scoreBasedStep3", "Walk the sorted list and place when capacity allows.")}</li>
        </List>
        <BodyText>
          {tKey(t, "scoreBasedExample", "Micro-example — sorted global list walk.")}
        </BodyText>
        <BodyText>
          {tKey(t, "scoreBasedResult", "Result differs from stable matching in edge cases.")}
        </BodyText>
        <BodyText>
          {tKey(t, "scoreBasedPick", "Pick this when you want maximum transparency.")}
        </BodyText>
      </Section>

      <Section aria-current={isCurated ? "true" : undefined}>
        <Chip data-active={isCurated || undefined}>
          {tKey(t, "teacherCuratedChip", "Teacher-curated")}
        </Chip>
        <H3>{tKey(t, "teacherCuratedTitle", "No auto-assignment")}</H3>
        <BodyText>
          {tKey(t, "teacherCuratedBody1", "The algorithm intentionally produces zero matches.")}
        </BodyText>
        <BodyText>
          {tKey(t, "teacherCuratedBody2", "What still runs: the same scoring formula powers ranked dropdowns.")}
        </BodyText>
        <BodyText>
          {tKey(t, "teacherCuratedPick", "Pick this when you have context the algorithm can't see.")}
        </BodyText>
      </Section>

      <Section>
        <H3>{tKey(t, "comparisonTitle", "At a glance")}</H3>
        <Table>
          <thead>
            <tr>
              <Th />
              <Th>{tKey(t, "comparisonColStable", "Stable matching")}</Th>
              <Th>{tKey(t, "comparisonColScore", "Score-based")}</Th>
              <Th>{tKey(t, "comparisonColCurated", "Teacher-curated")}</Th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <ThTd style={{ font: "var(--MH-Type-Label-Small)" }}>
                {tKey(t, "comparisonRowFairness", "Fairness guarantee")}
              </ThTd>
              <ThTd>{tKey(t, "comparisonFairnessStable", "Stable (best)")}</ThTd>
              <ThTd>{tKey(t, "comparisonFairnessScore", "None")}</ThTd>
              <ThTd>{tKey(t, "comparisonFairnessCurated", "Teacher decides")}</ThTd>
            </tr>
            <tr>
              <ThTd style={{ font: "var(--MH-Type-Label-Small)" }}>
                {tKey(t, "comparisonRowDeterminism", "Determinism")}
              </ThTd>
              <ThTd>{tKey(t, "comparisonDeterminismYes", "Yes")}</ThTd>
              <ThTd>{tKey(t, "comparisonDeterminismYes", "Yes")}</ThTd>
              <ThTd>{tKey(t, "comparisonDeterminismNa", "N/A")}</ThTd>
            </tr>
            <tr>
              <ThTd style={{ font: "var(--MH-Type-Label-Small)" }}>
                {tKey(t, "comparisonRowTeamCoherence", "Team coherence")}
              </ThTd>
              <ThTd>{tKey(t, "comparisonTeamApplied", "Applied automatically")}</ThTd>
              <ThTd>{tKey(t, "comparisonTeamApplied", "Applied automatically")}</ThTd>
              <ThTd>{tKey(t, "comparisonTeamHint", "Shown as ranking hint only")}</ThTd>
            </tr>
            <tr>
              <ThTd style={{ font: "var(--MH-Type-Label-Small)" }}>
                {tKey(t, "comparisonRowOrder", "Order")}
              </ThTd>
              <ThTd>{tKey(t, "comparisonOrderPreference", "Student preference")}</ThTd>
              <ThTd>{tKey(t, "comparisonOrderGlobal", "Global score")}</ThTd>
              <ThTd>{tKey(t, "comparisonOrderTeacher", "Teacher's choice")}</ThTd>
            </tr>
            <tr>
              <ThTd style={{ font: "var(--MH-Type-Label-Small)" }}>
                {tKey(t, "comparisonRowBestFor", "Best for")}
              </ThTd>
              <ThTd>{tKey(t, "comparisonBestStable", "Large, contested rounds")}</ThTd>
              <ThTd>{tKey(t, "comparisonBestScore", "Small transparent runs")}</ThTd>
              <ThTd>{tKey(t, "comparisonBestCurated", "Small rounds or algorithm override")}</ThTd>
            </tr>
          </tbody>
        </Table>
      </Section>

      <FooterNote>
        {showBallotWorkflow
          ? tKey(
              t,
              "footerClass",
              "New rounds default to stable matching. Algorithm selection and Run matching currently live in Connect → Matches.",
            )
          : tKey(
              t,
              "footerConnect",
              "You can switch between algorithms using the dropdown at the top of the Connect Matches page.",
            )}
      </FooterNote>
    </div>
  );
}
