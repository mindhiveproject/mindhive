import { useMutation } from "@apollo/client";

import useForm from "../../../../../lib/useForm";

import ConnectModal from "./Modal";

import { MY_STUDY, STUDY_PROPOSALS_QUERY } from "../../../../Queries/Study";
import { UPDATE_STUDY } from "../../../../Mutations/Study";

import { Image } from "semantic-ui-react";
import Tooltip from "../../../../DesignSystem/Tooltip";

export default function Connect({
  study,
  user,
  modalOpen,
  onModalOpenChange,
}) {
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
          set: (inputs?.collaborators || []).map((col) => ({ id: col?.id })),
        },
        classes: {
          set: Array.isArray(inputs?.classes)
            ? inputs.classes.filter((cl) => cl?.id).map((cl) => ({ id: cl.id }))
            : [],
        },
      },
    },
    refetchQueries: [
      { query: MY_STUDY, variables: { id: study?.id } },
      { query: STUDY_PROPOSALS_QUERY, variables: { id: study?.id } },
    ],
  });

  const collaborators = inputs?.collaborators || [];

  return (
    <div className="connectArea">
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
        study={inputs}
        user={user}
        handleChange={handleChange}
        updateStudy={updateStudy}
        open={modalOpen}
        onOpenChange={onModalOpenChange}
      />
    </div>
  );
}
