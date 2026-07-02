import { saveAs } from "file-saver";

import { getPrimaryTemplateBoardId } from "../../../lib/classTemplateBoards";
import { GRAPHQL_ENDPOINT, convertToCSV } from "./exportUtils";

const NETWORKS_QUERY = `
  query ResearchClassNetworks {
    classNetworks(orderBy: { title: asc }) {
      id
      title
    }
  }
`;

const CLASS_OPTIONS_QUERY = `
  query ResearchClassOptions {
    classes(orderBy: { title: asc }) {
      id
      code
      title
    }
  }
`;

const METRICS_QUERY = `
  query ResearchPlatformMetrics($where: ClassWhereInput!) {
    classes(where: $where, orderBy: { createdAt: desc }) {
      id
      code
      title
      createdAt
      networks {
        title
      }
      students {
        id
      }
      mentors {
        id
      }
      assignments {
        id
      }
      resources {
        id
      }
      templateProposal {
        id
      }
      classTemplateBoards {
        id
      }
      studies {
        id
        status
        dataCollectionStatus
        participants {
          id
        }
        vizJournals {
          id
        }
      }
      studentProposals {
        id
        isMain
        submitProposalStatus
        peerFeedbackStatus
        projectReportStatus
        vizJournals {
          id
        }
      }
    }
  }
`;

const STUDY_STATUS_VALUES = [
  "WORKING",
  "SUBMITTED_AS_PROPOSAL",
  "READY_FOR_REVIEW",
  "IN_REVIEW",
  "REVIEWED",
  "COLLECTING_DATA",
  "DATA_COLLECTION_IS_COMPLETED",
];

const STAGE_STATUS_VALUES = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "SUBMITTED",
  "FINISHED",
];

const METRICS_TEXT_COLUMNS = [
  "classCode",
  "classTitle",
  "networks",
  "createdAt",
];

const METRICS_NUMERIC_COLUMNS = [
  "students",
  "mentors",
  "assignments",
  "resources",
  "hasTemplateBoard",
  "dataJournals",
  "studies_total",
  "studies_participants_total",
  ...STUDY_STATUS_VALUES.map((status) => `studies_status_${status}`),
  ...STAGE_STATUS_VALUES.map(
    (status) => `studies_dataCollection_${status}`
  ),
  "boards_total",
  "boards_isMain",
  ...STAGE_STATUS_VALUES.map((status) => `boards_proposal_${status}`),
  ...STAGE_STATUS_VALUES.map((status) => `boards_peerFeedback_${status}`),
  ...STAGE_STATUS_VALUES.map((status) => `boards_projectReport_${status}`),
];

const METRICS_COLUMN_KEYS = [...METRICS_TEXT_COLUMNS, ...METRICS_NUMERIC_COLUMNS];

const countBy = (items, keyFn) => {
  return (items || []).reduce((acc, item) => {
    const key = keyFn(item);
    if (!key) return acc;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
};

const initStatusCounts = (prefix, values) => {
  return values.reduce((acc, value) => {
    acc[`${prefix}_${value}`] = 0;
    return acc;
  }, {});
};

const graphqlFetch = async (query, variables = {}) => {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    mode: "cors",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "x-apollo-operation-name": "RESEARCH_METRICS",
      "apollo-require-preflight": "true",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const payload = await response.json();
  if (payload?.errors?.length) {
    throw new Error(payload.errors[0]?.message || "GraphQL request failed");
  }

  return payload?.data;
};

const buildMetricsWhere = ({
  networkId,
  classId,
  dateFrom,
  dateTo,
  allClasses,
}) => {
  const conditions = [];

  if (classId) {
    conditions.push({
      id: { equals: classId },
    });
  }

  if (!allClasses && networkId) {
    conditions.push({
      networks: { some: { id: { equals: networkId } } },
    });
  }

  if (dateFrom) {
    conditions.push({ createdAt: { gte: dateFrom } });
  }

  if (dateTo) {
    conditions.push({ createdAt: { lte: dateTo } });
  }

  if (conditions.length === 0) return {};
  if (conditions.length === 1) return conditions[0];
  return { AND: conditions };
};

const computeClassMetrics = (classData) => {
  const studies = classData?.studies || [];
  const boards = classData?.studentProposals || [];
  const journalIds = new Set();

  studies.forEach((study) => {
    (study?.vizJournals || []).forEach((journal) => {
      if (journal?.id) journalIds.add(journal.id);
    });
  });

  boards.forEach((board) => {
    (board?.vizJournals || []).forEach((journal) => {
      if (journal?.id) journalIds.add(journal.id);
    });
  });

  const studyStatusCounts = countBy(studies, (study) => study?.status);
  const studyDataCollectionCounts = countBy(
    studies,
    (study) => study?.dataCollectionStatus
  );
  const proposalStatusCounts = countBy(
    boards,
    (board) => board?.submitProposalStatus
  );
  const peerFeedbackCounts = countBy(
    boards,
    (board) => board?.peerFeedbackStatus
  );
  const projectReportCounts = countBy(
    boards,
    (board) => board?.projectReportStatus
  );

  const row = {
    classCode: classData?.code || "",
    classTitle: classData?.title || "",
    networks: (classData?.networks || [])
      .map((network) => network?.title)
      .filter(Boolean)
      .join("; "),
    createdAt: classData?.createdAt || "",
    students: classData?.students?.length || 0,
    mentors: classData?.mentors?.length || 0,
    assignments: classData?.assignments?.length || 0,
    resources: classData?.resources?.length || 0,
    hasTemplateBoard: getPrimaryTemplateBoardId(classData) ? 1 : 0,
    dataJournals: journalIds.size,
    studies_total: studies.length,
    studies_participants_total: studies.reduce(
      (sum, study) => sum + (study?.participants?.length || 0),
      0
    ),
    ...initStatusCounts("studies_status", STUDY_STATUS_VALUES),
    ...initStatusCounts("studies_dataCollection", STAGE_STATUS_VALUES),
    boards_total: boards.length,
    boards_isMain: boards.filter((board) => board?.isMain).length,
    ...initStatusCounts("boards_proposal", STAGE_STATUS_VALUES),
    ...initStatusCounts("boards_peerFeedback", STAGE_STATUS_VALUES),
    ...initStatusCounts("boards_projectReport", STAGE_STATUS_VALUES),
  };

  STUDY_STATUS_VALUES.forEach((status) => {
    row[`studies_status_${status}`] = studyStatusCounts[status] || 0;
  });

  STAGE_STATUS_VALUES.forEach((status) => {
    row[`studies_dataCollection_${status}`] =
      studyDataCollectionCounts[status] || 0;
    row[`boards_proposal_${status}`] = proposalStatusCounts[status] || 0;
    row[`boards_peerFeedback_${status}`] = peerFeedbackCounts[status] || 0;
    row[`boards_projectReport_${status}`] = projectReportCounts[status] || 0;
  });

  return row;
};

const buildMetricsRows = (classes = []) => {
  return (classes || []).map((classData) => computeClassMetrics(classData));
};

const summarizeMetricsRows = (rows = []) => {
  const totals = {
    classCode: "",
    classTitle: "TOTAL",
    networks: "",
    createdAt: "",
  };

  METRICS_NUMERIC_COLUMNS.forEach((key) => {
    totals[key] = rows.reduce((sum, row) => sum + (Number(row?.[key]) || 0), 0);
  });

  return totals;
};

const filterRowsBySearch = (rows = [], search = "") => {
  const query = search.trim().toLowerCase();
  if (!query) return rows;

  return rows.filter((row) => {
    const code = (row?.classCode || "").toLowerCase();
    const title = (row?.classTitle || "").toLowerCase();
    return code.includes(query) || title.includes(query);
  });
};

const fetchClassNetworks = async () => {
  const data = await graphqlFetch(NETWORKS_QUERY);
  return data?.classNetworks || [];
};

const fetchClassOptions = async () => {
  const data = await graphqlFetch(CLASS_OPTIONS_QUERY);
  return data?.classes || [];
};

const fetchClassMetrics = async ({
  networkId,
  classId,
  dateFrom,
  dateTo,
  allClasses = false,
}) => {
  const where = buildMetricsWhere({
    networkId,
    classId,
    dateFrom,
    dateTo,
    allClasses,
  });
  const data = await graphqlFetch(METRICS_QUERY, { where });
  return data?.classes || [];
};

const exportMetricsCSV = (rows = [], filename = "platform_metrics.csv") => {
  if (!rows.length) return false;
  const csv = convertToCSV(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  saveAs(blob, filename);
  return true;
};

const getMetricsColumnKeys = () => METRICS_COLUMN_KEYS;

const getMetricsNumericColumnKeys = () => METRICS_NUMERIC_COLUMNS;

export {
  METRICS_COLUMN_KEYS,
  METRICS_NUMERIC_COLUMNS,
  METRICS_TEXT_COLUMNS,
  STUDY_STATUS_VALUES,
  STAGE_STATUS_VALUES,
  buildMetricsRows,
  buildMetricsWhere,
  computeClassMetrics,
  exportMetricsCSV,
  fetchClassOptions,
  fetchClassMetrics,
  fetchClassNetworks,
  filterRowsBySearch,
  getMetricsColumnKeys,
  getMetricsNumericColumnKeys,
  summarizeMetricsRows,
};
