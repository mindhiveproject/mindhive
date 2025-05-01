import { useQuery, useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import { customAlphabet } from "nanoid";
const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 4);

import useForm from "../../../../lib/useForm";

import Navigation from "../Navigation/Main";
import Preview from "./Preview/Main";
import Settings from "./Settings/Main";

import { MY_STUDIES } from "../../../Queries/Study";
import { GET_PROJECT_STUDY } from "../../../Queries/Proposal";

import { CREATE_STUDY, UPDATE_STUDY } from "../../../Mutations/Study";

import { StyledParticipantPage } from "../../../styles/StyledBuilder";

import InDev from "../../../Global/InDev";
import { disconnect } from "process";

export default function ParticipantPage({ query, user, tab, toggleSidebar }) {
  const router = useRouter();
  const { area } = query;
  const projectId = query?.selector;

  const [hasStudyChanged, setHasStudyChanged] = useState(false);

  const { data, error, loading } = useQuery(GET_PROJECT_STUDY, {
    variables: { id: projectId },
  });

  const study = data?.proposalBoard?.study || {};

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
      projectId === "add" &&
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
          : { disconnect: study?.consent?.map((c) => ({ id: c?.id })) },
      },
    },
    refetchQueries: [
      { query: GET_PROJECT_STUDY, variables: { id: projectId } },
    ],
  });

  const saveStudy = async () => {
    if (projectId === "add" || area === "cloneofstudy") {
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

  if (!study?.id) {
    return (
      <>
        <Navigation
          proposalId={query?.selector}
          query={query}
          user={user}
          tab={tab}
          saveBtnName="Save"
          saveBtnFunction={saveStudy}
          toggleSidebar={toggleSidebar}
          hasStudyChanged={hasStudyChanged}
        />
        <InDev
          header={`🤷🏻 Your project has no Study attached to it.`}
          message="Let your teacher know so they can create one and associate it. If you need help, please contact tech support at support.mindhive@nyu.edu."
        />
      </>
    );
  }

  return (
    <>
      <Navigation
        proposalId={query?.selector}
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
