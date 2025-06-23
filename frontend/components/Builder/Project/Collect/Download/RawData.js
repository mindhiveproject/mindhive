import { useState } from "react";
import { Icon } from "semantic-ui-react";

import { saveAs } from "file-saver";
import { jsonToCSV } from "react-papaparse";
import useTranslation from "next-translate/useTranslation";

export default function DownloadRawData({
  slug,
  fileDirs,
  components,
  datasets,
}) {
  const { t } = useTranslation("builder");
  const [loading, setLoading] = useState(false);

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
        }))
      )
      .reduce((a, b) => a.concat(b), []);

    const allKeys = rows
      .map((line) => Object.keys(line))
      .reduce((a, b) => a.concat(b), []);
    const keys = Array.from(new Set(allKeys));
    const csv = jsonToCSV({ fields: keys, data: rows });
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
