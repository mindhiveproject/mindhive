import { useQuery, useMutation } from "@apollo/client";
import { useRouter } from "next/router";

import useForm from "../../../../lib/useForm";

import Navigation from "../Navigation/Main";
import Preview from "./Preview/Main";
import Settings from "./Settings/Main";

import { MY_STUDIES, MY_STUDY } from "../../../Queries/Study";
import { CREATE_STUDY, UPDATE_STUDY } from "../../../Mutations/Study";

import { StyledParticipantPage } from "../../../styles/StyledBuilder";

export default function ParticipantPage({ query, user, tab }) {
  const router = useRouter();
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

  // console.log({ inputs });

  const [
    createStudy,
    { data: createStudyData, loading: createStudyLoading, error: createStudyError },
  ] = useMutation(CREATE_STUDY, {
    variables: {
      input: {
        title: inputs?.title,
        slug: inputs?.slug,
        description: inputs?.description,
        settings: inputs?.settings,
        info: inputs?.info,
        image: inputs?.file
          ? { create: { image: inputs?.file, altText: inputs?.title } }
          : null,
      },
    },
    refetchQueries: [{ query: MY_STUDIES, variables: { id: user?.id } }],
  });

  const [
    updateStudy,
    { data: updateStudyData, loading: updateStudyLoading, error: updateStudyError },
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

  const saveStudy = async () => {
    if(studyId === "add") {
      const newStudy = await createStudy();
      router.push({
        pathname: `/builder/studies/`,
        query: {
          selector: newStudy?.data?.createStudy?.id,
        },
      });
    } else {
      updateStudy();
    }
  }

  return (
    <>
      <Navigation
        query={query}
        user={user}
        tab={tab}
        saveBtnName="Save"
        saveBtnFunction={saveStudy}
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
