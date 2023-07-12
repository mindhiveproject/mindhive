import { useMutation } from "@apollo/client";
import Avatar from "react-avatar";

import useForm from "../../../../../lib/useForm";

import ConnectModal from "./Modal";

import { MY_STUDY } from "../../../../Queries/Study";
import { UPDATE_STUDY } from "../../../../Mutations/Study";

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
      ...inputs,
      collaborators: inputs?.collaborators?.map((col) => ({ id: col?.id })),
      classes: inputs?.classes?.map((cl) => ({ id: cl?.id })),
      consent: inputs?.consent?.map((con) => ({ id: con?.id })),
    },
    refetchQueries: [{ query: MY_STUDY, variables: { id: study?.id } }],
  });

  const collaborators = inputs?.collaborators || [];

  return (
    <div className="connectArea">
      <div className="icons">
        {collaborators.map((collaborator, num) => (
          <div key={num}>
            <Avatar
              name={collaborator?.username}
              maxInitials={2}
              size="26px"
              round
            />
          </div>
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
