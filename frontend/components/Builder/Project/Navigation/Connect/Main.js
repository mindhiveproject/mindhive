import { useState } from "react";
import { useMutation } from "@apollo/client";

import useForm from "../../../../../lib/useForm";

import ConnectModal from "./Modal";

import { PROPOSAL_QUERY } from "../../../../Queries/Proposal";
import { UPDATE_PROJECT_BOARD } from "../../../../Mutations/Proposal";

import ConnectFacepile from "../ConnectFacepile";
import { boardRuleMessage } from "../../../../../lib/mainProject";

export default function Connect({ project, user }) {
  // save and edit the study information
  const { inputs, handleChange, handleMultipleUpdate, captureFile, clearForm } =
    useForm({
      ...project,
    });

  const [updateProject, { data, loading, error }] = useMutation(
    UPDATE_PROJECT_BOARD,
    {
      variables: {
        id: project?.id,
        input: {
          title: inputs?.title,
          collaborators: {
            set: inputs?.collaborators?.map((col) => ({ id: col?.id })),
          },
          usedInClass:
            inputs?.usedInClass &&
            inputs?.usedInClass?.id !== "$$$-class-not-connected-$$$"
              ? { connect: { id: inputs?.usedInClass?.id } }
              : { disconnect: true },
        },
      },
      refetchQueries: [
        { query: PROPOSAL_QUERY, variables: { id: project?.id } },
      ],
    }
  );

  // The server may refuse a class change (keystone/lib/mainProject.js); the
  // modal stays open and shows why.
  const [saveError, setSaveError] = useState(null);
  const save = async () => {
    try {
      setSaveError(null);
      await updateProject();
      return true;
    } catch (err) {
      setSaveError(boardRuleMessage(err));
      return false;
    }
  };

  const collaborators = inputs?.collaborators || [];

  return (
    <div className="connectArea" id="connectArea">
      <ConnectFacepile collaborators={collaborators}>
        <ConnectModal
          project={inputs}
          user={user}
          handleChange={handleChange}
          updateProject={save}
          saveError={saveError}
          savedProject={project}
        />
      </ConnectFacepile>
    </div>
  );
}
