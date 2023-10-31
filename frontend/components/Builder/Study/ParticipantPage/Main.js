import { useQuery, useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import { useState } from "react";

import useForm from "../../../../lib/useForm";

import Navigation from "../Navigation/Main";
import Preview from "./Preview/Main";
import Settings from "./Settings/Main";

import { MY_STUDIES, MY_STUDY } from "../../../Queries/Study";
import { CREATE_STUDY, UPDATE_STUDY } from "../../../Mutations/Study";

import { StyledParticipantPage } from "../../../styles/StyledBuilder";

export default function ParticipantPage({ query, user, tab, toggleSidebar }) {
  const router = useRouter();
  const studyId = query?.selector;

  const [hasStudyChanged, setHasStudyChanged] = useState(false);

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

  const handleStudyChange = (props) => {
    setHasStudyChanged(true);
    handleChange(props);
  };

  const handleStudyMultipleUpdate = (props) => {
    setHasStudyChanged(true);
    handleMultipleUpdate(props);
  };

  const captureStudyFile = (props) => {
    setHasStudyChanged(true);
    captureFile(props);
  };

  const [
    createStudy,
    {
      data: createStudyData,
      loading: createStudyLoading,
      error: createStudyError,
    },
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
        consent: inputs?.consent?.length ? { connect: inputs?.consent } : null,
        talks: {
          create: [{ settings: { type: "default", title: "Project chat" } }],
        },
      },
    },
    refetchQueries: [{ query: MY_STUDIES, variables: { id: user?.id } }],
  });

  const [
    updateStudy,
    {
      data: updateStudyData,
      loading: updateStudyLoading,
      error: updateStudyError,
    },
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
        consent: inputs?.consent?.length
          ? { connect: inputs?.consent.map((c) => ({ id: c?.id })) }
          : null,
      },
    },
    refetchQueries: [{ query: MY_STUDY, variables: { id: studyId } }],
  });

  const saveStudy = async () => {
    if (studyId === "add") {
      const newStudy = await createStudy();
      router.push({
        pathname: `/builder/studies/`,
        query: {
          selector: newStudy?.data?.createStudy?.id,
        },
      });
    } else {
      updateStudy();
      setHasStudyChanged(false);
    }
  };

  return (
    <>
      <Navigation
        query={query}
        user={user}
        tab={tab}
        saveBtnName="Save"
        saveBtnFunction={saveStudy}
        toggleSidebar={toggleSidebar}
        hasStudyChanged={hasStudyChanged}
      />
      <StyledParticipantPage>
        <Preview
          study={inputs}
          handleChange={handleStudyChange}
          handleMultipleUpdate={handleStudyMultipleUpdate}
          captureFile={captureStudyFile}
        />
        <Settings
          user={user}
          study={inputs}
          handleChange={handleStudyChange}
          handleMultipleUpdate={handleStudyMultipleUpdate}
        />
      </StyledParticipantPage>
    </>
  );
}
