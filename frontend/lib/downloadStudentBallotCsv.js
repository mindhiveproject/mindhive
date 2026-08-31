import { jsonToCSV } from "react-papaparse";

import { getAssessmentAnswer } from "./connectPreferenceAssessmentData";
import {
  displayName,
  getClassmateMutualStatus,
  studentDisplayName,
  summarizeMutualClassmates,
} from "./connectBallotUtils";
import { slugifyForFilename } from "./opportunityExportMedia";

const ASSESSMENT_COLUMN_PREFIX = "Assessment: ";

function formatCsvCellValue(value) {
  if (value === undefined || value === null || value === "") return "";
  if (Array.isArray(value)) return value.map((v) => formatCsvCellValue(v)).join("; ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function formatClassmatesList(studentId, classmateIds, studentById, classmateListsByStudent) {
  return (classmateIds || [])
    .map((classmateId, index) => {
      const classmate = studentById.get(classmateId);
      const name = studentDisplayName(classmate) || classmateId;
      const status = getClassmateMutualStatus(
        studentId,
        classmateId,
        classmateListsByStudent,
      );
      const statusSuffix =
        status === "mutual"
          ? " (mutual)"
          : status === "one_way"
            ? " (one-way)"
            : "";
      return `#${index + 1} ${name}${statusSuffix}`;
    })
    .join("; ");
}

function formatRankedOpportunitiesList(preference) {
  const items = (preference?.items || [])
    .filter(
      (item) =>
        item.opportunity?.id &&
        item.rank !== "" &&
        item.rank !== null &&
        item.rank !== undefined,
    )
    .sort((a, b) => Number(a.rank) - Number(b.rank));

  return items
    .map((item) => {
      const title = item.opportunity?.title || item.opportunity?.id || "—";
      const stars =
        item.starRating == null || item.starRating === ""
          ? null
          : Number(item.starRating);
      const comment = (item.comment || "").trim();
      const parts = [`#${item.rank} ${title}`];
      if (stars > 0) parts.push(`${stars}★`);
      if (comment) parts.push(comment);
      return parts.join(" | ");
    })
    .join("; ");
}

function collectAssessmentFieldKeys(ballotRows, assessmentFormDefinitionId) {
  const keys = new Set();
  if (!assessmentFormDefinitionId) return [];

  for (const row of ballotRows || []) {
    const answer = getAssessmentAnswer(
      row.preference?.assessmentData,
      assessmentFormDefinitionId,
    );
    Object.keys(answer || {}).forEach((key) => keys.add(key));
  }

  return [...keys].sort((a, b) => a.localeCompare(b));
}

export function buildBallotCsvFilename(roundTitle, date = new Date()) {
  const round = slugifyForFilename(roundTitle) || "round";
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `ballots-${round}-${yyyy}-${mm}-${dd}-${hh}${min}${ss}.csv`;
}

export function buildStudentBallotCsvRows({
  ballotRows = [],
  studentById,
  classmateListsByStudent,
  assessmentFormDefinitionId,
  labels = {},
}) {
  const {
    studentName = "Student",
    username = "Username",
    status = "Status",
    queue = "Queue",
    mutualClassmates = "Mutual classmates",
    oneWayClassmates = "One-way classmates",
    receivedClassmates = "Received classmates",
    preferredClassmates = "Preferred classmates",
    rankedOpportunities = "Ranked opportunities",
    additionalNotes = "Additional notes",
    matchedOpportunity = "Matched opportunity",
    submittedAt = "Submitted at",
    queueProjectFirst = "Project-first",
    queueTeamFirst = "Team-first",
    statusNotStarted = "Not started",
    statusDraft = "Draft",
    statusSubmitted = "Submitted",
    statusMatched = "Matched",
  } = labels;

  const statusLabels = {
    not_started: statusNotStarted,
    draft: statusDraft,
    submitted: statusSubmitted,
    matched: statusMatched,
  };

  const queueLabels = {
    project_first: queueProjectFirst,
    team_first: queueTeamFirst,
  };

  const assessmentFieldKeys = collectAssessmentFieldKeys(
    ballotRows,
    assessmentFormDefinitionId,
  );

  const fields = [
    studentName,
    username,
    status,
    queue,
    mutualClassmates,
    oneWayClassmates,
    receivedClassmates,
    preferredClassmates,
    rankedOpportunities,
    additionalNotes,
    matchedOpportunity,
    submittedAt,
    ...assessmentFieldKeys.map((key) => `${ASSESSMENT_COLUMN_PREFIX}${key}`),
  ];

  const data = (ballotRows || []).map((row) => {
    const studentId = row.student?.id;
    const classmateIds = classmateListsByStudent.get(studentId) || [];
    const mutualSummary = summarizeMutualClassmates(
      studentId,
      classmateIds,
      classmateListsByStudent,
    );
    const assessmentAnswer = getAssessmentAnswer(
      row.preference?.assessmentData,
      assessmentFormDefinitionId,
    );

    const out = {
      [studentName]: displayName(row.student),
      [username]: row.student?.username || "",
      [status]: statusLabels[row.submissionStatus] || row.submissionStatus || "",
      [queue]: queueLabels[row.queue] || row.queue || "",
      [mutualClassmates]: String(mutualSummary.mutual),
      [oneWayClassmates]: String(mutualSummary.oneWay),
      [receivedClassmates]: String(mutualSummary.received),
      [preferredClassmates]: formatClassmatesList(
        studentId,
        classmateIds,
        studentById,
        classmateListsByStudent,
      ),
      [rankedOpportunities]: formatRankedOpportunitiesList(row.preference),
      [additionalNotes]: (row.preference?.notes || "").trim(),
      [matchedOpportunity]: row.match?.opportunity?.title || "",
      [submittedAt]: row.preference?.submittedAt
        ? new Date(row.preference.submittedAt).toLocaleString()
        : "",
    };

    for (const key of assessmentFieldKeys) {
      out[`${ASSESSMENT_COLUMN_PREFIX}${key}`] = formatCsvCellValue(
        assessmentAnswer?.[key],
      );
    }

    return out;
  });

  return { fields, data };
}

export function downloadStudentBallotCsv(options) {
  const { roundTitle = "", ...rowOptions } = options || {};
  const { fields, data } = buildStudentBallotCsvRows(rowOptions);
  const csv = jsonToCSV({ fields, data });
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = buildBallotCsvFilename(roundTitle);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
