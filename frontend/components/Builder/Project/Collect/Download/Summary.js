import { useState } from "react";
import { saveAs } from "file-saver";
import csvWithPlainNumbers from "../../../../../lib/csvWithPlainNumbers";
import moment from "moment";
import { Icon } from "semantic-ui-react";
import useTranslation from "next-translate/useTranslation";

import buildAggregateColumns from "../../../../../lib/yqParticipantAggregates";

export default function DownloadSummaryData({
  by,
  study,
  participantsInStudy,
  components,
  datasets,
  filteredDatasetTokens,
}) {
  const { t } = useTranslation("builder");
  const [loading, setLoading] = useState(false);

  // the physiological aggregates collected while the participant was on each
  // task, flattened into one column per device channel and statistic
  const aggregateColumns = buildAggregateColumns({
    records: study?.dataSourceRecords || [],
    components,
  });

  // pre-process and aggregate data on the subject level
  const process = ({ data }) => {
    // the data source columns only exist for participants who ran with a
    // device, so they are tracked to be placed after the task's own columns
    // instead of wherever the first participant that had them happens to be
    const aggregateKeys = new Set();
    // rows whose task data is all empty, like the duplicate result the old
    // engine saved next to the real one
    const emptyRows = new Set();

    const allRows = data
      .filter((result) => filteredDatasetTokens?.includes(result?.metadataId))
      .map((result) => {
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

        // record the between-subjects condition of the participant
        const personalID =
          (result?.guest ? result?.guest?.publicId : result?.user?.publicId) ||
          "";
        const [participant] = participantsInStudy.filter(
          (participant) => participant?.publicId === personalID
        );
        const [dataPolicy] = datasets
          .filter((d) => d?.token === result?.metadataId)
          .map((d) => d?.dataPolicy);

        const row = {
          participant: participantId,
          classCode,
          userType,
          study: result.study.title,
          task: result.task?.title,
          testVersion: result.testVersion,
          subtitle: components
            ?.filter((c) => c?.testId === result.testVersion)
            .map((c) => c?.subtitle),
          timestamp: result.createdAt,
          condition: participant?.condition,
          dataPolicy,
        };

        // a task field or data source column whose name is already taken in
        // the row (e.g. a task that saves its own "condition") is kept under a
        // numbered name instead of silently replacing the other value
        const put = (key, value) => {
          let name = key;
          for (let n = 2; name in row; n++) name = `${key}_${n}`;
          row[name] = value;
          return name;
        };
        Object.entries(result.data || {}).forEach(([key, value]) =>
          put(key, value)
        );
        Object.entries(
          aggregateColumns({
            publicId: personalID,
            testVersion: result.testVersion,
          })
        ).forEach(([key, value]) => aggregateKeys.add(put(key, value)));

        const hasData = Object.values(result.data || {}).some(
          (value) => value !== null && value !== undefined && value !== ""
        );
        if (!hasData) emptyRows.add(row);
        return row;
      });

    // an empty result is only dropped when the same participant has a real
    // result for the same task; an empty result on its own is kept
    const taskOf = (row) => `${row?.participant}::${row?.testVersion}`;
    const filledTasks = new Set(
      allRows.filter((row) => !emptyRows.has(row)).map(taskOf)
    );
    const dataByTask = allRows.filter(
      (row) => !emptyRows.has(row) || !filledTasks.has(taskOf(row))
    );

    // union of the keys in first-seen order, the task's own columns first and
    // the data source columns after them
    const orderKeys = (rows) => {
      const keys = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
      return [
        ...keys.filter((key) => !aggregateKeys.has(key)),
        ...keys.filter((key) => aggregateKeys.has(key)),
      ];
    };

    if (by === "by participant") {
      // a participant who has more than one result for the same task (a
      // retake) gets a second block of columns for it instead of the second
      // result replacing the first
      const attemptOf = new Map();
      const attempts = {};
      dataByTask.forEach((row) => {
        attempts[taskOf(row)] = (attempts[taskOf(row)] || 0) + 1;
        attemptOf.set(row, attempts[taskOf(row)]);
      });
      // named after the task's first result so every participant's values
      // for the same testVersion land under the same header
      const titles = {};
      dataByTask.forEach((row) => {
        titles[row?.testVersion] ??= row?.task?.replace(/\s/g, "_");
      });
      const prefixOf = (testVersion, attempt) =>
        `${titles[testVersion]}_${testVersion}_${
          attempt > 1 ? `${attempt}_` : ""
        }`;

      // the same for every task a participant did, so they are written once
      // at the front instead of being repeated inside every task's block
      const participantKeys = [
        "participant",
        "classCode",
        "userType",
        "study",
        "condition",
      ];

      const allParticipants = dataByTask.map((row) => row?.participant);
      const participants = [...new Set(allParticipants)];
      const dataByParticipant = participants.map((participant) => {
        const participantRows = dataByTask.filter(
          (row) => row?.participant === participant
        );
        const data = Object.fromEntries(
          participantKeys.map((key) => [key, participantRows[0]?.[key]])
        );
        participantRows.forEach((row) => {
          const prefix = prefixOf(row?.testVersion, attemptOf.get(row));
          Object.keys(row)
            .filter((key) => !participantKeys.includes(key))
            .forEach((key) => {
              data[`${prefix}${key}`] = row[key];
            });
        });
        return data;
      });

      // one block of columns per task, in the order of the study flow, so the
      // layout doesn't depend on which participant is listed first
      const flowOrder = components?.map((c) => c?.testId) || [];
      const position = (testVersion) => {
        const index = flowOrder.indexOf(testVersion);
        return index === -1 ? flowOrder.length : index;
      };
      const testVersions = [
        ...new Set(dataByTask.map((row) => row?.testVersion)),
      ].sort((a, b) => position(a) - position(b));
      const fields = [
        ...participantKeys,
        ...testVersions.flatMap((testVersion) => {
          const rows = dataByTask.filter(
            (row) => row?.testVersion === testVersion
          );
          const maxAttempt = Math.max(...rows.map((row) => attemptOf.get(row)));
          return Array.from({ length: maxAttempt }, (_, i) => i + 1).flatMap(
            (attempt) => {
              const prefix = prefixOf(testVersion, attempt);
              return orderKeys(
                rows.filter((row) => attemptOf.get(row) === attempt)
              )
                .filter((key) => !participantKeys.includes(key))
                .map((key) => `${prefix}${key}`);
            }
          );
        }),
      ];
      return { rows: dataByParticipant, fields: [...new Set(fields)] };
    }
    return { rows: dataByTask, fields: orderKeys(dataByTask) };
  };

  // download the current state of the data as a csv file
  const save = ({ rows, fields }) => {
    const name = `${study?.slug}_${by}_${moment().format()}`;
    const csv = csvWithPlainNumbers({ fields, data: rows });
    const blob = new Blob([csv], {
      type: "text/csv",
    });
    saveAs(blob, `${name}.csv`);
  };

  const download = async () => {
    setLoading(true);
    const { summaryResults } = study;
    save(process({ data: summaryResults }));
    setLoading(false);
  };

  return (
    <>
      {loading ? (
        <div>{t("byComponent.wait", "Wait ...")}</div>
      ) : (
        <div className="downloadArea" onClick={() => download()}>
          <Icon color="teal" size="large" name="download" />
          <a>{t("byComponent.downloadAggregatedBy", { by })}</a>
        </div>
      )}
    </>
  );
}
