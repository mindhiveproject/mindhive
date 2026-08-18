import Papa from "papaparse";
import Button from "../../../DesignSystem/Button";
import useTranslation from "next-translate/useTranslation";

// helper function to get all column names of the given dataset
const getColumnNames = (data) => {
  const allKeys = data
    .map((line) => Object.keys(line))
    .reduce((a, b) => a.concat(b), []);
  const keys = Array.from(new Set(allKeys)).sort();
  return keys;
};

export default function DataUpload({ setData, setVariables, studyData }) {
  const { t } = useTranslation("builder");
  async function handleDataUpload(e) {
    const form = e.currentTarget;
    const [file] = await form.files;

    if (file.type === "application/json") {
      const text = await file.text();
      const uploadedData = JSON.parse(text);

      setData(uploadedData);
      setVariables(getColumnNames(uploadedData));
    } else {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          setData(results.data);
          setVariables(getColumnNames(results.data));
        },
        error: (error) => {
          console.log(error);
        },
      });
    }
  }

  return (
    <div className="buttons">
      <input
        type="file"
        id="fileUpload"
        style={{ display: "none" }}
        onChange={handleDataUpload}
      />
      <Button
        variant="filled"
        type="button"
        onClick={() => document.getElementById("fileUpload")?.click()}
      >
        {t("dataUpload.chooseDataFile", {}, { default: "Choose the data file" })}
      </Button>
      <Button
        variant="outline"
        type="button"
        onClick={() => {
          setData([...studyData]);
          setVariables(getColumnNames(studyData));
        }}
      >
        {t("dataUpload.useStudyData", {}, { default: "Use study data" })}
      </Button>
    </div>
  );
}
