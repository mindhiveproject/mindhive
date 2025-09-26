import { useQuery } from "@apollo/client";
import { useMemo } from "react";
import useSWR from "swr";

import { STUDY_SUMMARY_RESULTS } from "../../../Queries/SummaryResult";

import PartManager from "./PartManager";

// A fetcher function to wrap the native fetch function and return the result of a call to url in json format
const fetcher = (url) => fetch(url).then((res) => res.json());

// pre-process and aggregate data
const processTemplateRawData = ({
  rawdata,
  components,
  username,
  modifiedData,
  modifiedVariables,
  modifiedSettings,
}) => {
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
};

export default function TemplateDataWrapper({
  user,
  studyId,
  pyodide,
  journal,
  part,
  setPart,
  templateStudyId,
}) {
  // get the username of the current user
  const username = user?.publicReadableId || user?.publicId || user?.id;

  const studyIdResults =
    part?.dataOrigin === "TEMPLATE" ? templateStudyId : studyId;
  // get the summary results of the study
  const {
    data: studyData,
    loading,
    error,
  } = useQuery(STUDY_SUMMARY_RESULTS, {
    variables: { studyId: studyIdResults },
  });

  const study = studyData?.study || {};
  // filter only summary results that are selected by the user to be included in the data analysis
  const includedDatasets =
    studyData?.study?.datasets
      ?.filter((d) => d?.isIncluded)
      .map((d) => d?.token) || [];
  const summaryResults =
    study?.summaryResults?.filter((s) =>
      includedDatasets?.includes(s?.metadataId)
    ) || [];

  // get the saved modified data
  let modifiedData = [];
  let modifiedVariables = [];
  let modifiedSettings = {};
  if (part?.content?.isModified) {
    const { year, month, day, token } = part?.content?.modified?.address;
    const { data: dataModified, error: modifiedError } = useSWR(
      `/api/data/${year}/${month}/${day}/${token}?type=modified`,
      fetcher
    );
    if (dataModified) {
      const parsedData = JSON.parse(dataModified);
      modifiedData = parsedData.data;
      modifiedVariables = parsedData?.metadata?.variables;
      modifiedSettings = parsedData?.metadata?.settings || {};
    }
  }

  // find all tests in the study with recursive search
  var components = [];
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
  findComponents({ flow: study?.flow });

  // pre-process the data in the participant-by-row format
  const { data, variables, settings } = useMemo(
    () =>
      processTemplateRawData({
        rawdata: summaryResults,
        components,
        username,
        modifiedData,
        modifiedVariables,
        modifiedSettings,
      }),
    [
      summaryResults,
      components,
      modifiedData,
      modifiedVariables,
      modifiedSettings,
    ]
  );

  return (
    <PartManager
      user={user}
      projectId={projectId}
      studyId={studyId}
      pyodide={pyodide}
      journal={journal}
      part={part}
      setPart={setPart}
      initData={data}
      initVariables={variables}
      initSettings={settings}
      components={components}
    />
  );
}
