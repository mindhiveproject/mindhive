import { useMutation } from "@apollo/client";

import useForm from "../../../../../lib/useForm";

import ConnectModal from "./Modal";

import { PROPOSAL_QUERY } from "../../../../Queries/Proposal";
import { UPDATE_PROJECT_BOARD } from "../../../../Mutations/Proposal";

import { Image, Popup } from "semantic-ui-react";

export default function Connect({ project, user }) {
  // save and edit the study information
  const { inputs, handleChange, handleMultipleUpdate, captureFile, clearForm } =
    useForm({
      ...project,
    });

  const [updateStudy, { data, loading, error }] = useMutation(
    UPDATE_PROJECT_BOARD,
    {
      variables: {
        id: project?.id,
        input: {
          collaborators: {
            set: inputs?.collaborators?.map((col) => ({ id: col?.id })),
          },
          // classes: { set: inputs?.classes?.map((cl) => ({ id: cl?.id })) },
        },
      },
      refetchQueries: [
        { query: PROPOSAL_QUERY, variables: { id: project?.id } },
      ],
    }
  );

  const collaborators = inputs?.collaborators || [];

  return (
    <div className="connectArea">
      <div className="icons">
        {collaborators.map((collaborator, num) => (
          <Popup
            content={collaborator?.username}
            key={num}
            trigger={
              collaborator?.image?.image?.publicUrlTransformed ? (
                <Image
                  src={collaborator?.image?.image?.publicUrlTransformed}
                  avatar
                />
              ) : (
                <Image src="/assets/icons/builder/page.svg" avatar />
              )
            }
            size="huge"
          />
        ))}
      </div>

      <ConnectModal
        study={inputs}
        user={user}
        handleChange={handleChange}
        updateStudy={updateStudy}
      />
    </div>
  );
}
