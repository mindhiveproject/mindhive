import { useQuery, useMutation } from "@apollo/client";

import useForm from "../../../../lib/useForm";

import { MY_STUDY } from "../../../Queries/Study";
import { UPDATE_STUDY } from "../../../Mutations/Study";

import Router from "./Router";

export default function Builder({ query, user, tab }) {
  const studyId = query?.selector;

  const { data, error, loading } = useQuery(MY_STUDY, {
    variables: { id: studyId },
  });
  const study = data?.study || {
    title: "",
    description: "",
    collaborators: [],
    classes: [],
    consent: [],
  };

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
      ...inputs,
      collaborators: inputs?.collaborators.map((col) => ({ id: col?.id })),
      classes: inputs?.classes.map((cl) => ({ id: cl?.id })),
      consent: inputs?.consent.map((con) => ({ id: con?.id })),
    },
    refetchQueries: [{ query: MY_STUDY, variables: { id: studyId } }],
  });

  if (!studyId) {
    return <div>No study found, please save your study first.</div>;
  }

  return (
    <Router
      query={query}
      user={user}
      tab={tab}
      study={study}
      handleChange={handleChange}
      handleMultipleUpdate={handleMultipleUpdate}
      captureFile={captureFile}
      updateStudy={updateStudy}
    />
  );
}
