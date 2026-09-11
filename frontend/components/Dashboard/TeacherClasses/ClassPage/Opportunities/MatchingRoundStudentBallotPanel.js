import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { useQuery, useMutation } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

import Chip from "../../../../DesignSystem/Chip";
import Button from "../../../../DesignSystem/Button";
import DefinitionForm from "../../../../Forms/DefinitionForm";
import {
  PencilIcon,
  StarFilledIcon,
  StarIcon,
  UnlockIcon,
} from "../../../../DesignSystem/Icons";
import ButtonGroup from "../../../../DesignSystem/ButtonGroup";
import { TEACHER_STUDENT_BALLOT_VIEW } from "../../../../Queries/ConnectMatch";
import { UPDATE_PREFERENCE } from "../../../../Mutations/ConnectPreference";
import { isAssessmentFormAnswerComplete } from "../../../../../lib/connectPreferenceAssessmentData";
import {
  buildClassmateListsByStudent,
  buildTeamPrefsByStudent,
  displayName,
  getClassmateMutualStatus,
  getMaxActiveClassmatePicks,
  getSubmissionStatus,
  getTeamEligibleOpportunities,
  inferBallotQueue,
  summarizeMutualClassmates,
} from "../../../../../lib/connectBallotUtils";
import { downloadStudentBallotCsv } from "../../../../../lib/downloadStudentBallotCsv";
import MessageCard from "../../../../DesignSystem/MessageCard";
import Modal from "../../../../DesignSystem/Modal";
import StudentNameDisplay from "./StudentNameDisplay";
import StudentPreferenceSubmission from "../../../StudentClasses/ClassPage/Opportunities/StudentPreferenceSubmission";

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

const RankingCard = styled.div`
  display: grid;
  gap: 16px;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
  background: var(--MH-Theme-Neutrals-White, #ffffff);
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
`;

const PanelHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px 16px;
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
  padding: 10px 14px;
  border: 1px solid #d3dae0;
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

const BallotList = styled.div`
  display: grid;
  gap: 10px;
`;

const StudentRow = styled.div`
  border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
  border-radius: 12px;
  background: #f9f9f9;
  overflow: hidden;
`;

const RowSummary = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 14px;
  box-sizing: border-box;
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

const RowActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-start;
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
  padding-top: 16px;
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

const ActiveZoneGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border-radius: 12px;
  background: #f9f9f9;
  border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
  box-shadow: 0 1px 2px rgba(23, 23, 23, 0.06);
`;

const DetailItem = styled.li`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
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
  border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
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

const ZoneLabel = styled.p`
  margin: 0;
  font: var(--MH-Type-Body-Base, 400 14px/20px "Inter", sans-serif);
  letter-spacing: 0;
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
`;

function StudentBallotRow({
  row,
  studentById,
  preferenceByStudentId,
  classmateListsByStudent,
  activePickCount = 0,
  assessmentFormDefinition,
  handleReopenBallot,
  handleEditBallot,
  reopeningPreferenceId,
  ballotWindowActive = true,
  t,
}) {
  const [expanded, setExpanded] = useState(false);
  const studentId = row.student.id;
  const classmateIds = classmateListsByStudent.get(studentId) || [];
  const mutualSummary = summarizeMutualClassmates(
    studentId,
    classmateIds,
    classmateListsByStudent,
    activePickCount,
  );

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

  const canReopenBallot =
    row.preference?.status === "submitted" && Boolean(row.preference?.id);
  const isMatched = row.submissionStatus === "matched";
  const canEditBallot = !isMatched;
  const isReopening = reopeningPreferenceId === row.preference?.id;
  const reopenDisabled = isReopening || !ballotWindowActive;

  const handleReopenClick = () => {
    if (!canReopenBallot || reopenDisabled) return;
    handleReopenBallot(row.preference.id, displayName(row.student));
  };

  const handleEditClick = () => {
    if (!canEditBallot) return;
    handleEditBallot(row);
  };

  const expandLabel = expanded
    ? t(
        "opportunities.matchingRound.studentRanking.hideFullBallot",
        {},
        { default: "Hide full ballot" },
      )
    : t(
        "opportunities.matchingRound.studentRanking.viewFullBallot",
        {},
        { default: "View full ballot" },
      );

  return (
    <StudentRow>
      <RowSummary>
        <RowMain>
          <RowName>
            <StudentNameDisplay
              student={row.student}
              preference={row.preference}
            />
          </RowName>
          <Chip
            variant="static"
            tone={STATUS_TONE[row.submissionStatus] || "neutral"}
            label={statusLabel}
          />
          {mutualLabel ? (
            <Chip variant="static" tone="neutral" label={mutualLabel} />
          ) : null}
        </RowMain>
        <RowActions>
          <Button
            type="button"
            variant="text"
            style={{ color: "var(--MH-Theme-Neutrals-Black, #171717)" }}
            aria-expanded={expanded}
            onClick={() => setExpanded((open) => !open)}
          >
            {expandLabel}
          </Button>
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
              <>
                {activePickCount > 0 && classmateIds.length > 0 ? (
                  <ZoneLabel>
                    {t(
                      "opportunities.studentView.rankForm.classmatesActiveZoneLabel",
                      { count: activePickCount },
                      {
                        default:
                          "These {{count}} classmates count toward team matching (order does not matter)",
                      },
                    )}
                  </ZoneLabel>
                ) : null}
                {activePickCount > 0 && classmateIds.length > 0 ? (
                  <ActiveZoneGroup>
                    {classmateIds.slice(0, activePickCount).map((classmateId, index) => {
                      const classmate = studentById.get(classmateId);
                      const mutualStatus = getClassmateMutualStatus(
                        studentId,
                        classmateId,
                        classmateListsByStudent,
                        activePickCount,
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
                            <StudentNameDisplay
                              student={
                                classmate || {
                                  id: classmateId,
                                  username: classmateId,
                                }
                              }
                              preference={
                                preferenceByStudentId?.get?.(classmateId) ||
                                null
                              }
                            />
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
                  </ActiveZoneGroup>
                ) : null}
                {classmateIds.length > activePickCount && activePickCount > 0 ? (
                  <>
                    <ZoneLabel>
                      {t(
                        "opportunities.studentView.rankForm.classmatesOverflowLabel",
                        {},
                        { default: "Additional rankings" },
                      )}
                    </ZoneLabel>
                    <DetailList>
                      {classmateIds.slice(activePickCount).map((classmateId, index) => {
                        const classmate = studentById.get(classmateId);
                        const mutualStatus = getClassmateMutualStatus(
                          studentId,
                          classmateId,
                          classmateListsByStudent,
                          activePickCount,
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
                            <RankBadge>{activePickCount + index + 1}</RankBadge>
                            <ItemTitle>
                              <StudentNameDisplay
                                student={
                                  classmate || {
                                    id: classmateId,
                                    username: classmateId,
                                  }
                                }
                                preference={
                                  preferenceByStudentId?.get?.(classmateId) ||
                                  null
                                }
                              />
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
                  </>
                ) : activePickCount === 0 ? (
                  <DetailList>
                    {classmateIds.map((classmateId, index) => {
                      const classmate = studentById.get(classmateId);
                      const mutualStatus = getClassmateMutualStatus(
                        studentId,
                        classmateId,
                        classmateListsByStudent,
                        activePickCount,
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
                            <StudentNameDisplay
                              student={
                                classmate || {
                                  id: classmateId,
                                  username: classmateId,
                                }
                              }
                              preference={
                                preferenceByStudentId?.get?.(classmateId) ||
                                null
                              }
                            />
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
                ) : null}
              </>
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
          {canReopenBallot || canEditBallot ? (
            <RowActions>
              {canReopenBallot ? (
                <Button
                  type="button"
                  variant="tonal"
                  leadingIcon={<UnlockIcon />}
                  onClick={handleReopenClick}
                  disabled={reopenDisabled}
                  title={
                    !ballotWindowActive
                      ? t(
                          "opportunities.matchingRound.studentRanking.reopenBallotDisabledWindowClosed",
                          {},
                          {
                            default:
                              "Cannot reopen a ballot after the student ranking window has closed. Use Edit ballot instead.",
                          },
                        )
                      : undefined
                  }
                >
                  {t("opportunities.matchingRound.studentRanking.reopenBallot", {}, {
                    default: "Reopen ballot",
                  })}
                </Button>
              ) : null}
              {canEditBallot ? (
                <Button
                  type="button"
                  variant="tonal"
                  leadingIcon={<PencilIcon />}
                  onClick={handleEditClick}
                  title={
                    isMatched
                      ? t(
                          "opportunities.matchingRound.studentRanking.editBallotDisabledMatched",
                          {},
                          {
                            default:
                              "Cannot edit a ballot after the student has been matched.",
                          },
                        )
                      : undefined
                  }
                >
                  {t("opportunities.matchingRound.studentRanking.editBallot", {}, {
                    default: "Edit ballot",
                  })}
                </Button>
              ) : null}
            </RowActions>
          ) : null}
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
  const [search, setSearch] = useState("");
  const [reopeningPreferenceId, setReopeningPreferenceId] = useState(null);
  const [reopenFeedback, setReopenFeedback] = useState(null);
  const [reopenTarget, setReopenTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);

  const { data, loading, refetch } = useQuery(TEACHER_STUDENT_BALLOT_VIEW, {
    variables: { roundId },
    skip: !roundId || !enabled,
    fetchPolicy: "cache-and-network",
  });

  const [updatePreference] = useMutation(UPDATE_PREFERENCE);

  const round = data?.connectRound;
  const roundStatus = round?.status || "";
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
  const activePickCount = useMemo(
    () => getMaxActiveClassmatePicks(opportunities),
    [opportunities],
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
        queue: inferBallotQueue(studentTeamPrefs, preference),
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

  const sortedRows = useMemo(
    () => [...filteredRows].sort(sortStudents),
    [filteredRows],
  );

  const handleReopenBallot = useCallback((preferenceId, studentName) => {
    if (!ballotWindowActive) return;
    setReopenFeedback(null);
    setReopenTarget({ preferenceId, studentName });
  }, [ballotWindowActive]);

  const handleEditBallot = useCallback((row) => {
    if (!row?.student?.id || row.submissionStatus === "matched") return;
    setEditTarget({
      student: row.student,
      preference: row.preference || null,
    });
  }, []);

  const closeEditBallotModal = useCallback(() => {
    setEditTarget(null);
  }, []);

  const handleEditBallotSaved = useCallback(async () => {
    await refetch();
    setEditTarget(null);
    setReopenFeedback({
      variant: "success",
      message: t(
        "opportunities.matchingRound.studentRanking.editBallotSubmitSuccess",
        {},
        { default: "Student ballot saved." },
      ),
    });
  }, [refetch, t]);

  const handleEditBallotStaffRefetch = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const editStaffForStudent = useMemo(() => {
    if (!editTarget?.student?.id) return null;
    const studentId = editTarget.student.id;
    const preference =
      prefByStudentId.get(studentId) || editTarget.preference || null;
    const studentTeamPreferences = (teamPreferences || []).filter(
      (tp) => tp.submitter?.id === studentId,
    );
    const questionAnswers = (round?.questionAnswers || []).filter(
      (qa) => qa.respondent?.id === studentId,
    );
    return {
      id: studentId,
      preference,
      teamPreferences: studentTeamPreferences,
      questionAnswers,
    };
  }, [
    editTarget,
    prefByStudentId,
    round?.questionAnswers,
    teamPreferences,
  ]);

  const closeReopenModal = useCallback(() => {
    if (reopeningPreferenceId) return;
    setReopenTarget(null);
  }, [reopeningPreferenceId]);

  const confirmReopenBallot = useCallback(async () => {
    const preferenceId = reopenTarget?.preferenceId;
    if (!preferenceId || !ballotWindowActive) return;

    setReopenFeedback(null);
    setReopeningPreferenceId(preferenceId);
    try {
      await updatePreference({
        variables: {
          id: preferenceId,
          input: {
            status: "draft",
            submittedAt: null,
          },
        },
      });
      await refetch();
      setReopenTarget(null);
      setReopenFeedback({
        variant: "success",
        message: t(
          "opportunities.matchingRound.studentRanking.reopenBallotSuccess",
          {},
          {
            default:
              "Ballot reopened. The student can edit their preferences again.",
          },
        ),
      });
    } catch {
      setReopenFeedback({
        variant: "warning",
        message: t(
          "opportunities.matchingRound.studentRanking.reopenBallotFailed",
          {},
          {
            default: "Could not reopen this ballot. Please try again.",
          },
        ),
      });
    } finally {
      setReopeningPreferenceId(null);
    }
  }, [ballotWindowActive, refetch, reopenTarget, t, updatePreference]);

  const submittedCount = ballotRows.filter(
    (r) => r.submissionStatus === "submitted",
  ).length;
  const matchedCount = ballotRows.filter(
    (r) => r.submissionStatus === "matched",
  ).length;
  const draftCount = ballotRows.filter(
    (r) => r.submissionStatus === "draft",
  ).length;
  const projectFirstCount = ballotRows.filter(
    (r) => r.queue === "project_first",
  ).length;
  const teamFirstCount = ballotRows.filter(
    (r) => r.queue === "team_first",
  ).length;

  const canDownloadBallotCsv = rosterStudents.length > 0;

  const handleDownloadBallotCsv = useCallback(() => {
    if (!canDownloadBallotCsv) return;
    downloadStudentBallotCsv({
      ballotRows,
      studentById,
      classmateListsByStudent,
      activePickCount,
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
        preferredClassmateRank: (n) =>
          t(
            "opportunities.matchingRound.studentBallotExport.columns.preferredClassmateRank",
            { n },
            { default: "Preferred classmate {{n}}" },
          ),
        rankedOpportunityRank: (n) =>
          t(
            "opportunities.matchingRound.studentBallotExport.columns.rankedOpportunityRank",
            { n },
            { default: "Ranked opportunity {{n}}" },
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
    activePickCount,
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

  const subModeNav = onSubModeChange ? (
    <ButtonGroup
      type="Round"
      size="Medium"
      selectionMode="single"
      selectionRequired
      value={subMode}
      onChange={(value) => {
        if (typeof value === "string") {
          onSubModeChange(value);
        }
      }}
      items={[
        {
          value: STUDENT_RANKING_SUB_MODES.ballot,
          label: t(
            "opportunities.matchingRound.studentRanking.modeBallot",
            {},
            { default: "Ballots" },
          ),
        },
        {
          value: STUDENT_RANKING_SUB_MODES.interest,
          label: t(
            "opportunities.matchingRound.studentRanking.modeInterest",
            {},
            { default: "Interest" },
          ),
        },
      ]}
      aria-label={t(
        "opportunities.matchingRound.studentRanking.modeAria",
        {},
        { default: "Student ranking view" },
      )}
    />
  ) : null;

  if (subMode === STUDENT_RANKING_SUB_MODES.interest) {
    return (
      <Shell className="matchingRoundStudentBallotPanel">
        <RankingCard>
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
        </RankingCard>
      </Shell>
    );
  }

  if (loading && !round) {
    return (
      <Shell className="matchingRoundStudentBallotPanel">
        <RankingCard>
          <EmptyNote>
            {t("opportunities.matchingRound.studentRanking.loading", {}, {
              default: "Loading student ballots…",
            })}
          </EmptyNote>
        </RankingCard>
      </Shell>
    );
  }

  if (!ballotWindowActive && inactiveBallotMessage && roundStatus === "draft") {
    return (
      <Shell className="matchingRoundStudentBallotPanel">
        <RankingCard>
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
        </RankingCard>
      </Shell>
    );
  }

  return (
    <Shell className="matchingRoundStudentBallotPanel">
      <RankingCard>
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
                  drafts: draftCount,
                  projectFirst: projectFirstCount,
                  teamFirst: teamFirstCount,
                },
                {
                  default:
                    "{{submitted}} submitted · {{matched}} matched · {{drafts}} drafts · {{projectFirst}} project-first · {{teamFirst}} team-first",
                },
              )}
            </p>
          </HeaderText>
          {subModeNav}
        </PanelHeader>

        {!ballotWindowActive && inactiveBallotMessage ? (
          <MessageCard variant="neutral" message={inactiveBallotMessage} />
        ) : null}
        {reopenFeedback ? (
          <MessageCard
            variant={reopenFeedback.variant}
            message={reopenFeedback.message}
            onClose={() => setReopenFeedback(null)}
            closeAriaLabel={t(
              "opportunities.matchingRound.studentRanking.reopenBallotDismiss",
              {},
              { default: "Dismiss" },
            )}
          />
        ) : null}

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
        </SearchRow>

        <Modal
          open={Boolean(reopenTarget)}
          onClose={reopeningPreferenceId ? undefined : closeReopenModal}
          title={t(
            "opportunities.matchingRound.studentRanking.reopenBallotConfirmTitle",
            { name: reopenTarget?.studentName || "" },
            { default: "Reopen {{name}}’s ballot?" },
          )}
          actions={
            <>
              <Button
                type="button"
                variant="text"
                onClick={closeReopenModal}
                disabled={Boolean(reopeningPreferenceId)}
              >
                {t("cancel", {}, { default: "Cancel" })}
              </Button>
              <Button
                type="button"
                variant="filled"
                onClick={confirmReopenBallot}
                disabled={Boolean(reopeningPreferenceId)}
              >
                {reopeningPreferenceId
                  ? t(
                      "opportunities.matchingRound.studentRanking.reopenBallotWorking",
                      {},
                      { default: "Reopening…" },
                    )
                  : t(
                      "opportunities.matchingRound.studentRanking.reopenBallotConfirmAction",
                      {},
                      { default: "Reopen ballot" },
                    )}
              </Button>
            </>
          }
        >
          <p style={{ margin: 0 }}>
            {t(
              "opportunities.matchingRound.studentRanking.reopenBallotConfirm",
              { name: reopenTarget?.studentName || "" },
              {
                default:
                  "This student will be able to edit and resubmit their preferences.",
              },
            )}
          </p>
        </Modal>

        <Modal
          open={Boolean(editTarget)}
          onClose={closeEditBallotModal}
          size="large"
          maxWidth={1100}
          maxHeight="92vh"
          height="92vh"
          title={t(
            "opportunities.matchingRound.studentRanking.editBallotTitle",
            { name: displayName(editTarget?.student) },
            { default: "Edit {{name}}’s ballot" },
          )}
          bodyStyle={{ display: "flex", flexDirection: "column", minHeight: 0 }}
        >
          {editStaffForStudent && roundId ? (
            <StudentPreferenceSubmission
              roundId={roundId}
              staffForStudent={editStaffForStudent}
              onBack={closeEditBallotModal}
              onSaved={handleEditBallotSaved}
              onStaffRefetch={handleEditBallotStaffRefetch}
            />
          ) : null}
        </Modal>

        <BallotList>
          {sortedRows.length === 0 ? (
            <EmptyNote>
              {t(
                "opportunities.matchingRound.studentRanking.ballotListEmpty",
                {},
                { default: "No students match this search." },
              )}
            </EmptyNote>
          ) : (
            sortedRows.map((row) => (
              <StudentBallotRow
                key={row.student.id}
                row={row}
                studentById={studentById}
                preferenceByStudentId={prefByStudentId}
                classmateListsByStudent={classmateListsByStudent}
                activePickCount={activePickCount}
                assessmentFormDefinition={assessmentFormDefinition}
                handleReopenBallot={handleReopenBallot}
                handleEditBallot={handleEditBallot}
                reopeningPreferenceId={reopeningPreferenceId}
                ballotWindowActive={ballotWindowActive}
                t={t}
              />
            ))
          )}
        </BallotList>
      </RankingCard>
    </Shell>
  );
  },
);

export default MatchingRoundStudentBallotPanel;
