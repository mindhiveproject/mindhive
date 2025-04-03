import { useQuery, useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import { customAlphabet } from "nanoid";
const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 4);

import useForm from "../../../../lib/useForm";

import Navigation from "../Navigation/Main";

// old import (from Study folder)
// import Preview from "./Preview/Main";
// import Settings from "./Settings/Main";

// new import (from Project folder)
import Preview from "../../Project/ParticipantPage/Preview/Main";
import Settings from "../../Project/ParticipantPage/Settings/Main";

import { MY_STUDIES, MY_STUDY } from "../../../Queries/Study";
import { CREATE_STUDY, UPDATE_STUDY } from "../../../Mutations/Study";

import { StyledParticipantPage } from "../../../styles/StyledBuilder";

export default function ParticipantPage({ query, user, tab, toggleSidebar }) {
  const router = useRouter();
  const { area } = query;
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
    settings: {
      forbidRetake: true,
      hideParticipateButton: false,
      showEmailNotificationPropmt: false,
      askStudentsNYC: false,
      zipCode: false,
      guestParticipation: true,
      consentObtained: false,
      proceedToFirstTask: true,
      useExternalDevices: false,
      sonaId: false,
      minorsBlocked: false,
    },
  };

  // save and edit the study information
  const { inputs, handleChange, handleMultipleUpdate, captureFile, clearForm } =
    useForm({
      ...study,
    });

  // modify the study if it has to be cloned
  useEffect(() => {
    function prepareStudyToClone() {
      const rand = nanoid(4);
      // connect to the user class(es) if the user is a student
      const classes =
        user && user?.permissions.map((p) => p?.name).includes("STUDENT")
          ? user?.studentIn
          : [];
      handleMultipleUpdate({
        image: null,
        title: `Clone of ${study?.title}-${rand}`,
        slug: `${study?.slug}-${rand}`,
        consent: [],
        collaborators: [],
        classes,
        diagram: study?.diagram,
        flow: study?.flow,
      });
    }
    if (area === "cloneofstudy" && study?.id) {
      prepareStudyToClone();
    }
  }, [study]);

  // connect the new study to the user class(es) automatically
  useEffect(() => {
    function connectToClass() {
      handleChange({ target: { name: "classes", value: user?.studentIn } });
    }
    if (
      studyId === "add" &&
      user &&
      user?.permissions.map((p) => p?.name).includes("STUDENT") &&
      user?.studentIn &&
      user?.studentIn?.length
    ) {
      connectToClass();
    }
  }, [user]);

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
        consent: inputs?.consent?.length
          ? { connect: inputs?.consent?.map((cl) => ({ id: cl?.id })) }
          : null,
        talks: {
          create: [{ settings: { type: "default", title: "Project chat" } }],
        },
        classes: { connect: inputs?.classes?.map((cl) => ({ id: cl?.id })) },
        flow: inputs?.flow,
        diagram: inputs?.diagram,
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
    if (studyId === "add" || area === "cloneofstudy") {
      const newStudy = await createStudy();
      router.push({
        pathname: `/builder/studies/`,
        query: {
          selector: newStudy?.data?.createStudy?.id,
        },
      });
      setHasStudyChanged(false);
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
          user={user}
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
