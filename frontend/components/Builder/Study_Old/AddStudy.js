import useForm from "../../../lib/useForm";
import Router from "./Router";

export default function AddStudy({ query, user }) {
  // save and edit the study information
  const { inputs, handleChange, handleMultipleUpdate, captureFile, clearForm } =
    useForm({
      title: "",
      description: "",
    });

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
