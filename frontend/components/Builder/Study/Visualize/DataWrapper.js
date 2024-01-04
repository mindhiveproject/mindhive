import { useQuery } from "@apollo/client";

import { STUDY_SUMMARY_RESULTS } from "../../../Queries/SummaryResult";

import Visualize from "./Main";

export default function DataWrapper({ query, user, tab, toggleSidebar }) {
  const studyId = query?.selector;

  // get the summary data of a specific study
  const { data, loading, error } = useQuery(STUDY_SUMMARY_RESULTS, {
    variables: { studyId },
  });
  const results = data?.summaryResults || [];

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

  const processByTask = ({ data }) => {
    // filter out unique tasks
    const allTasks = data.map((row) => row?.task?.id);
    const tasks = [...new Set(allTasks)];
    // populate the array of data with tasks
    const dataByTask = tasks.map((taskId) => {
      const taskData = data.filter((row) => row?.task?.id === taskId);
      // get the title
      const title = taskData[0]?.task?.title;
      // get the names of all variables
      const allVariables = taskData.map((row) => Object.keys(row?.data)).flat();
      const variables = [...new Set(allVariables)];
      return {
        id: taskId,
        title: title,
        variables: variables,
        data: taskData,
      };
    });
    return dataByTask;
  };
  const processedByTask = processByTask({ data: results });

  return (
    <Visualize
      query={query}
      user={user}
      tab={tab}
      toggleSidebar={toggleSidebar}
      data={processedByTask}
    />
  );
}
