import { useState } from "react";
import { Icon } from "semantic-ui-react";

import { saveAs } from "file-saver";
import csvWithPlainNumbers from "../../../../../lib/csvWithPlainNumbers";
import useTranslation from "next-translate/useTranslation";

import buildAggregateColumns from "../../../../../lib/yqParticipantAggregates";

export default function DownloadRawData({
  slug,
  fileDirs,
  components,
  datasets,
  dataSourceRecords,
}) {
  const { t } = useTranslation("builder");
  const [loading, setLoading] = useState(false);

  // the physiological aggregates collected while the participant was on each
  // task, flattened into one column per device channel and statistic
  const aggregateColumns = buildAggregateColumns({
    records: dataSourceRecords || [],
    components,
  });

  const download = async () => {
    setLoading(true);

    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileDirs }),
    };

    const response = await fetch(`/api/download/rawfiles`, requestOptions);
    const data = await response.json();

    const rows = data
      .filter((result) => result?.data)
      .map((result) =>
        result?.data.map((line) => ({
          ...line,
          url: JSON.stringify(line?.url),
          meta: JSON.stringify(line?.meta),
          ...result?.metadata,
          subtitle: components
            .filter((c) => c?.testId === result?.metadata?.testVersion)
            .map((c) => c?.subtitle),
          condition: components
            .filter((c) => c?.testId === result?.metadata?.testVersion)
            .map((c) => c?.conditionLabel),
          dataPolicy: datasets
            .filter((d) => d?.token === result?.metadata?.id)
            .map((d) => d?.dataPolicy),
          // constant across every row of the task — the aggregate covers the
          // whole step, not one trial
          ...aggregateColumns({
            publicId: result?.metadata?.publicId,
            testVersion: result?.metadata?.testVersion,
          }),
        }))
      )
      .reduce((a, b) => a.concat(b), []);

    const allKeys = rows
      .map((line) => Object.keys(line))
      .reduce((a, b) => a.concat(b), []);
    const keys = Array.from(new Set(allKeys));
    const csv = csvWithPlainNumbers({ fields: keys, data: rows });
    const blob = new Blob([csv], {
      type: "text/csv",
    });
    saveAs(blob, `${slug}.csv`);

    setLoading(false);
  };

  return (
    <>
      {loading ? (
        <div>{t("byComponent.wait", "Wait ...")}</div>
      ) : (
        <div className="downloadArea" onClick={() => download()}>
          <Icon color="teal" size="large" name="download" />
          <a>{t("byComponent.downloadRaw", "Download raw data")}</a>
        </div>
      )}
    </>
  );
}
