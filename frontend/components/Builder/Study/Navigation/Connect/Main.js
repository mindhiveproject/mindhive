import { useMutation } from "@apollo/client";

import useForm from "../../../../../lib/useForm";

import ConnectModal from "./Modal";

import { MY_STUDY, STUDY_PROPOSALS_QUERY } from "../../../../Queries/Study";
import { UPDATE_STUDY } from "../../../../Mutations/Study";

import ConnectFacepile from "../../../Project/Navigation/ConnectFacepile";
import { useLinkedBoardPeople } from "../../../shared/LinkedBoardPeople";

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
      },
    },
    refetchQueries: [
      { query: MY_STUDY, variables: { id: study?.id } },
      { query: STUDY_PROPOSALS_QUERY, variables: { id: study?.id } },
    ],
  });

  const collaborators = inputs?.collaborators || [];
  // The facepile also shows the people on linked project boards, who can
  // edit the study through their board (read-only in the modal).
  const { people: boardPeople } = useLinkedBoardPeople(
    study?.id,
    collaborators.map((c) => c?.id)
  );

  return (
    <div className="connectArea">
      <ConnectFacepile collaborators={[...collaborators, ...boardPeople]}>
        <ConnectModal
          study={inputs}
          user={user}
          handleChange={handleChange}
          updateStudy={updateStudy}
          open={modalOpen}
          onOpenChange={onModalOpenChange}
        />
      </ConnectFacepile>
    </div>
  );
}
