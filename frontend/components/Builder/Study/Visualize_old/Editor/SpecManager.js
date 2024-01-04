import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";

import {
  DELETE_SPEC,
  CREATE_SPEC,
  UPDATE_SPEC,
} from "../../../../Mutations/Spec";

import { STUDY_SPECS } from "../../../../Queries/Spec";

// import StyledStarboard, { VisualizeStyledForm } from "../../Styles/Script";

export default function SpecManager({
  studyId,
  user,
  spec,
  setSpec,
  defaultSpec,
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [specId, setSpecId] = useState(null);

  // get the study specs
  const { data, error, loading } = useQuery(STUDY_SPECS, {
    variables: {
      studyId,
    },
  });

  // create a new spec
  const [
    createSpec,
    {
      data: createSpecData,
      loading: createSpecLoading,
      error: createSpecError,
    },
  ] = useMutation(CREATE_SPEC, {
    variables: {
      title,
      description,
      studyId,
      content: JSON.stringify(spec),
    },
    refetchQueries: [{ query: STUDY_SPECS, variables: { studyId } }],
  });

  // update a spec
  const [
    updateSpec,
    {
      data: updateSpecData,
      loading: updateSpecLoading,
      error: updateSpecError,
    },
  ] = useMutation(UPDATE_SPEC, {
    variables: {
      title,
      description,
      content: JSON.stringify(spec),
    },
    refetchQueries: [{ query: STUDY_SPECS, variables: { studyId } }],
  });

  const [deleteSpec, { loading: deleteSpecLoading }] = useMutation(
    DELETE_SPEC,
    {
      refetchQueries: [{ query: STUDY_SPECS, variables: { studyId } }],
    }
  );

  const specs = data?.specs || [];

  const openSpec = (spec) => {
    setSpecId(spec?.id);
    setTitle(spec?.title);
    setDescription(spec?.description);
    setSpec(JSON.parse(spec?.content));
  };

  const newSpec = () => {
    setSpecId(null);
    setTitle("");
    setDescription("");
    setSpec(defaultSpec);
  };

  return (
    <div className="specManager">
      <div className="specManagerForm">
        <fieldset disabled={loading} aria-busy={loading}>
          <label htmlFor="title">
            Title
            <input
              type="text"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label htmlFor="description">
            Description
            <textarea
              id="description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>

          {specId ? (
            <button
              onClick={() => updateSpec({ variables: { id: specId } })}
              disabled={updateSpecLoading}
            >
              Update
            </button>
          ) : (
            <button onClick={() => createSpec()} disabled={createSpecLoading}>
              Save
            </button>
          )}
        </fieldset>
        <div className="visualizeScripts">
          {specs.map((spec) => (
            <div className="visualizeScript" key={spec?.id}>
              <div>{spec?.title}</div>
              <div>{spec?.description}</div>
              <button onClick={() => openSpec(spec)}>Open</button>
              <button
                onClick={() => deleteSpec({ variables: { id: spec?.id } })}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
        <button onClick={() => newSpec()}>New graph</button>
      </div>
    </div>
  );
}
