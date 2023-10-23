import { useMutation } from "@apollo/client";
// import Avatar from "react-avatar";

import useForm from "../../../../../lib/useForm";

import ConnectModal from "./Modal";

import { MY_STUDY } from "../../../../Queries/Study";
import { UPDATE_STUDY } from "../../../../Mutations/Study";

import { 
  Icon, 
} from "semantic-ui-react";

export default function Connect({ study, user }) {
  // save and edit the study information
  const { inputs, handleChange, handleMultipleUpdate, captureFile, clearForm } =
    useForm({
      ...study,
    });

    console.log({ inputs });

  const [
    updateStudy,
    { data: studyData, loading: studyLoading, error: studyError },
  ] = useMutation(UPDATE_STUDY, {
    variables: {
      id: study?.id,
      input: {
        collaborators: { set: inputs?.collaborators?.map((col) => ({ id: col?.id }))},
        classes: { set: inputs?.classes?.map((cl) => ({ id: cl?.id }))},
      }
    },
    refetchQueries: [{ query: MY_STUDY, variables: { id: study?.id } }],
  });

  const collaborators = inputs?.collaborators || [];

  return (
    <div className="connectArea">
      <div className="icons">
        {collaborators.map((collaborator, num) => (
          <div key={num} className="contentImg">
            { collaborator?.image?.image?.publicUrlTransformed ?
              <img 
                src={collaborator?.image?.image?.publicUrlTransformed}
              />
              :
              <Icon name='user' aria-label={collaborator?.username} /> 
            }
            <div className="username">{collaborator?.username}</div>
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
