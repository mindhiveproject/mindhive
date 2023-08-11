import { useQuery, useMutation } from "@apollo/client";

import useForm from "../../../../lib/useForm";

import Navigation from "../Navigation/Main";
import Preview from "./Preview/Main";
import Settings from "./Settings/Main";

import { MY_STUDY } from "../../../Queries/Study";
import { UPDATE_STUDY } from "../../../Mutations/Study";

import { StyledParticipantPage } from "../../../styles/StyledBuilder";

export default function ParticipantPage({ query, user, tab }) {
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
      id: study?.id,
      input: {
        title: inputs?.title,
        slug: inputs?.slug,
        description: inputs?.description,
        settings: inputs?.settings,
        info: inputs?.info,
        image: inputs?.file
          ? { create: { image: inputs?.file, altText: inputs?.title } }
          : null,
        // ...inputs,
        // collaborators: inputs?.collaborators.map((col) => ({ id: col?.id })),
        // classes: inputs?.classes.map((cl) => ({ id: cl?.id })),
        // consent: inputs?.consent.map((con) => ({ id: con?.id })),
      },
    },
    refetchQueries: [{ query: MY_STUDY, variables: { id: studyId } }],
  });

  return (
    <>
      <Navigation
        query={query}
        user={user}
        tab={tab}
        saveBtnName="Save"
        saveBtnFunction={updateStudy}
      />
      <StyledParticipantPage>
        <Preview
          study={inputs}
          handleChange={handleChange}
          handleMultipleUpdate={handleMultipleUpdate}
          captureFile={captureFile}
        />
        <Settings
          user={user}
          study={inputs}
          handleChange={handleChange}
          handleMultipleUpdate={handleMultipleUpdate}
        />
      </StyledParticipantPage>
    </>
  );
}
