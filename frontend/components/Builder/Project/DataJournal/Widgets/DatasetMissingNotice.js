import useTranslation from "next-translate/useTranslation";

/**
 * Shown on the canvas in place of a data component whose dataset is not in
 * the journal (`missing`) or that names none (`unassigned`).
 */
export default function DatasetMissingNotice({ status }) {
  const { t } = useTranslation("builder");
  const key = status === "missing" ? "missing" : "unassigned";
  const defaults = {
    missing: {
      title: "This component's dataset is no longer in the journal",
      body: "Open the component and choose a dataset, or add its dataset back to the journal.",
    },
    unassigned: {
      title: "No dataset chosen",
      body: "Open the component and choose which dataset it reads.",
    },
  }[key];

  return (
    <div
      role="status"
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        padding: "16px",
        textAlign: "center",
        color: "#5D5763",
      }}
    >
      <div className="MH-Type-Label-Base" style={{ color: "#171717" }}>
        {t(
          `dataJournal.componentEditor.datasetSource.${key}Title`,
          {},
          { default: defaults.title },
        )}
      </div>
      <div className="MH-Type-Body-Small">
        {t(
          `dataJournal.componentEditor.datasetSource.${key}Body`,
          {},
          { default: defaults.body },
        )}
      </div>
    </div>
  );
}
