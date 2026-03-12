// Add/DatasetForm.js
import Papa from "papaparse";
import { customAlphabet } from "nanoid";
const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 7);

export default function DatasetForm({
  datasetName,
  setDatasetName,
  dataOrigin,
  setDataOrigin,
  file,
  setFile,
  createDatasource,
  projectId,
  studyId,
  studyData,
  studyLoading,
  studyError,
  loading,
  error,
  onCancel,
}) {
  const toJson = (file) => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        complete(results) {
          resolve(results.data);
        },
        error(err) {
          reject(err);
        },
      });
    });
  };

  const getColumnNames = ({ data }) => {
    const allKeys = data
      .map((line) => Object.keys(line))
      .reduce((a, b) => a.concat(b), []);
    const keys = Array.from(new Set(allKeys)).sort();
    return keys;
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) setFile(selectedFile);
  };

  const handleCreateDataset = async () => {
    if (!datasetName || !dataOrigin) return;

    const mutationVariables = {
      data: {
        title: datasetName,
        dataOrigin: dataOrigin,
        project: { connect: { id: projectId } },
      },
    };

    if (dataOrigin === "STUDY") {
      if (!studyId || !studyData?.study) {
        // nothing to connect to – bail out early
        return;
      }
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

      await fetch(`/api/save/?y=${date.year}&m=${date.month}&d=${date.day}`, {
        method: "POST",
        body: JSON.stringify(dataFile),
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

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
    // TEMPLATE: reserved for future extension
  };

  const hasStudy = !!studyData?.study;
  const currentStudyTitle = hasStudy
    ? studyData.study.title
    : "No study linked to this project";

  const createDisabled =
    !datasetName ||
    !dataOrigin ||
    (dataOrigin === "UPLOADED" && !file) ||
    (dataOrigin === "STUDY" && !hasStudy);

  return (
    <div
      style={{
        maxWidth: "520px",
        margin: "0 auto",
        padding: "20px 24px",
        background: "#ffffff",
        borderRadius: "10px",
        boxShadow:
          "0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -2px rgba(0,0,0,0.05)",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <h3
        style={{
          margin: 0,
          fontSize: "1.4rem",
          color: "#1a202c",
        }}
      >
        New dataset
      </h3>
      <p
        style={{
          marginTop: "6px",
          marginBottom: "18px",
          fontSize: "0.95rem",
          color: "#4a5568",
        }}
      >
        Name your dataset and choose where the data should come from.
      </p>

      {/* Dataset name */}
      <div style={{ marginBottom: "20px" }}>
        <label
          style={{
            display: "block",
            marginBottom: "6px",
            fontSize: "0.9rem",
            fontWeight: 600,
            color: "#2d3748",
          }}
        >
          Dataset name
        </label>
        <input
          type="text"
          value={datasetName}
          onChange={(e) => setDatasetName(e.target.value)}
          placeholder="e.g. Pre-test responses, Spring 2026"
          style={{
            width: "100%",
            padding: "9px 11px",
            borderRadius: "6px",
            border: "1px solid #cbd5e0",
            fontSize: "0.95rem",
            outline: "none",
          }}
        />
        <p
          style={{
            marginTop: "6px",
            marginBottom: 0,
            fontSize: "0.8rem",
            color: "#a0aec0",
          }}
        >
          You can rename this later from the dataset settings.
        </p>
      </div>

      {/* Status / errors */}
      {(loading || studyLoading) && (
        <p
          style={{
            fontSize: "0.85rem",
            color: "#718096",
            marginBottom: "10px",
          }}
        >
          Loading data sources…
        </p>
      )}
      {error && (
        <p
          style={{
            fontSize: "0.85rem",
            color: "#c53030",
            marginBottom: "10px",
          }}
        >
          Error creating dataset: {error.message}
        </p>
      )}
      {studyError && (
        <p
          style={{
            fontSize: "0.85rem",
            color: "#c53030",
            marginBottom: "10px",
          }}
        >
          Error loading study: {studyError.message}
        </p>
      )}

      {/* Data origin */}
      <fieldset
        style={{
          margin: 0,
          padding: "12px 12px 10px",
          borderRadius: "8px",
          border: "1px solid #e2e8f0",
        }}
      >
        <legend
          style={{
            padding: "0 6px",
            fontSize: "0.9rem",
            fontWeight: 600,
            color: "#2d3748",
          }}
        >
          Data source
        </legend>

        {/* Study option */}
        <label
          style={{
            display: "flex",
            alignItems: "flex-start",
            padding: "8px 6px",
            borderRadius: "6px",
            cursor: hasStudy ? "pointer" : "not-allowed",
            opacity: hasStudy ? 1 : 0.6,
          }}
        >
          <input
            type="radio"
            name="dataOrigin"
            value="STUDY"
            checked={dataOrigin === "STUDY"}
            onChange={(e) => hasStudy && setDataOrigin(e.target.value)}
            style={{ marginRight: "8px", marginTop: "3px" }}
            disabled={!hasStudy}
          />
          <div>
            <div
              style={{ fontWeight: 500, color: "#2d3748", fontSize: "0.95rem" }}
            >
              Use data from the current study
            </div>
            <div
              style={{
                fontSize: "0.8rem",
                color: hasStudy ? "#4a5568" : "#c53030",
                marginTop: "2px",
              }}
            >
              {hasStudy
                ? `Study: ${currentStudyTitle}`
                : "No study is linked to this project. Link a study to enable this option."}
            </div>
          </div>
        </label>

        {/* Upload option */}
        <label
          style={{
            display: "flex",
            alignItems: "flex-start",
            padding: "8px 6px",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          <input
            type="radio"
            name="dataOrigin"
            value="UPLOADED"
            checked={dataOrigin === "UPLOADED"}
            onChange={(e) => setDataOrigin(e.target.value)}
            style={{ marginRight: "8px", marginTop: "3px" }}
          />
          <div>
            <div
              style={{ fontWeight: 500, color: "#2d3748", fontSize: "0.95rem" }}
            >
              Upload a CSV or JSON file
            </div>
            <div
              style={{
                fontSize: "0.8rem",
                color: "#4a5568",
                marginTop: "2px",
              }}
            >
              Create a dataset from a file on your computer.
            </div>

            {dataOrigin === "UPLOADED" && (
              <div style={{ marginTop: "8px" }}>
                <input
                  type="file"
                  accept=".csv,.json"
                  onChange={handleFileChange}
                  style={{ fontSize: "0.85rem" }}
                />
                <div
                  style={{
                    marginTop: "4px",
                    fontSize: "0.75rem",
                    color: "#a0aec0",
                  }}
                >
                  First row should contain column names.
                </div>
              </div>
            )}
          </div>
        </label>

        {/* Template option (placeholder for later) */}
        <label
          style={{
            display: "flex",
            alignItems: "flex-start",
            padding: "8px 6px",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          <input
            type="radio"
            name="dataOrigin"
            value="TEMPLATE"
            checked={dataOrigin === "TEMPLATE"}
            onChange={(e) => setDataOrigin(e.target.value)}
            style={{ marginRight: "8px", marginTop: "3px" }}
          />
          <div>
            <div
              style={{ fontWeight: 500, color: "#2d3748", fontSize: "0.95rem" }}
            >
              Copy from an existing dataset
            </div>
            <div
              style={{
                fontSize: "0.8rem",
                color: "#4a5568",
                marginTop: "2px",
              }}
            >
              Choose a template dataset (coming soon).
            </div>
          </div>
        </label>
      </fieldset>

      {/* Actions */}
      <div
        style={{
          marginTop: "18px",
          display: "flex",
          justifyContent: "flex-end",
          gap: "8px",
        }}
      >
        <button
          onClick={onCancel}
          type="button"
          style={{
            padding: "8px 14px",
            borderRadius: "6px",
            border: "1px solid #e2e8f0",
            background: "#fff",
            color: "#4a5568",
            fontSize: "0.9rem",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleCreateDataset}
          disabled={createDisabled}
          type="button"
          style={{
            padding: "8px 16px",
            borderRadius: "6px",
            border: "none",
            background: createDisabled ? "#cbd5e0" : "#3182ce",
            color: "#fff",
            fontWeight: 500,
            fontSize: "0.9rem",
            cursor: createDisabled ? "not-allowed" : "pointer",
          }}
        >
          Create dataset
        </button>
      </div>
    </div>
  );
}
