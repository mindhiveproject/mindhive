// AddDataset.js
import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";

import DatasetForm from "./Add/DatasetForm";

import { CREATE_DATASOURCE } from "../../../../Mutations/Datasource";
import { PROPOSAL_BOARD_SHARING } from "../../../../Queries/Proposal";
import { STUDY_TO_JOIN } from "../../../../Queries/Study";
import { useDataJournal } from "../Context/DataJournalContext";

export default function AddDataset({
  projectId,
  studyId,
  onCancel,
  onCreate,
  refetchDatasources,
}) {
  const { selectedJournal, user } = useDataJournal();
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

  const { data: boardSharingData } = useQuery(PROPOSAL_BOARD_SHARING, {
    variables: { id: projectId },
    skip: !projectId,
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
      projectBoardForSharing={boardSharingData?.proposalBoard}
      selectedVizPartId={selectedJournal?.id}
      currentUserId={user?.id}
      loading={loading}
      error={error}
      onCancel={onCancel}
    />
  );
}
