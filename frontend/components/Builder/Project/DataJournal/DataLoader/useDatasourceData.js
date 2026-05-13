// New file: components/DataJournal/useDatasourceData.js
import { useQuery } from "@apollo/client";
import { useMemo } from "react";
import useSWR from "swr";

import { STUDY_SUMMARY_RESULTS } from "../../../../Queries/SummaryResult";

const fetcher = (url) => fetch(url).then((res) => res.json());

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
        participant: participantId,
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

function parseFilePayload(raw, { isModifiedSlice }) {
  if (raw == null || typeof raw !== "string") return null;
  const trimmed = isModifiedSlice ? raw.trim() : raw.trim().slice(0, -1);
  try {
    return JSON.parse(trimmed || "{}");
  } catch {
    return null;
  }
}

export default function useDatasourceData({ datasource, user }) {
  const username = user?.publicReadableId || user?.publicId || user?.id;
  const { dataOrigin, study, content, settings: dsSettings, title, id } =
    datasource || {};

  const isStudyLike = dataOrigin === "STUDY" || dataOrigin === "TEMPLATE";
  const studyIdToUse = isStudyLike ? study?.id : null;

  const {
    data: studyData,
    loading: studyLoading,
    error: studyError,
  } = useQuery(STUDY_SUMMARY_RESULTS, {
    variables: { studyId: studyIdToUse },
    skip: !studyIdToUse,
  });

  const modAddr =
    isStudyLike && content?.isModified ? content?.modified?.address : null;
  const modifiedStudyUrl =
    modAddr?.year != null &&
    modAddr?.month != null &&
    modAddr?.day != null &&
    modAddr?.token
      ? `/api/data/${modAddr.year}/${modAddr.month}/${modAddr.day}/${modAddr.token}?type=modified`
      : null;

  const { data: modifiedStudyFileRaw, error: modifiedStudyFileErr } = useSWR(
    modifiedStudyUrl,
    fetcher
  );

  const isUploadLike = dataOrigin === "UPLOADED" || dataOrigin === "SIMULATED";
  const uploadedAddr = isUploadLike ? content?.uploaded?.address : null;
  const uploadType = content?.isModified
    ? "modified"
    : content?.dataOrigin === "SIMULATED"
      ? "simulated"
      : "upload";
  const uploadedUrl =
    uploadedAddr?.year != null &&
    uploadedAddr?.month != null &&
    uploadedAddr?.day != null &&
    uploadedAddr?.token
      ? `/api/data/${uploadedAddr.year}/${uploadedAddr.month}/${uploadedAddr.day}/${uploadedAddr.token}?type=${uploadType}`
      : null;

  const { data: uploadedFileRaw, error: uploadedFileErr } = useSWR(
    uploadedUrl,
    fetcher
  );

  return useMemo(() => {
    if (isStudyLike) {
      if (studyLoading || studyError || !studyData) {
        return {
          data: [],
          variables: [],
          settings: {},
          loading: studyLoading,
          error: studyError,
        };
      }

      if (modifiedStudyUrl) {
        if (modifiedStudyFileErr) {
          return {
            data: [],
            variables: [],
            settings: {},
            loading: false,
            error: modifiedStudyFileErr,
          };
        }
        if (modifiedStudyFileRaw == null) {
          return {
            data: [],
            variables: [],
            settings: {},
            loading: true,
            error: null,
          };
        }
      }

      const studyObj = studyData?.study || {};
      const includedDatasets =
        studyObj?.datasets?.filter((d) => d?.isIncluded).map((d) => d?.token) ||
        [];
      const summaryResults =
        studyObj?.summaryResults?.filter((s) =>
          includedDatasets.includes(s?.metadataId)
        ) || [];

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

      let modifiedData = [];
      let modifiedVariables = [];
      let modifiedSettings = dsSettings || {};

      if (modifiedStudyUrl && typeof modifiedStudyFileRaw === "string") {
        const parsed = parseFilePayload(modifiedStudyFileRaw, {
          isModifiedSlice: true,
        });
        if (parsed) {
          modifiedData = parsed?.data || [];
          modifiedVariables = parsed?.metadata?.variables || [];
          modifiedSettings =
            parsed?.metadata?.settings || dsSettings || {};
        }
      }

      const { data, variables, settings } = processRawData({
        rawdata: summaryResults,
        components,
        username,
        modifiedData,
        modifiedVariables,
        modifiedSettings,
      });

      return { data, variables, settings, loading: false, error: null };
    }

    if (isUploadLike) {
      if (!uploadedUrl) {
        return { data: [], variables: [], settings: {}, loading: false, error: null };
      }
      if (uploadedFileErr) {
        return {
          data: [],
          variables: [],
          settings: {},
          loading: false,
          error: uploadedFileErr,
        };
      }
      if (uploadedFileRaw == null) {
        return {
          data: [],
          variables: [],
          settings: {},
          loading: true,
          error: null,
        };
      }
      if (typeof uploadedFileRaw !== "string") {
        return {
          data: [],
          variables: [],
          settings: {},
          loading: false,
          error: new Error("Invalid data file"),
        };
      }

      const isModified = Boolean(content?.isModified);
      const trimmedData = isModified
        ? uploadedFileRaw.trim()
        : uploadedFileRaw.trim().slice(0, -1);
      let result;
      try {
        result = JSON.parse(trimmedData || "{}");
      } catch (e) {
        return {
          data: [],
          variables: [],
          settings: {},
          loading: false,
          error: e,
        };
      }
      const data = result?.data || [];
      const variables = result?.metadata?.variables || [];
      const settings = result?.metadata?.settings || dsSettings || {};

      return { data, variables, settings, loading: false, error: null };
    }

    return { data: [], variables: [], settings: {}, loading: false, error: null };
  }, [
    isStudyLike,
    isUploadLike,
    studyData,
    studyLoading,
    studyError,
    username,
    dsSettings,
    modifiedStudyUrl,
    modifiedStudyFileRaw,
    modifiedStudyFileErr,
    content,
    uploadedUrl,
    uploadedFileRaw,
    uploadedFileErr,
  ]);
}
