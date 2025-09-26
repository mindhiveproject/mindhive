// New file: components/DataJournal/useDatasourceData.js
import { useQuery } from "@apollo/client";
import { useMemo } from "react";
import useSWR from "swr";

import { STUDY_SUMMARY_RESULTS } from "../../../../Queries/SummaryResult";

// Fetcher for SWR
const fetcher = (url) => fetch(url).then((res) => res.json());

// Exported from a new helpers file or copied from StudyDataWrapper.js/TemplateDataWrapper.js
// Assuming we extract it to a shared helper since it's identical in both wrappers
export function processRawData({
  rawdata,
  components,
  username,
  modifiedData = [],
  modifiedVariables = [],
  modifiedSettings = {},
}) {
  const res = rawdata.map((result) => {
    const userID =
      result?.user?.publicReadableId ||
      result?.user?.publicId ||
      result?.user?.id ||
      "john-doe";

    const guestID =
      result?.guest?.publicReadableId ||
      result?.guest?.publicId ||
      result?.guest?.id ||
      "john-doe";

    const participantId = result?.type === "GUEST" ? guestID : userID;
    const classCode = result?.user?.studentIn?.map((c) => c?.code) || undefined;

    const component = components
      .filter((c) => c?.testId === result?.testVersion)
      .map((c) => ({
        subtitle: c?.subtitle,
        condition: c?.conditionLabel,
      }))[0];
    const subtitle = component?.subtitle;
    const condition = component?.condition;

    return {
      general: {
        participant: participantId, // unique variable
        classCode,
        userType: result?.type,
        condition,
      },
      task: {
        task: result.task.title,
        testVersion: result.testVersion,
        subtitle,
      },
      data: {
        ...result.data,
      },
    };
  });

  const allParticipants = res.map((row) => row?.general?.participant);
  const participants = [...new Set(allParticipants)];

  let variableNames = [];
  let generalKeys = [];

  const dataByParticipant = participants.map((participant) => {
    const data = {};
    const participantData = res.filter(
      (row) => row?.general?.participant === participant
    );

    participantData.map((row) => {
      // generate variables
      generalKeys = Object.keys(row?.general).map((k) => ({
        field: k,
        type: "general",
      }));
      generalKeys.map((key) => {
        data[key.field] = row?.general[key.field];
      });
      const resultKeys = Object.keys(row?.data).map((k) => ({
        field: k,
        task: row?.task?.task,
        testVersion: row?.task?.testVersion,
        subtitle: row?.task?.subtitle,
        type: "task",
      }));
      resultKeys.forEach((key) => {
        let keyExtended = { ...key };
        // if the key is already present, append a subtitle to the name of the key
        if (data[key?.field]) {
          keyExtended.field = key?.field + "_" + key?.subtitle;
        }
        data[keyExtended?.field] = row?.data[key?.field];
        if (
          !variableNames
            .map((variable) => variable?.field)
            .includes(keyExtended?.field)
        ) {
          variableNames.push(keyExtended);
        }
      });
    });

    // append participant data that was modified or added by user
    let modifiedParticipantData = {};
    if (modifiedData?.length) {
      modifiedParticipantData = modifiedData.find(
        (row) => row?.participant === participant
      );
    }

    return {
      participant,
      ...data,
      isMine: participant === username,
      ...modifiedParticipantData,
    };
  });

  variableNames = [...variableNames, ...generalKeys];

  let variables = [];
  if (modifiedVariables?.length) {
    // modified variables and new variables from the study data
    const modifiedStudyVariables = variableNames.map((variable) => {
      if (modifiedVariables.map((v) => v?.field).includes(variable?.field)) {
        const modifiedVariable = modifiedVariables.find(
          (v) => v?.field === variable?.field
        );
        return modifiedVariable;
      } else {
        return {
          field: variable?.field,
          task: variable?.testVersion,
          testId: variable?.testVersion,
          subtitle: variable?.subtitle,
          type: variable?.type,
          editable: false,
        };
      }
    });
    // new variables created by the user
    const customVariables = modifiedVariables.filter(
      (v) =>
        !variableNames.map((variable) => variable?.field).includes(v?.field)
    );

    variables = [...modifiedStudyVariables, ...customVariables];
  } else {
    variables = variableNames.map((variable) => ({
      field: variable?.field,
      task: variable?.testVersion,
      testId: variable?.testVersion,
      subtitle: variable?.subtitle,
      type: variable?.type,
      editable: false,
    }));
  }

  const settings = modifiedSettings || {};

  return { data: dataByParticipant, variables, settings };
}

// The hook
export default function useDatasourceData({ datasource, user }) {
  const username = user?.publicReadableId || user?.publicId || user?.id;
  const {
    dataOrigin,
    study,
    content,
    settings: dsSettings,
    title,
    id,
  } = datasource;

  const prefix = title ? `${title}_` : `${id}_`;

  if (dataOrigin === "STUDY" || dataOrigin === "TEMPLATE") {
    const studyIdToUse = study?.id;
    const {
      data: studyData,
      loading,
      error,
    } = useQuery(STUDY_SUMMARY_RESULTS, {
      variables: { studyId: studyIdToUse },
      skip: !studyIdToUse,
    });

    return useMemo(() => {
      if (loading || error || !studyData) {
        return { data: [], variables: [], settings: {}, loading, error };
      }

      const studyObj = studyData?.study || {};
      const includedDatasets =
        studyObj?.datasets?.filter((d) => d?.isIncluded).map((d) => d?.token) ||
        [];
      const summaryResults =
        studyObj?.summaryResults?.filter((s) =>
          includedDatasets.includes(s?.metadataId)
        ) || [];

      // Find components (copied from wrappers)
      const components = [];
      const findComponents = ({ flow, conditionLabel }) => {
        flow?.forEach((stage) => {
          if (stage?.type === "my-node") {
            components.push({
              testId: stage?.testId,
              name: stage?.name,
              subtitle: stage?.subtitle,
              conditionLabel,
            });
          }
          if (stage?.type === "design") {
            stage?.conditions?.forEach((condition) => {
              findComponents({
                flow: condition?.flow,
                conditionLabel: condition?.label,
              });
            });
          }
        });
      };
      findComponents({ flow: studyObj?.flow });

      // For simplicity, no modified data fetching in initial implementation
      const { data, variables, settings } = processRawData({
        rawdata: summaryResults,
        components,
        username,
        modifiedData: [],
        modifiedVariables: [],
        modifiedSettings: dsSettings || {},
      });

      return { data, variables, settings, loading: false, error: null };
    }, [studyData, loading, error, username, dsSettings]);
  } else if (dataOrigin === "UPLOADED" || dataOrigin === "SIMULATED") {
    const { year, month, day, token } = content?.uploaded?.address || {};

    const type = content?.isModified
      ? "modified"
      : content?.dataOrigin === "SIMULATED"
      ? "simulated"
      : "upload";

    const url = year
      ? `/api/data/${year}/${month}/${day}/${token}?type=${type}`
      : null;

    const { data: fetchedData, error } = useSWR(url, fetcher);

    return useMemo(() => {
      if (!fetchedData || error) {
        return {
          data: [],
          variables: [],
          settings: {},
          loading: !fetchedData && !error,
          error,
        };
      }

      // trim the data, remove the comma at the end only for uploaded data (not modified)
      let trimmedData;
      if (content?.isModified) {
        trimmedData = fetchedData.trim();
        variables = fetchedData?.metadata?.variables;
      } else {
        trimmedData = fetchedData.trim().slice(0, -1);
      }
      const result = JSON.parse(trimmedData || "{}");
      const data = result?.data || [];
      let variables = result?.metadata?.variables || [];
      const settings = result?.metadata?.settings || dsSettings || {};

      return { data, variables, settings, loading: false, error: null };
    }, [fetchedData, error, dsSettings]);
  }

  return { data: [], variables: [], settings: {}, loading: false, error: null };
}
