import { useQuery } from "@apollo/client";
import { STUDY_TO_CLONE } from "../../Queries/Study";
import Router from "./Router";

import useForm from "../../../lib/useForm";

export default function CloneStudy({ query, user, studySlug }) {
  const { data, error, loading } = useQuery(STUDY_TO_CLONE, {
    variables: { slug: studySlug },
  });
  const study = data?.study || {
    title: "",
    description: "",
  };

  // save and edit the study information
  const { inputs, handleChange, handleMultipleUpdate, captureFile, clearForm } =
    useForm({
      ...study,
      id: undefined,
    });

  console.log({ inputs });

  return (
    <Router
      query={query}
      user={user}
      study={inputs}
      handleChange={handleChange}
      handleMultipleUpdate={handleMultipleUpdate}
      captureFile={captureFile}
    />
  );
}
