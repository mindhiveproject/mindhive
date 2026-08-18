import { useMutation } from "@apollo/client";

import useForm from "../../../../../lib/useForm";

import ConnectModal from "./Modal";

import { PROPOSAL_QUERY } from "../../../../Queries/Proposal";
import { UPDATE_PROJECT_BOARD } from "../../../../Mutations/Proposal";

import { Image } from "semantic-ui-react";
import Tooltip from "../../../../DesignSystem/Tooltip";

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

  const collaborators = inputs?.collaborators || [];

  return (
    <div className="connectArea" id="connectArea">
      <div className="icons">
        {collaborators.map((collaborator, num) => (
          <Tooltip content={collaborator?.username} key={num}>
            {collaborator?.image?.image?.publicUrlTransformed ? (
              <Image
                src={collaborator?.image?.image?.publicUrlTransformed}
                avatar
              />
            ) : (
              <Image src="/assets/icons/builder/page.svg" avatar />
            )}
          </Tooltip>
        ))}
      </div>

      <ConnectModal
        project={inputs}
        user={user}
        handleChange={handleChange}
        updateProject={updateProject}
      />
    </div>
  );
}
