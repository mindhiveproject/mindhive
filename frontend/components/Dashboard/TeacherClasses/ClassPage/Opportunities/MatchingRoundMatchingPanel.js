import { useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import clsx from "clsx";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

import Button from "../../../../DesignSystem/Button";
import Chip from "../../../../DesignSystem/Chip";
import { ROUND_MATCH_VIEW } from "../../../../Queries/ConnectMatch";
import {
  buildClassmateListsByStudent,
  buildOpportunityPreferenceStats,
  buildTeamFirstCongruentGroups,
  buildTeamPrefsByStudent,
  describeTeamGroupClosure,
  displayName,
  getLargestTeamSize,
  getMaxActiveClassmatePicks,
  getTeamEligibleOpportunities,
  isStudentInActiveMatch,
} from "../../../../../lib/connectBallotUtils";
import MatchingRoundMatchingHeaderBar from "./MatchingRoundMatchingHeaderBar";
import MatchingRoundProjectPivotGrid from "./MatchingRoundProjectPivotGrid";
import StudentNameDisplay from "./StudentNameDisplay";
import {
  MATCHING_VIEW_PIVOT,
  MATCHING_VIEW_PROJECT_FIRST,
  MATCHING_VIEW_TEAM_FIRST,
} from "./matchingViewModes";

const Shell = styled.div`
  display: grid;
  gap: 16px;
  width: 100%;
  min-width: 0;
`;

const List = styled.div`
  display: grid;
  gap: 12px;
  width: 100%;
  min-width: 0;
`;

const ItemCard = styled.section`
  display: grid;
  gap: 10px;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
  background: var(--MH-Theme-Neutrals-White, #ffffff);
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
`;

const ItemHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px 12px;
`;

const ItemTitle = styled.h4`
  margin: 0;
  font: var(--MH-Type-Title-Base);
  color: var(--MH-Theme-Neutrals-Black, #171717);
`;

const Meta = styled.p`
  margin: 0;
  font: var(--MH-Type-Body-Base);
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
`;

const SharedInterestList = styled.ul`
  margin: 4px 0 0;
  padding-inline-start: 1.25em;
  display: grid;
  gap: 2px;
  font: var(--MH-Type-Body-Base);
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
`;

const MemberRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const ProjectCard = styled(ItemCard)`
  grid-template-columns: minmax(0, 1fr);
  align-items: start;

  &.isDetailsOpen {
    grid-template-columns: minmax(0, 1.2fr) minmax(220px, 0.95fr);
    column-gap: 20px;
  }

  @media (max-width: 800px) {
    &.isDetailsOpen {
      grid-template-columns: minmax(0, 1fr);
    }
  }
`;

const ProjectCardMain = styled.div`
  display: grid;
  gap: 10px;
  min-width: 0;
`;

const ProjectCardSide = styled.aside`
  display: grid;
  gap: 10px;
  min-width: 0;
  padding-left: 16px;
  border-left: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
  max-height: 480px;
  overflow-y: auto;

  @media (max-width: 800px) {
    padding-left: 0;
    padding-top: 12px;
    border-left: none;
    border-top: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
    max-height: none;
  }
`;

const EmptyNote = styled.p`
  margin: 0;
  font: var(--MH-Type-Body-Base);
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
`;

const PopoverBody = styled.div`
  display: grid;
  gap: 10px;
`;

const PopoverTitle = styled.h5`
  margin: 0;
  font: var(--MH-Type-Title-Small, var(--MH-Type-Title-Base));
  color: var(--MH-Theme-Neutrals-Black, #171717);
`;

const PopoverSectionLabel = styled.p`
  margin: 0;
  font: var(--MH-Type-Body-Small, var(--MH-Type-Body-Base));
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
`;

const PopoverList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 6px;
`;

const PopoverListItem = styled.li`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px 10px;
  font: var(--MH-Type-Body-Base);
  color: var(--MH-Theme-Neutrals-Black, #171717);
`;

function normalizeQuery(value) {
  return (value || "").trim().toLowerCase();
}

function profileHaystack(profile) {
  if (!profile) return "";
  return [
    displayName(profile),
    profile.username,
    profile.firstName,
    profile.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function opportunityTitleHaystack(opportunity) {
  return [opportunity?.title, opportunity?.organization?.name]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function ballotItemHasRank(item) {
  return item?.rank !== "" && item?.rank != null;
}

function opportunityHasRankingStudentQuery(preferenceStats, peopleQ) {
  if (!peopleQ) return true;
  return (preferenceStats?.students || []).some((entry) =>
    profileHaystack(entry.student).includes(peopleQ),
  );
}

function preferenceRanksOpportunityQuery(preference, opportunityQ) {
  if (!opportunityQ) return true;
  return (preference?.items || []).some((item) => {
    if (!ballotItemHasRank(item)) return false;
    const title = (item.opportunity?.title || "").toLowerCase();
    return title.includes(opportunityQ);
  });
}

function formatOrdinalRank(rank, t) {
  if (rank === 1) {
    return t(
      "opportunities.matchingRound.matching.preferenceRankFirst",
      {},
      { default: "1st choice" },
    );
  }
  if (rank === 2) {
    return t(
      "opportunities.matchingRound.matching.preferenceRankSecond",
      {},
      { default: "2nd choice" },
    );
  }
  if (rank === 3) {
    return t(
      "opportunities.matchingRound.matching.preferenceRankThird",
      {},
      { default: "3rd choice" },
    );
  }
  return t(
    "opportunities.matchingRound.matching.preferenceRankNth",
    { rank },
    { default: "{{rank}}th choice" },
  );
}

function OpportunityPreferenceDetails({
  opportunity,
  preferences,
  preferenceBySubmitterId,
  t,
}) {
  const stats = useMemo(
    () =>
      buildOpportunityPreferenceStats(opportunity.id, preferences, {
        submittedOnly: true,
      }),
    [opportunity.id, preferences],
  );

  const rankCounts = useMemo(
    () =>
      [...stats.countsByRank.entries()].sort((a, b) => a[0] - b[0]),
    [stats.countsByRank],
  );

  return (
    <PopoverBody>
      <PopoverTitle>
        {t(
          "opportunities.matchingRound.matching.preferencePopoverTitle",
          {},
          { default: "Who ranked this opportunity" },
        )}
      </PopoverTitle>
      <PopoverSectionLabel>
        {t(
          "opportunities.matchingRound.matching.preferenceTotal",
          { count: stats.total },
          {
            default:
              "{{count}} student(s) included this on a submitted ballot",
          },
        )}
      </PopoverSectionLabel>
      {rankCounts.length > 0 ? (
        <>
          <PopoverSectionLabel>
            {t(
              "opportunities.matchingRound.matching.preferenceRankSummaryLabel",
              {},
              { default: "How they ranked it" },
            )}
          </PopoverSectionLabel>
          <MemberRow>
            {rankCounts.map(([rank, count]) => (
              <Chip
                key={rank}
                variant="static"
                tone="neutral"
                label={t(
                  "opportunities.matchingRound.matching.preferenceRankCount",
                  {
                    rank: formatOrdinalRank(rank, t),
                    count,
                  },
                  { default: "{{count}} as {{rank}}" },
                )}
              />
            ))}
          </MemberRow>
        </>
      ) : null}
      {stats.students.length > 0 ? (
        <>
          <PopoverSectionLabel>
            {t(
              "opportunities.matchingRound.matching.preferenceListLabel",
              {},
              { default: "Students" },
            )}
          </PopoverSectionLabel>
          <PopoverList>
            {stats.students.map((entry) => (
              <PopoverListItem key={`${entry.student.id}-${entry.rank}`}>
                <Chip
                  variant="static"
                  tone="neutral"
                  label={formatOrdinalRank(entry.rank, t)}
                />
                <StudentNameDisplay
                  student={entry.student}
                  preference={
                    preferenceBySubmitterId?.get?.(entry.student.id) || null
                  }
                />
              </PopoverListItem>
            ))}
          </PopoverList>
        </>
      ) : (
        <EmptyNote>
          {t(
            "opportunities.matchingRound.matching.preferenceEmpty",
            {},
            {
              default:
                "No submitted ballot includes this opportunity yet.",
            },
          )}
        </EmptyNote>
      )}
    </PopoverBody>
  );
}

function ProjectFirstOpportunityCard({
  opportunity,
  matches,
  preferences,
  preferenceBySubmitterId,
  t,
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const capacity = opportunity.studentCapacity || 1;
  const used = matches.length;
  const peopleLine = [
    ...(opportunity.sponsors || []),
    ...(opportunity.mentors || []),
    opportunity.mentor,
  ]
    .filter(Boolean)
    .map(displayName)
    .filter(Boolean);
  const uniquePeople = [...new Set(peopleLine)];
  const toggleLabel = detailsOpen
    ? t(
        "opportunities.matchingRound.matching.preferencePanelHide",
        {},
        { default: "Hide rankings" },
      )
    : t(
        "opportunities.matchingRound.matching.preferencePanelShow",
        {},
        { default: "Who ranked this" },
      );

  return (
    <ProjectCard className={clsx({ isDetailsOpen: detailsOpen })}>
      <ProjectCardMain>
        <ItemHeader>
          <div style={{ display: "grid", gap: 4, minWidth: 0 }}>
            <ItemTitle>{opportunity.title || "—"}</ItemTitle>
            <Meta>
              {t(
                "opportunities.matchingRound.matching.capacity",
                { used, capacity },
                { default: "{{used}} / {{capacity}} placed" },
              )}
              {opportunity.organization?.name
                ? ` · ${opportunity.organization.name}`
                : ""}
            </Meta>
            {uniquePeople.length > 0 ? (
              <Meta>
                {t(
                  "opportunities.matchingRound.matching.mentorsLabel",
                  { names: uniquePeople.join(", ") },
                  { default: "Mentors / sponsors: {{names}}" },
                )}
              </Meta>
            ) : null}
          </div>
          <Button
            variant="text"
            aria-expanded={detailsOpen}
            aria-label={t(
              "opportunities.matchingRound.matching.preferencePopoverAria",
              { title: opportunity.title || "" },
              { default: "Who ranked {{title}}" },
            )}
            onClick={() => setDetailsOpen((open) => !open)}
          >
            {toggleLabel}
          </Button>
        </ItemHeader>
        {matches.length > 0 ? (
          <MemberRow>
            {matches.map((match) => (
              <StudentNameDisplay
                key={match.id}
                student={match.student}
                preference={
                  preferenceBySubmitterId?.get?.(match.student?.id) || null
                }
              />
            ))}
          </MemberRow>
        ) : (
          <EmptyNote>
            {t(
              "opportunities.matchingRound.matching.noMatchesYet",
              {},
              { default: "No matches yet." },
            )}
          </EmptyNote>
        )}
      </ProjectCardMain>
      {detailsOpen ? (
        <ProjectCardSide>
          <OpportunityPreferenceDetails
            opportunity={opportunity}
            preferences={preferences}
            preferenceBySubmitterId={preferenceBySubmitterId}
            t={t}
          />
        </ProjectCardSide>
      ) : null}
    </ProjectCard>
  );
}

const MISSING_PICK_PREVIEW = 3;

function TeamFirstGroupCard({
  group,
  preferences,
  preferenceBySubmitterId,
  classmateListsByStudent,
  activePickCount,
  teamSize,
  t,
}) {
  const sharedHints = useMemo(() => {
    const titleCounts = new Map();
    group.memberIds.forEach((memberId) => {
      const preference = (preferences || []).find(
        (entry) => entry.submitter?.id === memberId,
      );
      (preference?.items || []).forEach((item) => {
        const title = item.opportunity?.title;
        if (!title || item.rank === "" || item.rank == null) return;
        titleCounts.set(title, (titleCounts.get(title) || 0) + 1);
      });
    });
    return [...titleCounts.entries()]
      .sort((a, b) => {
        if (b[1] !== a[1]) return b[1] - a[1];
        return a[0].localeCompare(b[0]);
      })
      .slice(0, 5)
      .map(([title]) => title);
  }, [group.memberIds, preferences]);

  const closure = useMemo(() => {
    const studentById = new Map(
      (group.members || []).map((member) => [member.id, member]),
    );
    return describeTeamGroupClosure({
      memberIds: group.memberIds,
      studentById,
      classmateListsByStudent,
      activePickCount,
    });
  }, [
    group.memberIds,
    group.members,
    classmateListsByStudent,
    activePickCount,
  ]);

  const memberCount = group.members.length;
  const missingPreview = closure.missingDirected.slice(0, MISSING_PICK_PREVIEW);
  const missingMore = Math.max(
    closure.missingDirected.length - missingPreview.length,
    0,
  );

  let closureChip;
  if (memberCount <= 1) {
    closureChip = {
      tone: "neutral",
      label: t(
        "opportunities.matchingRound.matching.teamGroupSolo",
        {},
        { default: "No mutual teammates" },
      ),
    };
  } else if (closure.isClique) {
    closureChip = {
      tone: "success",
      label:
        memberCount === 2
          ? t(
              "opportunities.matchingRound.matching.teamGroupClosedPair",
              {},
              { default: "They picked each other" },
            )
          : t(
              "opportunities.matchingRound.matching.teamGroupClosed",
              { count: memberCount },
              { default: "All {{count}} picked each other" },
            ),
    };
  } else {
    closureChip = {
      tone: "warning",
      label: t(
        "opportunities.matchingRound.matching.teamGroupOpen",
        {},
        { default: "Connected, but not a closed team" },
      ),
    };
  }

  let sizeChip = null;
  if (teamSize > 1 && memberCount > 1) {
    if (memberCount > teamSize) {
      sizeChip = {
        tone: "warning",
        label: t(
          "opportunities.matchingRound.matching.teamGroupSizeOver",
          { count: memberCount, teamSize },
          { default: "{{count}} students for a team of {{teamSize}}" },
        ),
      };
    } else if (memberCount < teamSize) {
      sizeChip = {
        tone: "info",
        label: t(
          "opportunities.matchingRound.matching.teamGroupSizeUnder",
          { count: memberCount, teamSize },
          { default: "Only {{count}} for a team of {{teamSize}}" },
        ),
      };
    }
  }

  return (
    <ItemCard>
      <ItemHeader>
        <div style={{ display: "grid", gap: 4, minWidth: 0 }}>
          <ItemTitle>
            {t(
              "opportunities.matchingRound.matching.teamGroupTitle",
              { count: memberCount },
              {
                default:
                  "{{count}}-student group",
              },
            )}
          </ItemTitle>
          {sharedHints.length > 0 ? (
            <div>
              <Meta>
                {t(
                  "opportunities.matchingRound.matching.teamGroupSharedOpps",
                  {},
                  { default: "Shared interest" },
                )}
              </Meta>
              <SharedInterestList>
                {sharedHints.map((title) => (
                  <li key={title}>{title}</li>
                ))}
              </SharedInterestList>
            </div>
          ) : (
            <Meta>
              {t(
                "opportunities.matchingRound.matching.teamGroupNoSharedOpps",
                {},
                { default: "No shared ranked opportunities yet." },
              )}
            </Meta>
          )}
        </div>
      </ItemHeader>
      <MemberRow>
        <Chip
          variant="static"
          tone={closureChip.tone}
          label={closureChip.label}
        />
        {sizeChip ? (
          <Chip
            variant="static"
            tone={sizeChip.tone}
            label={sizeChip.label}
          />
        ) : null}
      </MemberRow>
      {missingPreview.length > 0 ? (
        <Meta as="div" style={{ display: "flex", flexWrap: "wrap", gap: "4px 0", alignItems: "baseline" }}>
          {missingPreview.map((edge, index) => {
            const fromStudent =
              group.members.find((member) => member.id === edge.fromId) || {
                id: edge.fromId,
                username: edge.fromName || edge.fromId,
              };
            const toStudent =
              group.members.find((member) => member.id === edge.toId) || {
                id: edge.toId,
                username: edge.toName || edge.toId,
              };
            return (
              <span key={`${edge.fromId}-${edge.toId}`} style={{ display: "inline-flex", flexWrap: "wrap", alignItems: "baseline", gap: 4 }}>
                {index > 0 ? <span aria-hidden="true"> · </span> : null}
                <StudentNameDisplay
                  student={fromStudent}
                  preference={
                    preferenceBySubmitterId?.get?.(edge.fromId) || null
                  }
                />
                <span>
                  {t(
                    "opportunities.matchingRound.matching.teamGroupMissingPickVerb",
                    {},
                    { default: "didn’t pick" },
                  )}
                </span>
                <StudentNameDisplay
                  student={toStudent}
                  preference={
                    preferenceBySubmitterId?.get?.(edge.toId) || null
                  }
                />
              </span>
            );
          })}
          {missingMore > 0
            ? ` · ${t(
                "opportunities.matchingRound.matching.teamGroupMissingMore",
                { count: missingMore },
                { default: "+{{count}} more missing picks" },
              )}`
            : ""}
        </Meta>
      ) : null}
      <MemberRow>
        {group.members.map((member) => (
          <StudentNameDisplay
            key={member.id}
            student={member}
            preference={preferenceBySubmitterId?.get?.(member.id) || null}
          />
        ))}
      </MemberRow>
    </ItemCard>
  );
}

export default function MatchingRoundMatchingPanel({
  roundId,
  students = [],
  enabled = true,
}) {
  const { t } = useTranslation("classes");
  const [queueMode, setQueueMode] = useState(MATCHING_VIEW_PROJECT_FIRST);
  const [peopleQuery, setPeopleQuery] = useState("");
  const [opportunityQuery, setOpportunityQuery] = useState("");

  const { data, loading } = useQuery(ROUND_MATCH_VIEW, {
    variables: { roundId },
    skip: !roundId || !enabled,
    fetchPolicy: "cache-and-network",
  });

  const round = data?.connectRound;
  const opportunities = round?.opportunities || [];
  const preferences = round?.preferences || [];
  const teamPreferences = round?.teamPreferences || [];
  const matches = round?.matches || [];

  const rosterStudents = useMemo(() => {
    const ids = new Set();
    const list = [];
    (students || []).forEach((student) => {
      if (student?.id && !ids.has(student.id)) {
        ids.add(student.id);
        list.push(student);
      }
    });
    preferences.forEach((preference) => {
      const student = preference.submitter;
      if (student?.id && !ids.has(student.id)) {
        ids.add(student.id);
        list.push(student);
      }
    });
    return list;
  }, [students, preferences]);

  const matchesByOpportunity = useMemo(() => {
    const map = new Map();
    matches.forEach((match) => {
      if (!isStudentInActiveMatch(match)) return;
      const opportunityId = match.opportunity?.id;
      if (!opportunityId) return;
      if (!map.has(opportunityId)) map.set(opportunityId, []);
      map.get(opportunityId).push(match);
    });
    return map;
  }, [matches]);

  const preferenceStatsByOpportunity = useMemo(() => {
    const map = new Map();
    opportunities.forEach((opportunity) => {
      map.set(
        opportunity.id,
        buildOpportunityPreferenceStats(opportunity.id, preferences, {
          submittedOnly: true,
        }),
      );
    });
    return map;
  }, [opportunities, preferences]);

  const peopleQ = normalizeQuery(peopleQuery);
  const opportunityQ = normalizeQuery(opportunityQuery);

  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((opportunity) => {
      if (
        opportunityQ &&
        !opportunityTitleHaystack(opportunity).includes(opportunityQ)
      ) {
        return false;
      }
      if (peopleQ) {
        const stats = preferenceStatsByOpportunity.get(opportunity.id);
        if (!opportunityHasRankingStudentQuery(stats, peopleQ)) {
          return false;
        }
      }
      return true;
    });
  }, [
    opportunities,
    opportunityQ,
    peopleQ,
    preferenceStatsByOpportunity,
  ]);

  const teamGroups = useMemo(
    () =>
      buildTeamFirstCongruentGroups({
        students: rosterStudents,
        preferences,
        teamPreferences,
        matches,
        opportunities,
      }),
    [rosterStudents, preferences, teamPreferences, matches, opportunities],
  );

  const teamClosureContext = useMemo(() => {
    const teamPrefsByStudent = buildTeamPrefsByStudent(teamPreferences);
    const teamEligibleOppIds = getTeamEligibleOpportunities(opportunities).map(
      (opportunity) => opportunity.id,
    );
    return {
      classmateListsByStudent: buildClassmateListsByStudent(
        teamPrefsByStudent,
        teamEligibleOppIds,
      ),
      activePickCount: getMaxActiveClassmatePicks(opportunities),
      teamSize: getLargestTeamSize(opportunities),
    };
  }, [teamPreferences, opportunities]);

  const preferenceBySubmitterId = useMemo(() => {
    const map = new Map();
    preferences.forEach((preference) => {
      const id = preference.submitter?.id;
      if (id) map.set(id, preference);
    });
    return map;
  }, [preferences]);

  const filteredTeamGroups = useMemo(() => {
    return teamGroups
      .map((group) => {
        if (peopleQ) {
          const haystack = group.members.map(profileHaystack).join(" ");
          if (!haystack.includes(peopleQ)) return null;
        }
        if (!opportunityQ) return group;
        const members = group.members.filter((member) =>
          preferenceRanksOpportunityQuery(
            preferenceBySubmitterId.get(member.id),
            opportunityQ,
          ),
        );
        if (members.length === 0) return null;
        return {
          ...group,
          members,
          memberIds: members.map((member) => member.id),
        };
      })
      .filter(Boolean);
  }, [teamGroups, peopleQ, opportunityQ, preferenceBySubmitterId]);

  if (loading && !round) {
    return (
      <Shell className="classTabMatchingRoundPanel">
        <EmptyNote>
          {t(
            "opportunities.matchingRound.matching.loading",
            {},
            { default: "Loading matching…" },
          )}
        </EmptyNote>
      </Shell>
    );
  }

  return (
    <Shell className="classTabMatchingRoundPanel">
      <MatchingRoundMatchingHeaderBar
        queueMode={queueMode}
        onQueueModeChange={setQueueMode}
        peopleQuery={peopleQuery}
        onPeopleQueryChange={setPeopleQuery}
        opportunityQuery={opportunityQuery}
        onOpportunityQueryChange={setOpportunityQuery}
      />

      {queueMode === MATCHING_VIEW_PROJECT_FIRST ? (
        <List>
          {filteredOpportunities.length === 0 ? (
            <EmptyNote>
              {t(
                "opportunities.matchingRound.matching.projectEmpty",
                {},
                { default: "No opportunities match these filters." },
              )}
            </EmptyNote>
          ) : (
            filteredOpportunities.map((opportunity) => (
              <ProjectFirstOpportunityCard
                key={opportunity.id}
                opportunity={opportunity}
                matches={matchesByOpportunity.get(opportunity.id) || []}
                preferences={preferences}
                preferenceBySubmitterId={preferenceBySubmitterId}
                t={t}
              />
            ))
          )}
        </List>
      ) : null}

      {queueMode === MATCHING_VIEW_TEAM_FIRST ? (
        <List>
          {filteredTeamGroups.length === 0 ? (
            <EmptyNote>
              {t(
                "opportunities.matchingRound.matching.teamEmpty",
                {},
                {
                  default:
                    "No team-first groups match these filters.",
                },
              )}
            </EmptyNote>
          ) : (
            filteredTeamGroups.map((group) => (
              <TeamFirstGroupCard
                key={group.id}
                group={group}
                preferences={preferences}
                preferenceBySubmitterId={preferenceBySubmitterId}
                classmateListsByStudent={
                  teamClosureContext.classmateListsByStudent
                }
                activePickCount={teamClosureContext.activePickCount}
                teamSize={teamClosureContext.teamSize}
                t={t}
              />
            ))
          )}
        </List>
      ) : null}

      {queueMode === MATCHING_VIEW_PIVOT ? (
        <MatchingRoundProjectPivotGrid
          opportunities={filteredOpportunities}
          preferences={preferences}
          matchesByOpportunity={matchesByOpportunity}
        />
      ) : null}
    </Shell>
  );
}
