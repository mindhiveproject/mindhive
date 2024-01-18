import { useQuery } from "@apollo/client";
import { useMemo } from "react";

import { STUDY_SUMMARY_RESULTS } from "../../../Queries/SummaryResult";
import DataManager from "./DataManager";

// helper function to get all column names of the given dataset
const getColumnNames = ({ data }) => {
  const allKeys = data
    .map((line) => Object.keys(line))
    .reduce((a, b) => a.concat(b), []);
  const keys = Array.from(new Set(allKeys)).sort();
  return keys;
};

// pre-process and aggregate data
const processRawData = ({ rawdata, components }) => {
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
      participant: participantId,
      classCode,
      userType: result?.type,
      study: result.study.title,
      task: result.task.title,
      testVersion: result.testVersion,
      timestamp: result.createdAt,
      subtitle,
      condition,
      ...result.data,
    };
  });

  const variables = getColumnNames({ data: res });
  return { data: res, variables };
};

export default function Preprocessor({ user, studyId }) {
  // get the summary results of the study
  const {
    data: studyData,
    loading,
    error,
  } = useQuery(STUDY_SUMMARY_RESULTS, {
    variables: { studyId },
  });

  const study = studyData?.study || {};
  const summaryResults = study?.summaryResults || [];

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

  // pre-process the data
  const { data, variables } = useMemo(
    () => processRawData({ rawdata: summaryResults, components: components }),
    [summaryResults, components]
  );

  if (data && data.length) {
    return (
      <DataManager
        user={user}
        studyId={studyId}
        studyData={data}
        studyVariables={variables}
      />
    );
  }
}
