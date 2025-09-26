import Papa from "papaparse";
import { customAlphabet } from "nanoid";
const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 7);

export default function DataSourceSelector({
  dataOrigin,
  setDataOrigin,
  file,
  setFile,
  createDatasource,
  datasetName,
  projectId,
  studyId,
  studyData,
  studyLoading,
  studyError,
  loading,
  error,
  onCancel,
}) {
  // Convert CSV file to JSON with promise
  const toJson = (file) => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        complete(results, file) {
          resolve(results.data);
        },
        error(err, file) {
          reject(err);
        },
      });
    });
  };

  // Helper function to get all column names of the given dataset
  const getColumnNames = ({ data }) => {
    const allKeys = data
      .map((line) => Object.keys(line))
      .reduce((a, b) => a.concat(b), []);
    const keys = Array.from(new Set(allKeys)).sort();
    return keys;
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleCreateDataset = async () => {
    if (!dataOrigin) return;

    const mutationVariables = {
      data: {
        title: datasetName,
        dataOrigin: dataOrigin,
        project: { connect: { id: projectId } },
      },
    };

    if (dataOrigin === "STUDY" && studyId) {
      mutationVariables.data.study = { connect: { id: studyId } };
      await createDatasource({ variables: mutationVariables });
    } else if (dataOrigin === "UPLOADED" && file) {
      let data;
      if (file.type === "application/json") {
        const text = await file.text();
        data = JSON.parse(text);
      } else {
        data = await toJson(file);
      }

      const variableNames = getColumnNames({ data });
      const variables = variableNames.map((variable) => ({
        field: variable,
        type: "general",
        editable: false,
      }));

      const metadata = {
        id: nanoid(),
        payload: "upload",
        timestampUploaded: Date.now(),
        variables: variables,
      };

      const dataFile = {
        metadata,
        data: data,
      };

      const curDate = new Date();
      const date = {
        year: parseInt(curDate.getFullYear()),
        month: parseInt(curDate.getMonth()) + 1,
        day: parseInt(curDate.getDate()),
      };

      const res = await fetch(
        `/api/save/?y=${date.year}&m=${date.month}&d=${date.day}`,
        {
          method: "POST",
          body: JSON.stringify(dataFile),
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      const fileAddress = {
        ...date,
        token: metadata?.id,
      };

      mutationVariables.data.content = {
        uploaded: {
          address: fileAddress,
          metadata: {
            id: metadata?.id,
            payload: metadata?.payload,
            timestampUploaded: metadata?.timestampUploaded,
          },
        },
      };

      await createDatasource({ variables: mutationVariables });
    }
  };

  const currentStudyTitle = studyData?.study?.title || "Loading study...";

  return (
    <div>
      <h3>Choose data source</h3>
      {loading && <p>Creating dataset...</p>}
      {error && <p style={{ color: "red" }}>Error: {error.message}</p>}
      {studyLoading && <p>Loading study...</p>}
      {studyError && (
        <p style={{ color: "red" }}>
          Error loading study: {studyError.message}
        </p>
      )}
      <div style={{ margin: "10px 0" }}>
        <label style={{ display: "block", marginBottom: "10px" }}>
          <input
            type="radio"
            name="dataOrigin"
            value="STUDY"
            onChange={(e) => setDataOrigin(e.target.value)}
            style={{ marginRight: "8px" }}
          />
          The current study: {currentStudyTitle}
        </label>
        <label style={{ display: "block", marginBottom: "10px" }}>
          <input
            type="radio"
            name="dataOrigin"
            value="UPLOADED"
            onChange={(e) => setDataOrigin(e.target.value)}
            style={{ marginRight: "8px" }}
          />
          Import external data file (CSV/JSON)
        </label>
        {dataOrigin === "UPLOADED" && (
          <div style={{ margin: "10px 0" }}>
            <input
              type="file"
              accept=".csv,.json"
              onChange={handleFileChange}
              style={{ marginBottom: "10px" }}
            />
          </div>
        )}
        <label style={{ display: "block", marginBottom: "10px" }}>
          <input
            type="radio"
            name="dataOrigin"
            value="TEMPLATE"
            onChange={(e) => setDataOrigin(e.target.value)}
            style={{ marginRight: "8px" }}
          />
          Copy an existing dataset from a template
        </label>
      </div>
      <div style={{ marginTop: "10px" }}>
        <button
          onClick={handleCreateDataset}
          disabled={!dataOrigin || (dataOrigin === "UPLOADED" && !file)}
          style={{ padding: "8px 16px", marginRight: "10px" }}
        >
          Continue
        </button>
        <button
          onClick={onCancel}
          style={{
            padding: "8px 16px",
            backgroundColor: "#ff4d4d",
            color: "white",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}