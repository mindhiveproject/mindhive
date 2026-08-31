import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

import Chip from "../../../../DesignSystem/Chip";
import DropdownSelect from "../../../../DesignSystem/DropdownSelect";
import IconButton from "../../../../DesignSystem/IconButton";
import DefinitionForm from "../../../../Forms/DefinitionForm";
import { StarFilledIcon, StarIcon } from "../../../../DesignSystem/Icons";
import Navbar, { NavbarItem } from "../../../../DesignSystem/Navbar";
import { TEACHER_STUDENT_BALLOT_VIEW } from "../../../../Queries/ConnectMatch";
import useConnectMatchAssign from "../../../../../lib/useConnectMatchAssign";
import { isAssessmentFormAnswerComplete } from "../../../../../lib/connectPreferenceAssessmentData";
import {
  buildClassmateListsByStudent,
  buildPrefIndex,
  buildTeamPrefsByStudent,
  displayName,
  formatPreferenceSummary,
  getClassmateMutualStatus,
  getSubmissionStatus,
  getTeamEligibleOpportunities,
  inferBallotQueue,
  prefForStudentOpp,
  scoreForStudentOpp,
  studentDisplayName,
  summarizeMutualClassmates,
} from "../../../../../lib/connectBallotUtils";
import { downloadStudentBallotCsv } from "../../../../../lib/downloadStudentBallotCsv";
import MessageCard from "../../../../DesignSystem/MessageCard";
import MatchingAlgorithmInfoModal from "../../../shared/MatchingAlgorithmInfoModal";

const STUDENT_RANKING_SUB_MODES = {
  ballot: "ballot",
  interest: "interest",
};

const Shell = styled.div`
  display: grid;
  gap: 16px;
  width: 100%;
  min-width: 0;
`;

const PanelHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px 16px;
  margin-left: 14px;
`;

const HeaderText = styled.div`
  display: grid;
  gap: 4px;
  min-width: 0;

  h4 {
    margin: 0;
    font: var(--MH-Type-Title-Base);
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }

  p {
    margin: 0;
    font: var(--MH-Type-Body-Base);
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  }
`;

const SearchRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const SearchInput = styled.input`
  width: 100%;
  max-width: 280px;
  padding: 10px 14px;
  border: 1px solid var(--MH-Theme-Neutrals-Medium, #d3dae0);
  border-radius: 12px;
  background: var(--MH-Theme-Neutrals-White, #ffffff);
  font: var(--MH-Type-Body-Base);
  color: var(--MH-Theme-Neutrals-Black, #171717);
  outline: none;
  box-sizing: border-box;

  &:focus {
    border-color: var(--MH-Theme-Primary-Dark, #336f8a);
  }
`;

const QueueSection = styled.section`
  display: grid;
  gap: 10px;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
  background: var(--MH-Theme-Neutrals-White, #ffffff);
`;

const QueueTitle = styled.h5`
  margin: 0;
  font: var(--MH-Type-Title-Small);
  color: var(--MH-Theme-Neutrals-Black, #171717);
`;

const QueueHint = styled.p`
  margin: 0;
  font: var(--MH-Type-Body-Base);
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
`;

const StudentRow = styled.div`
  border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
  border-radius: 12px;
  background: var(--MH-Theme-Neutrals-Lighter, #f9f9f9);
  overflow: hidden;
`;

const RowSummary = styled.button`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 14px;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;

  &:focus-visible {
    outline: 2px solid var(--MH-Theme-Primary-Dark, #336f8a);
    outline-offset: -2px;
  }
`;

const RowMain = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  min-width: 0;
`;

const RowName = styled.span`
  font: var(--MH-Type-Title-Small);
  color: var(--MH-Theme-Neutrals-Black, #171717);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const RowUsername = styled.span`
  font: var(--MH-Type-Body-Base);
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
`;

const RowActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
`;

const RowDetail = styled.div`
  display: grid;
  gap: 16px;
  padding: 0 14px 14px;
  border-top: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
`;

const DetailSection = styled.section`
  display: grid;
  gap: 8px;
`;

const DetailTitle = styled.h6`
  margin: 0;
  font: var(--MH-Type-Label-Base);
  color: var(--MH-Theme-Neutrals-Black, #171717);
`;

const DetailList = styled.ol`
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 8px;
`;

const DetailItem = styled.li`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--MH-Theme-Neutrals-Medium, #e6e6e6);
  background: var(--MH-Theme-Neutrals-White, #ffffff);
`;

const RankBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  padding: 0 8px;
  border-radius: 999px;
  font: var(--MH-Type-Label-Base);
  background: var(--MH-Theme-Neutrals-Lighter, #f3f3f3);
  border: 1px solid var(--MH-Theme-Neutrals-Medium, #e6e6e6);
`;

const ItemTitle = styled.span`
  font: var(--MH-Type-Title-Small);
  color: var(--MH-Theme-Neutrals-Black, #171717);
`;

const Meta = styled.span`
  font: var(--MH-Type-Body-Base);
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
`;

const StarRow = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  color: #f5b800;
`;

const EmptyNote = styled.p`
  margin: 0;
  font: var(--MH-Type-Body-Base);
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
`;

const Chevron = styled.span`
  display: inline-flex;
  transition: transform 0.2s ease;
  transform: ${({ $open }) => ($open ? "rotate(180deg)" : "rotate(0deg)")};
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
`;

const STATUS_TONE = {
  not_started: "neutral",
  draft: "warning",
  submitted: "success",
  matched: "primary",
};

function sortStudents(a, b) {
  const statusOrder = {
    submitted: 0,
    draft: 1,
    matched: 2,
    not_started: 3,
  };
  const diff =
    (statusOrder[a.submissionStatus] ?? 9) -
    (statusOrder[b.submissionStatus] ?? 9);
  if (diff !== 0) return diff;
  return displayName(a.student).localeCompare(displayName(b.student));
}

function StudentBallotRow({
  row,
  studentById,
  classmateListsByStudent,
  opportunities,
  matchesByOpp,
  prefIndex,
  totalOpps,
  assessmentFormDefinition,
  isCurated,
  handleAssign,
  assigning,
  t,
  tConnect,
}) {
  const [expanded, setExpanded] = useState(false);
  const studentId = row.student.id;
  const classmateIds = classmateListsByStudent.get(studentId) || [];
  const mutualSummary = summarizeMutualClassmates(
    studentId,
    classmateIds,
    classmateListsByStudent,
  );

  const assignOptions = useMemo(() => {
    if (!isCurated || row.match) return [];
    return [...opportunities]
      .filter((opp) => {
        const cap = opp.studentCapacity || 1;
        const used = (matchesByOpp.get(opp.id) || []).length;
        return used < cap;
      })
      .sort((a, b) => {
        const scoreDiff =
          scoreForStudentOpp(studentId, b.id, prefIndex, totalOpps) -
          scoreForStudentOpp(studentId, a.id, prefIndex, totalOpps);
        if (scoreDiff !== 0) return scoreDiff;
        return (a.title || "").localeCompare(b.title || "");
      })
      .map((opp) => {
        const cap = opp.studentCapacity || 1;
        const used = (matchesByOpp.get(opp.id) || []).length;
        const pref = prefForStudentOpp(studentId, opp.id, prefIndex);
        const summary = formatPreferenceSummary(pref, tConnect);
        const prefLabel = summary ? ` · ${summary}` : "";
        return {
          value: opp.id,
          label: `${opp.title} (${used}/${cap})${prefLabel}`,
        };
      });
  }, [
    isCurated,
    row.match,
    opportunities,
    matchesByOpp,
    studentId,
    prefIndex,
    totalOpps,
    tConnect,
  ]);

  const rankedOpps = (row.preference?.items || [])
    .filter(
      (item) =>
        item.opportunity?.id &&
        item.rank !== "" &&
        item.rank !== null &&
        item.rank !== undefined,
    )
    .sort((a, b) => Number(a.rank) - Number(b.rank))
    .map((item) => ({ opportunity: item.opportunity, item }));

  const hasCompetencyAnswer =
    assessmentFormDefinition?.id &&
    isAssessmentFormAnswerComplete(
      row.preference?.assessmentData,
      assessmentFormDefinition.id,
    );

  const statusLabel = t(
    `opportunities.matchingRound.studentRanking.status.${row.submissionStatus}`,
    {},
    {
      default:
        row.submissionStatus === "submitted"
          ? "Submitted"
          : row.submissionStatus === "draft"
            ? "Draft"
            : row.submissionStatus === "matched"
              ? "Matched"
              : "Not started",
    },
  );

  const mutualLabel =
    mutualSummary.mutual + mutualSummary.oneWay + mutualSummary.received > 0
      ? t(
          "opportunities.matchingRound.studentRanking.mutualSummary",
          mutualSummary,
          {
            default:
              "{{mutual}} mutual · {{oneWay}} one-way · {{received}} received",
          },
        )
      : null;

  return (
    <StudentRow>
      <RowSummary
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((open) => !open)}
      >
        <RowMain>
          <RowName>{displayName(row.student)}</RowName>
          <RowUsername>{row.student.username}</RowUsername>
          <Chip
            variant="static"
            tone={STATUS_TONE[row.submissionStatus] || "neutral"}
            label={statusLabel}
          />
          {mutualLabel ? (
            <Chip variant="static" tone="neutral" label={mutualLabel} />
          ) : null}
          {row.match ? (
            <Meta>
              {t(
                "opportunities.matchingRound.studentRanking.currentMatch",
                { title: row.match.opportunity?.title || "—" },
                { default: "Matched to {{title}}" },
              )}
            </Meta>
          ) : null}
        </RowMain>
        <RowActions onClick={(e) => e.stopPropagation()}>
          {isCurated && !row.match ? (
            <DropdownSelect
              value=""
              onChange={(value) => value && handleAssign(studentId, value)}
              options={assignOptions}
              searchableSingle
              disabled={assigning || assignOptions.length === 0}
              placeholder={
                assignOptions.length === 0
                  ? tConnect("matchingRound.allFull", {}, {
                      default: "All opportunities full",
                    })
                  : tConnect("matchingRound.assignToOpportunity", {}, {
                      default: "Assign to opportunity…",
                    })
              }
              ariaLabel={tConnect("matchingRound.assignToOpportunity", {}, {
                default: "Assign to opportunity…",
              })}
              triggerStyle={{ minWidth: 220 }}
              fitContent
            />
          ) : null}
          <Chevron $open={expanded} aria-hidden>
            ▾
          </Chevron>
        </RowActions>
      </RowSummary>

      {expanded ? (
        <RowDetail>
          <DetailSection>
            <DetailTitle>
              {t("opportunities.studentView.rankForm.reviewClassmates", {}, {
                default: "Preferred classmates",
              })}
            </DetailTitle>
            {classmateIds.length === 0 ? (
              <EmptyNote>
                {t(
                  "opportunities.studentView.rankForm.reviewNoClassmates",
                  {},
                  { default: "None selected" },
                )}
              </EmptyNote>
            ) : (
              <DetailList>
                {classmateIds.map((classmateId, index) => {
                  const classmate = studentById.get(classmateId);
                  const mutualStatus = getClassmateMutualStatus(
                    studentId,
                    classmateId,
                    classmateListsByStudent,
                  );
                  const mutualChip =
                    mutualStatus === "mutual"
                      ? t(
                          "opportunities.matchingRound.studentRanking.mutual",
                          {},
                          { default: "Mutual" },
                        )
                      : mutualStatus === "one_way"
                        ? t(
                            "opportunities.matchingRound.studentRanking.oneWay",
                            {},
                            { default: "One-way" },
                          )
                        : null;
                  return (
                    <DetailItem key={classmateId}>
                      <RankBadge>{index + 1}</RankBadge>
                      <ItemTitle>
                        {studentDisplayName(classmate) || classmateId}
                      </ItemTitle>
                      {mutualChip ? (
                        <Chip
                          variant="static"
                          tone={
                            mutualStatus === "mutual" ? "success" : "warning"
                          }
                          label={mutualChip}
                        />
                      ) : null}
                    </DetailItem>
                  );
                })}
              </DetailList>
            )}
          </DetailSection>

          <DetailSection>
            <DetailTitle>
              {t("opportunities.studentView.rankForm.reviewOpportunities", {}, {
                default: "Ranked opportunities",
              })}
            </DetailTitle>
            {rankedOpps.length === 0 ? (
              <EmptyNote>
                {t(
                  "opportunities.studentView.rankForm.reviewNoOpportunities",
                  {},
                  { default: "No opportunities ranked yet" },
                )}
              </EmptyNote>
            ) : (
              <DetailList>
                {rankedOpps.map(({ opportunity, item }) => {
                  const stars =
                    item?.starRating == null || item?.starRating === ""
                      ? 0
                      : Number(item.starRating);
                  const comment = (item?.comment || "").trim();
                  return (
                    <DetailItem key={opportunity?.id || item?.id}>
                      <RankBadge>{item?.rank ?? "—"}</RankBadge>
                      <ItemTitle>{opportunity?.title || "—"}</ItemTitle>
                      {stars > 0 ? (
                        <StarRow aria-label={`${stars} stars`}>
                          {[1, 2, 3, 4, 5].map((n) =>
                            n <= stars ? (
                              <StarFilledIcon
                                key={n}
                                width={16}
                                height={16}
                                aria-hidden
                              />
                            ) : (
                              <StarIcon
                                key={n}
                                width={16}
                                height={16}
                                aria-hidden
                              />
                            ),
                          )}
                        </StarRow>
                      ) : null}
                      {comment ? <Meta>{comment}</Meta> : null}
                    </DetailItem>
                  );
                })}
              </DetailList>
            )}
          </DetailSection>

          <DetailSection>
            <DetailTitle>
              {t("opportunities.studentView.rankForm.reviewNotesLabel", {}, {
                default: "Additional notes",
              })}
            </DetailTitle>
            <Meta>
              {(row.preference?.notes || "").trim() ||
                t(
                  "opportunities.matchingRound.studentRanking.noNotes",
                  {},
                  { default: "None" },
                )}
            </Meta>
          </DetailSection>

          <DetailSection>
            <DetailTitle>
              {t("opportunities.matchingRound.studentRanking.competency", {}, {
                default: "Core competency assessment",
              })}
            </DetailTitle>
            {!assessmentFormDefinition?.id ? (
              <EmptyNote>
                {t(
                  "opportunities.matchingRound.studentRanking.competencyNotConfigured",
                  {},
                  {
                    default:
                      "No assessment questionnaire is linked to this round.",
                  },
                )}
              </EmptyNote>
            ) : !hasCompetencyAnswer ? (
              <EmptyNote>
                {t(
                  "opportunities.matchingRound.studentRanking.competencyEmpty",
                  {},
                  {
                    default:
                      "Assessment not completed for this student.",
                  },
                )}
              </EmptyNote>
            ) : (
              <DefinitionForm
                definitionId={assessmentFormDefinition.id}
                assessmentEntryFormDefinitionId={assessmentFormDefinition.id}
                entity={{ assessmentData: row.preference?.assessmentData }}
                readOnly
                hideUnansweredFields
                hideSaveButton
                quiet
              />
            )}
          </DetailSection>

          {row.preference?.submittedAt ? (
            <Meta>
              {t(
                "opportunities.matchingRound.studentRanking.submittedAt",
                {
                  date: new Date(row.preference.submittedAt).toLocaleString(),
                },
                { default: "Submitted {{date}}" },
              )}
            </Meta>
          ) : null}
        </RowDetail>
      ) : null}
    </StudentRow>
  );
}

export { STUDENT_RANKING_SUB_MODES };

const MatchingRoundStudentBallotPanel = forwardRef(
  function MatchingRoundStudentBallotPanel(
    {
      roundId,
      students = [],
      enabled = true,
      subMode = STUDENT_RANKING_SUB_MODES.ballot,
      onSubModeChange,
      renderInterestGrid,
      ballotWindowActive = true,
      inactiveBallotMessage = null,
      roundTitle = "",
    },
    ref,
  ) {
  const { t } = useTranslation("classes");
  const { t: tConnect } = useTranslation("connect");
  const [search, setSearch] = useState("");
  const [matchingInfoOpen, setMatchingInfoOpen] = useState(false);
  const [expandedQueue, setExpandedQueue] = useState({
    project_first: true,
    team_first: true,
  });

  const { data, loading, refetch } = useQuery(TEACHER_STUDENT_BALLOT_VIEW, {
    variables: { roundId },
    skip: !roundId || !enabled,
    fetchPolicy: "cache-and-network",
  });

  const round = data?.connectRound;
  const opportunities = round?.opportunities || [];
  const preferences = round?.preferences || [];
  const teamPreferences = round?.teamPreferences || [];
  const matches = round?.matches || [];
  const assessmentFormDefinition = round?.studentAssessmentFormDefinition;

  const teamEligibleOpps = useMemo(
    () => getTeamEligibleOpportunities(opportunities),
    [opportunities],
  );
  const teamEligibleOppIds = useMemo(
    () => teamEligibleOpps.map((o) => o.id),
    [teamEligibleOpps],
  );

  const teamPrefsByStudent = useMemo(
    () => buildTeamPrefsByStudent(teamPreferences),
    [teamPreferences],
  );
  const classmateListsByStudent = useMemo(
    () =>
      buildClassmateListsByStudent(teamPrefsByStudent, teamEligibleOppIds),
    [teamPrefsByStudent, teamEligibleOppIds],
  );

  const prefByStudentId = useMemo(() => {
    const map = new Map();
    preferences.forEach((p) => {
      const id = p.submitter?.id;
      if (id) map.set(id, p);
    });
    return map;
  }, [preferences]);

  const matchByStudentId = useMemo(() => {
    const map = new Map();
    matches.forEach((m) => {
      const id = m.student?.id;
      if (id) map.set(id, m);
    });
    return map;
  }, [matches]);

  const studentById = useMemo(() => {
    const map = new Map();
    (students || []).forEach((s) => {
      if (s?.id) map.set(s.id, s);
    });
    preferences.forEach((p) => {
      const s = p.submitter;
      if (s?.id && !map.has(s.id)) map.set(s.id, s);
    });
    teamPreferences.forEach((tp) => {
      const s = tp.preferredTeammate;
      if (s?.id && !map.has(s.id)) map.set(s.id, s);
    });
    return map;
  }, [students, preferences, teamPreferences]);

  const rosterStudents = useMemo(() => {
    const ids = new Set();
    const list = [];
    (students || []).forEach((s) => {
      if (s?.id && !ids.has(s.id)) {
        ids.add(s.id);
        list.push(s);
      }
    });
    preferences.forEach((p) => {
      const s = p.submitter;
      if (s?.id && !ids.has(s.id)) {
        ids.add(s.id);
        list.push(s);
      }
    });
    return list;
  }, [students, preferences]);

  const ballotRows = useMemo(() => {
    return rosterStudents.map((student) => {
      const preference = prefByStudentId.get(student.id);
      const match = matchByStudentId.get(student.id);
      const studentTeamPrefs = teamPrefsByStudent.get(student.id) || [];
      return {
        student,
        preference,
        match,
        submissionStatus: getSubmissionStatus(student, preference, match),
        queue: inferBallotQueue(studentTeamPrefs),
      };
    });
  }, [rosterStudents, prefByStudentId, matchByStudentId, teamPrefsByStudent]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ballotRows;
    return ballotRows.filter((row) => {
      const hay = [
        displayName(row.student),
        row.student.username,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [ballotRows, search]);

  const projectFirstRows = useMemo(
    () =>
      filteredRows
        .filter((r) => r.queue === "project_first")
        .sort(sortStudents),
    [filteredRows],
  );
  const teamFirstRows = useMemo(
    () =>
      filteredRows.filter((r) => r.queue === "team_first").sort(sortStudents),
    [filteredRows],
  );

  const prefIndex = useMemo(
    () => buildPrefIndex(preferences, { submittedOnly: false }),
    [preferences],
  );
  const totalOpps = opportunities.length;

  const matchesByOpp = useMemo(() => {
    const map = new Map();
    matches.forEach((m) => {
      const oppId = m.opportunity?.id;
      if (!oppId) return;
      if (!map.has(oppId)) map.set(oppId, []);
      map.get(oppId).push(m);
    });
    return map;
  }, [matches]);

  const isCurated = round?.matchingAlgorithm === "teacher_curated";
  const { handleAssign, assigning } = useConnectMatchAssign({
    round,
    opportunities,
    matches,
    refetch,
  });

  const submittedCount = ballotRows.filter(
    (r) => r.submissionStatus === "submitted",
  ).length;
  const matchedCount = ballotRows.filter(
    (r) => r.submissionStatus === "matched",
  ).length;

  const toggleQueue = useCallback((queueKey) => {
    setExpandedQueue((prev) => ({
      ...prev,
      [queueKey]: !prev[queueKey],
    }));
  }, []);

  const canDownloadBallotCsv = rosterStudents.length > 0;

  const handleDownloadBallotCsv = useCallback(() => {
    if (!canDownloadBallotCsv) return;
    downloadStudentBallotCsv({
      ballotRows,
      studentById,
      classmateListsByStudent,
      assessmentFormDefinitionId: assessmentFormDefinition?.id,
      roundTitle: roundTitle || round?.title || "",
      labels: {
        studentName: t(
          "opportunities.matchingRound.studentBallotExport.columns.student",
          {},
          { default: "Student" },
        ),
        username: t(
          "opportunities.matchingRound.studentBallotExport.columns.username",
          {},
          { default: "Username" },
        ),
        status: t(
          "opportunities.matchingRound.studentBallotExport.columns.status",
          {},
          { default: "Status" },
        ),
        queue: t(
          "opportunities.matchingRound.studentBallotExport.columns.queue",
          {},
          { default: "Queue" },
        ),
        mutualClassmates: t(
          "opportunities.matchingRound.studentBallotExport.columns.mutualClassmates",
          {},
          { default: "Mutual classmates" },
        ),
        oneWayClassmates: t(
          "opportunities.matchingRound.studentBallotExport.columns.oneWayClassmates",
          {},
          { default: "One-way classmates" },
        ),
        receivedClassmates: t(
          "opportunities.matchingRound.studentBallotExport.columns.receivedClassmates",
          {},
          { default: "Received classmates" },
        ),
        preferredClassmates: t(
          "opportunities.matchingRound.studentBallotExport.columns.preferredClassmates",
          {},
          { default: "Preferred classmates" },
        ),
        rankedOpportunities: t(
          "opportunities.matchingRound.studentBallotExport.columns.rankedOpportunities",
          {},
          { default: "Ranked opportunities" },
        ),
        additionalNotes: t(
          "opportunities.matchingRound.studentBallotExport.columns.additionalNotes",
          {},
          { default: "Additional notes" },
        ),
        matchedOpportunity: t(
          "opportunities.matchingRound.studentBallotExport.columns.matchedOpportunity",
          {},
          { default: "Matched opportunity" },
        ),
        submittedAt: t(
          "opportunities.matchingRound.studentBallotExport.columns.submittedAt",
          {},
          { default: "Submitted at" },
        ),
        queueProjectFirst: t(
          "opportunities.matchingRound.studentRanking.queueProjectFirst",
          {},
          { default: "Project-first queue" },
        ),
        queueTeamFirst: t(
          "opportunities.matchingRound.studentRanking.queueTeamFirst",
          {},
          { default: "Team-first queue" },
        ),
        statusNotStarted: t(
          "opportunities.matchingRound.studentRanking.status.not_started",
          {},
          { default: "Not started" },
        ),
        statusDraft: t(
          "opportunities.matchingRound.studentRanking.status.draft",
          {},
          { default: "Draft" },
        ),
        statusSubmitted: t(
          "opportunities.matchingRound.studentRanking.status.submitted",
          {},
          { default: "Submitted" },
        ),
        statusMatched: t(
          "opportunities.matchingRound.studentRanking.status.matched",
          {},
          { default: "Matched" },
        ),
      },
    });
  }, [
    assessmentFormDefinition?.id,
    ballotRows,
    canDownloadBallotCsv,
    classmateListsByStudent,
    round?.title,
    roundTitle,
    rosterStudents.length,
    studentById,
    t,
  ]);

  useImperativeHandle(
    ref,
    () => ({
      downloadCsv: handleDownloadBallotCsv,
      canDownloadCsv: canDownloadBallotCsv,
    }),
    [canDownloadBallotCsv, handleDownloadBallotCsv],
  );

  const subModeNav =
    onSubModeChange ? (
      <Navbar style={{ paddingLeft: 0, paddingRight: 0 }}>
        <NavbarItem
          selected={subMode === STUDENT_RANKING_SUB_MODES.ballot}
          onClick={() => onSubModeChange(STUDENT_RANKING_SUB_MODES.ballot)}
        >
          {t("opportunities.matchingRound.studentRanking.modeBallot", {}, {
            default: "Ballots",
          })}
        </NavbarItem>
        <NavbarItem
          selected={subMode === STUDENT_RANKING_SUB_MODES.interest}
          onClick={() => onSubModeChange(STUDENT_RANKING_SUB_MODES.interest)}
        >
          {t("opportunities.matchingRound.studentRanking.modeInterest", {}, {
            default: "Interest",
          })}
        </NavbarItem>
      </Navbar>
    ) : null;

  if (subMode === STUDENT_RANKING_SUB_MODES.interest) {
    return (
      <Shell className="matchingRoundStudentBallotPanel">
        {subModeNav ? (
          <PanelHeader>
            <HeaderText>
              <h4>
                {t("opportunities.matchingRound.studentInterest.title", {}, {
                  default: "Interest",
                })}
              </h4>
            </HeaderText>
            {subModeNav}
          </PanelHeader>
        ) : null}
        {renderInterestGrid?.() || null}
      </Shell>
    );
  }

  if (loading && !round) {
    return (
      <Shell>
        <EmptyNote>
          {t("opportunities.matchingRound.studentRanking.loading", {}, {
            default: "Loading student ballots…",
          })}
        </EmptyNote>
      </Shell>
    );
  }

  if (!ballotWindowActive && inactiveBallotMessage) {
    return (
      <Shell className="matchingRoundStudentBallotPanel">
        <PanelHeader>
          <HeaderText>
            <h4>
              {t("opportunities.matchingRound.studentRanking.title", {}, {
                default: "Student ballots",
              })}
            </h4>
          </HeaderText>
          {subModeNav}
        </PanelHeader>
        <MessageCard variant="neutral" message={inactiveBallotMessage} />
      </Shell>
    );
  }

  const renderQueue = (queueKey, title, hint, rows) => (
    <QueueSection key={queueKey}>
      <button
        type="button"
        onClick={() => toggleQueue(queueKey)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: 0,
          border: "none",
          background: "transparent",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <div>
          <QueueTitle>{title}</QueueTitle>
          <QueueHint>{hint}</QueueHint>
        </div>
        <Chevron $open={expandedQueue[queueKey]} aria-hidden>
          ▾
        </Chevron>
      </button>
      {expandedQueue[queueKey] ? (
        rows.length === 0 ? (
          <EmptyNote>
            {t(
              "opportunities.matchingRound.studentRanking.queueEmpty",
              {},
              { default: "No students in this queue." },
            )}
          </EmptyNote>
        ) : (
          rows.map((row) => (
            <StudentBallotRow
              key={row.student.id}
              row={row}
              studentById={studentById}
              classmateListsByStudent={classmateListsByStudent}
              opportunities={opportunities}
              matchesByOpp={matchesByOpp}
              prefIndex={prefIndex}
              totalOpps={totalOpps}
              assessmentFormDefinition={assessmentFormDefinition}
              isCurated={isCurated}
              handleAssign={handleAssign}
              assigning={assigning}
              t={t}
              tConnect={tConnect}
            />
          ))
        )
      ) : null}
    </QueueSection>
  );

  return (
    <Shell className="matchingRoundStudentBallotPanel">
      <PanelHeader>
        <HeaderText>
          <h4>
            {t("opportunities.matchingRound.studentRanking.title", {}, {
              default: "Student ballots",
            })}
          </h4>
          <p>
            {t(
              "opportunities.matchingRound.studentRanking.summary",
              {
                total: rosterStudents.length,
                submitted: submittedCount,
                matched: matchedCount,
                projectFirst: projectFirstRows.length,
                teamFirst: teamFirstRows.length,
              },
              {
                default:
                  "{{submitted}} submitted · {{matched}} matched · {{projectFirst}} project-first · {{teamFirst}} team-first",
              },
            )}
          </p>
        </HeaderText>
        {subModeNav}
      </PanelHeader>

      <SearchRow>
        <SearchInput
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t(
            "opportunities.matchingRound.studentRanking.searchPlaceholder",
            {},
            { default: "Search students…" },
          )}
          aria-label={t(
            "opportunities.matchingRound.studentRanking.searchPlaceholder",
            {},
            { default: "Search students…" },
          )}
        />
        <IconButton
          variant="text"
          elevated={false}
          style={{ background: "var(--MH-Theme-Neutrals-Lighter, #f3f3f3)" }}
          ariaLabel={t(
            "opportunities.matchingRound.matchingInfo.infoAria",
            {},
            { default: "How student matching works" },
          )}
          title={t(
            "opportunities.matchingRound.matchingInfo.infoAria",
            {},
            { default: "How student matching works" },
          )}
          onClick={() => setMatchingInfoOpen(true)}
          icon={
            <img
              src="/assets/icons/info.svg"
              alt=""
              width={20}
              height={20}
              style={{ width: 20, height: 20 }}
            />
          }
        />
      </SearchRow>

      <MatchingAlgorithmInfoModal
        open={matchingInfoOpen}
        onClose={() => setMatchingInfoOpen(false)}
        matchingAlgorithm={round?.matchingAlgorithm}
        showBallotWorkflow
      />

      {renderQueue(
        "project_first",
        t(
          "opportunities.matchingRound.studentRanking.queueProjectFirst",
          {},
          { default: "Project-first queue" },
        ),
        t(
          "opportunities.matchingRound.studentRanking.queueProjectFirstHint",
          {},
          {
            default:
              "Students who did not rank classmates. Process these first.",
          },
        ),
        projectFirstRows,
      )}

      {renderQueue(
        "team_first",
        t(
          "opportunities.matchingRound.studentRanking.queueTeamFirst",
          {},
          { default: "Team-first queue" },
        ),
        t(
          "opportunities.matchingRound.studentRanking.queueTeamFirstHint",
          {},
          {
            default:
              "Students who ranked classmates. Review mutual picks here.",
          },
        ),
        teamFirstRows,
      )}
    </Shell>
  );
  },
);

export default MatchingRoundStudentBallotPanel;
