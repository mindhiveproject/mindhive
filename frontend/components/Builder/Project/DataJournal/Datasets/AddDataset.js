// AddDataset.js
import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";

import DatasetForm from "./Add/DatasetForm";

import { CREATE_DATASOURCE } from "../../../../Mutations/Datasource";
import { STUDY_TO_JOIN } from "../../../../Queries/Study";

import {
  StyledDataArea,
  StyledDataJournal,
  StyledRightPanel,
} from "../styles/StyledDataJournal";

export default function AddDataset({
  projectId,
  studyId,
  onCancel,
  onCreate,
  refetchDatasources,
}) {
  const [datasetName, setDatasetName] = useState("");
  const [dataOrigin, setDataOrigin] = useState("");
  const [file, setFile] = useState(null);

  const {
    data: studyData,
    loading: studyLoading,
    error: studyError,
  } = useQuery(STUDY_TO_JOIN, {
    variables: { id: studyId },
    skip: !studyId,
  });

  const [createDatasource, { loading, error }] = useMutation(
    CREATE_DATASOURCE,
    {
      onCompleted: (data) => {
        if (refetchDatasources) refetchDatasources();
        if (onCreate) onCreate(data.createDatasource);
        setDatasetName("");
        setDataOrigin("");
        setFile(null);
        onCancel();
      },
      onError: (error) => {
        console.error("Mutation error:", error);
      },
    },
  );

  return (
    <StyledDataArea>
      <StyledDataJournal>
        <StyledRightPanel>
          <DatasetForm
            datasetName={datasetName}
            setDatasetName={setDatasetName}
            dataOrigin={dataOrigin}
            setDataOrigin={setDataOrigin}
            file={file}
            setFile={setFile}
            createDatasource={createDatasource}
            projectId={projectId}
            studyId={studyId}
            studyData={studyData}
            studyLoading={studyLoading}
            studyError={studyError}
            loading={loading}
            error={error}
            onCancel={onCancel}
          />
        </StyledRightPanel>
      </StyledDataJournal>
    </StyledDataArea>
  );
}
