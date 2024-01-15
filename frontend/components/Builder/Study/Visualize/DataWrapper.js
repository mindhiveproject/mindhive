import { useQuery } from "@apollo/client";

import { STUDY_SUMMARY_RESULTS } from "../../../Queries/SummaryResult";

import Visualize from "./Main";

export default function DataWrapper({ query, user, tab, toggleSidebar }) {
  const studyId = query?.selector;

  // get the summary data of a specific study
  const { data, loading, error } = useQuery(STUDY_SUMMARY_RESULTS, {
    variables: { studyId },
  });
  const study = data?.study || {};
  const results = study?.summaryResults || [];

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
  console.log({ components });

  // process results
  const process = ({ data }) => {
    const dataByTask = data.map((result) => {
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

      const participantId = result?.guest ? guestID : userID;
      const classCode =
        result?.user?.studentIn?.map((c) => c?.code) || undefined;
      const userType = result?.guest ? "guest" : "user";

      return {
        participant: participantId,
        classCode,
        userType,
        study: result.study.title,
        task: result.task?.title,
        testVersion: result.testVersion,
        timestamp: result.createdAt,
        ...result.data,
      };
    });

    if (true) {
      const allParticipants = dataByTask.map((row) => row?.participant);
      const participants = [...new Set(allParticipants)];
      const dataByParticipant = participants.map((participant) => {
        const data = {};
        const participantData = dataByTask.filter(
          (row) => row?.participant === participant
        );
        // participantData.map((row) => {
        //   Object.keys(row).map((key) => {
        //     const newKey = `${row?.task?.replace(/\s/g, "_")}_${
        //       row?.testVersion
        //     }_${key}`;
        //     data[newKey] = row[key];
        //   });
        // });
        return {
          participant,
          data: participantData,
        };
      });
      return dataByParticipant;
    }
  };

  const processed = process({ data: results });
  // console.log({ results });

  const processByTask = ({ data }) => {
    console.log({ data });
    // filter out unique tasks
    const allTasks = data.map((row) => row?.testVersion);
    const tasks = [...new Set(allTasks)];
    // populate the array of data with tasks
    const dataByTask = tasks.map((taskId) => {
      const taskData = data.filter((row) => row?.testVersion === taskId);
      // get the title
      const title = taskData[0]?.task?.title;
      // get the subtitle and condition
      const component = components
        .filter((c) => c?.testId === taskId)
        .map((c) => ({
          subtitle: c?.subtitle,
          condition: c?.conditionLabel,
        }))[0];
      const subtitle = component?.subtitle;
      const condition = component?.condition;
      // get the names of all variables
      const allVariables = taskData.map((row) => Object.keys(row?.data)).flat();
      const variables = [...new Set(allVariables)];
      return {
        id: taskId,
        title: title,
        subtitle: subtitle,
        condition: condition,
        variables: variables,
        data: taskData,
      };
    });
    return dataByTask;
  };
  const processedByTask = processByTask({ data: results });
  console.log({ processedByTask });

  return (
    <Visualize
      query={query}
      user={user}
      tab={tab}
      toggleSidebar={toggleSidebar}
      data={processedByTask}
      results={results}
    />
  );
}
