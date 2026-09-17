import { useMutation } from "@apollo/client";

import useForm from "../../../../../lib/useForm";

import ConnectModal from "./Modal";

import { MY_STUDY } from "../../../../Queries/Study";
import { PROPOSAL_QUERY } from "../../../../Queries/Proposal";
import { UPDATE_STUDY } from "../../../../Mutations/Study";

import ConnectFacepile from "../ConnectFacepile";

export default function Connect({ study, user, projectId }) {
  // save and edit the study information
  const { inputs, handleChange, handleMultipleUpdate, captureFile, clearForm } =
    useForm({
      ...study,
    });

  const studyId = study?.id || inputs?.id;

  const [updateStudy] = useMutation(UPDATE_STUDY);

  const saveStudy = () => {
    if (!studyId) return Promise.resolve();
    return updateStudy({
      variables: {
        id: studyId,
        input: {
          collaborators: {
            set: (inputs?.collaborators || []).map((col) => ({ id: col?.id })),
          },
          classes: inputs?.classes
            ? {
                set: inputs.classes
                  .filter((cl) => cl?.id)
                  .map((cl) => ({ id: cl.id })),
              }
            : {
                disconnect: (study?.classes || []).map((cl) => ({
                  id: cl?.id,
                })),
              },
        },
      },
      refetchQueries: [
        { query: MY_STUDY, variables: { id: studyId } },
        projectId && { query: PROPOSAL_QUERY, variables: { id: projectId } },
      ].filter(Boolean),
    });
  };

  const collaborators = study?.collaborators || [];

  return (
    <div className="connectArea">
      <ConnectFacepile collaborators={collaborators}>
        <ConnectModal
          study={inputs}
          user={user}
          handleChange={handleChange}
          updateStudy={saveStudy}
        />
      </ConnectFacepile>
    </div>
  );
}
