import { useMutation } from "@apollo/client";

import useForm from "../../../../../lib/useForm";

import ConnectModal from "./Modal";

import { MY_STUDY } from "../../../../Queries/Study";
import { UPDATE_STUDY } from "../../../../Mutations/Study";

import { Image, Popup } from "semantic-ui-react";

export default function Connect({ study, user }) {
  // save and edit the study information
  const { inputs, handleChange, handleMultipleUpdate, captureFile, clearForm } =
    useForm({
      ...study,
    });

  const [
    updateStudy,
    { data: studyData, loading: studyLoading, error: studyError },
  ] = useMutation(UPDATE_STUDY, {
    variables: {
      id: study?.id,
      input: {
        collaborators: {
          set: inputs?.collaborators?.map((col) => ({ id: col?.id })),
        },
        classes: inputs?.classes
          ? { set: inputs?.classes?.map((cl) => ({ id: cl?.id })) }
          : { disconnect: study?.classes?.map((cl) => ({ id: cl?.id })) },
      },
    },
    refetchQueries: [{ query: MY_STUDY, variables: { id: study?.id } }],
  });

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
