import { useMutation } from "@apollo/client";

import useForm from "../../../../../lib/useForm";

import ConnectModal from "./Modal";

import { MY_STUDY } from "../../../../Queries/Study";
import { UPDATE_STUDY } from "../../../../Mutations/Study";

import ConnectFacepile from "../ConnectFacepile";

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

  const collaborators = study?.collaborators || [];

  return (
    <div className="connectArea">
      <ConnectFacepile collaborators={collaborators}>
        <ConnectModal
          study={inputs}
          user={user}
          handleChange={handleChange}
          updateStudy={updateStudy}
        />
      </ConnectFacepile>
    </div>
  );
}
