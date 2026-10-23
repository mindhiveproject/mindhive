import { useQuery, useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import { useEffect, useRef } from "react";
import useTranslation from "next-translate/useTranslation";

import { customAlphabet } from "nanoid";
const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 4);

import useForm from "../../../../lib/useForm";
import useAutoSave from "../../../../lib/useAutoSave";

import Navigation from "../Navigation/Main";
import Preview from "./Preview/Main";
import Settings from "./Settings/Main";

import { MY_STUDIES, MY_STUDY } from "../../../Queries/Study";
import { GET_PROJECT_STUDY } from "../../../Queries/Proposal";

import { CREATE_STUDY, UPDATE_STUDY } from "../../../Mutations/Study";

import { StyledParticipantPage } from "../../../styles/StyledBuilder";

import InDev from "../../../Global/InDev";
import { participantPageTours } from "./tours";
import { builderHref, isProjectArea } from "../../shared/identity";
import { isStudyLocked } from "../../../../lib/studyLock";

export default function ParticipantPage({ query, user, tab }) {
  const router = useRouter();
  const { t } = useTranslation("builder");
  const { area } = query;
  const selector = query?.selector;
  const projectMode = isProjectArea(area);

  useEffect(() => {
    let currentTour = null;
    let isStartingTour = false;
    
    function handleStartTour(event) {
      const tourId = event?.detail?.tourId || 'overview';
      const tourData = event?.detail?.tourData;
      
      // Prevent multiple tours from starting simultaneously
      if (isStartingTour) {
        console.log('Tour already starting, ignoring request');
        return;
      }
      
      isStartingTour = true;
      
      // Exit any existing tour first
      if (currentTour) {
        currentTour.exit();
        currentTour = null;
      }
      
      (async () => {
        const introJs = (await import('intro.js')).default;
        
        // Use tour data from event if available, otherwise fallback to static import
        let selectedTour = tourData;
        if (!selectedTour) {
          const tours = participantPageTours;
          selectedTour = tours[tourId];
        }
        
        if (!selectedTour) {
          console.error(`Tour ${tourId} not found`);
          isStartingTour = false;
          return;
        }

        // Create new tour instance
        currentTour = introJs.tour();
        currentTour.setOptions({
          steps: selectedTour.steps,
          scrollToElement: false,
          scrollTo: 'off',
          exitOnOverlayClick: true,
          exitOnEsc: true,
          showBullets: true,
        });
        
        // Start the tour
        currentTour.start();

        // Clean up when tour ends
        currentTour.onComplete(() => {
          currentTour = null;
          isStartingTour = false;
        });
        
        currentTour.onExit(() => {
          currentTour = null;
          isStartingTour = false;
        });

      })();
    }
    
    // Remove any existing listeners first
    window.removeEventListener('start-walkthrough-tour', handleStartTour);
    window.addEventListener('start-walkthrough-tour', handleStartTour);
    
    return () => {
      window.removeEventListener('start-walkthrough-tour', handleStartTour);
      // Clean up any existing tour when component unmounts
      if (currentTour) {
        currentTour.exit();
      }
    };
  }, []);

  const { data: projectData } = useQuery(GET_PROJECT_STUDY, {
    variables: { id: selector },
    skip: !projectMode || !selector,
  });
  const { data: studyQueryData } = useQuery(MY_STUDY, {
    variables: { id: selector },
    skip: projectMode || !selector,
  });

  const study = projectMode
    ? projectData?.proposalBoard?.study || {}
    : studyQueryData?.study || {};

  // A submitted study is read-only here too, as in the Study Builder
  const isLocked = isStudyLocked(study, { isClone: area === "cloneofstudy" });

  // Default settings if study doesn't have settings
  const defaultSettings = {
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
  };

  // save and edit the study information. Once the study is in the form, the
  // form stops following the fetched study: the refetch after an auto-save
  // would otherwise drop what was typed while the save was running
  const loadedStudyIdRef = useRef(null);
  const { inputs, handleChange, handleMultipleUpdate, captureFile, clearForm } =
    useForm(
      {
        ...study,
        settings: study?.settings || defaultSettings,
      },
      {
        freezeInitialSync:
          !!study?.id && loadedStudyIdRef.current === study?.id,
      }
    );
  if (inputs?.id && inputs?.id === study?.id) {
    loadedStudyIdRef.current = study.id;
  }

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
        title: `${t('participantPageMain.cloneOf')} ${study?.title}-${rand}`,
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
      selector === "add" &&
      user &&
      user?.permissions.map((p) => p?.name).includes("STUDENT") &&
      user?.studentIn &&
      user?.studentIn?.length
    ) {
      connectToClass();
    }
  }, [user]);

  // A study that does not exist yet (new or clone) is created with the Save
  // button; changes to an existing one are auto-saved
  const isAutoSaveEnabled =
    !isLocked && !!study?.id && area !== "cloneofstudy";

  const inputsRef = useRef(inputs);
  inputsRef.current = inputs;
  const studyRef = useRef(study);
  studyRef.current = study;
  // the image that has been uploaded already, so that later saves do not
  // upload it again while it is still in the form
  const uploadedFileRef = useRef(null);

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
          ? {
              create: {
                keystoneImage: { upload: inputs?.file },
                altText: inputs?.title,
              },
            }
          : null,
        consent: inputs?.consent?.length
          ? { connect: inputs?.consent?.map((cl) => ({ id: cl?.id })) }
          : null,
        talks: {
          create: [
            {
              settings: {
                type: "default",
                title: t('participantPageMain.projectChat'),
              },
            },
          ],
        },
        classes: { connect: inputs?.classes?.map((cl) => ({ id: cl?.id })) },
        flow: inputs?.flow,
        diagram: inputs?.diagram,
      },
    },
    refetchQueries: [{ query: MY_STUDIES, variables: { id: user?.id } }],
  });

  const [updateStudy] = useMutation(UPDATE_STUDY, {
    refetchQueries: projectMode
      ? [{ query: GET_PROJECT_STUDY, variables: { id: selector } }]
      : [{ query: MY_STUDY, variables: { id: selector } }],
  });

  // reads the form when the save runs, not when it was scheduled
  const saveStudyPage = async () => {
    const current = inputsRef.current;
    const savedStudy = studyRef.current;
    const file =
      current?.file && current.file !== uploadedFileRef.current
        ? current.file
        : null;
    await updateStudy({
      variables: {
        id: savedStudy?.id,
        input: {
          title: current?.title,
          slug: current?.slug,
          description: current?.description,
          settings: current?.settings,
          info: current?.info,
          image: file
            ? {
                create: {
                  keystoneImage: { upload: file },
                  altText: current?.title,
                },
              }
            : null,
          consent: current?.consent?.length
            ? { connect: current?.consent.map((c) => ({ id: c?.id })) }
            : { disconnect: savedStudy?.consent?.map((c) => ({ id: c?.id })) },
        },
      },
    });
    if (file) uploadedFileRef.current = file;
  };

  const {
    hasUnsavedChanges: hasStudyChanged,
    saveState,
    saveError,
    markChanged,
    retry: retrySave,
  } = useAutoSave({
    save: saveStudyPage,
    isEnabled: isAutoSaveEnabled,
    // text fields change on every keystroke
    delay: 1500,
  });

  const handleStudyChange = (props) => {
    if (isLocked) return;
    handleChange(props);
    markChanged();
  };

  const handleStudyMultipleUpdate = (props) => {
    if (isLocked) return;
    handleMultipleUpdate(props);
    markChanged();
  };

  const captureStudyFile = async (props) => {
    if (isLocked) return;
    // the image is resized before it is put in the form
    await captureFile(props);
    markChanged();
  };

  // The Save button, shown until the study exists
  const createStudyFromPage = async () => {
    if (isLocked) return;
    const newStudy = await createStudy();
    router.push(
      builderHref({
        area: "studies",
        selector: newStudy?.data?.createStudy?.id,
        tab: "page",
      })
    );
  };

  // another study already uses this url
  const isSlugTaken =
    /unique constraint/i.test(saveError?.message || "") &&
    /slug/i.test(saveError?.message || "");

  const navigationSaveProps = isAutoSaveEnabled
    ? {
        // auto-saved changes only need a warning when saving them failed
        hasStudyChanged: saveState === "error",
        saveStatus: {
          state: saveState,
          errorLabel: isSlugTaken
            ? t(
                "participantPageMain.slugTaken",
                {},
                { default: "This study URL is already taken" }
              )
            : undefined,
          errorMessage: saveError?.message,
          lastSavedAt: study?.updatedAt,
          onRetry: retrySave,
        },
      }
    : {
        saveBtnName: t("participantPageMain.save"),
        saveBtnFunction: createStudyFromPage,
        hasStudyChanged,
      };

  if (!study?.id) {
    return (
      <>
        <Navigation
          proposalId={query?.selector}
          query={query}
          user={user}
          tab={tab}
          {...navigationSaveProps}
        />
        <InDev
          header={t('participantPageMain.noStudyHeader')}
          message={t('participantPageMain.noStudyMessage')}
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
        {...navigationSaveProps}
        isCanvasLocked={isLocked}
      />
      <StyledParticipantPage>
        <Preview
          user={user}
          study={inputs}
          isLocked={isLocked}
          handleChange={handleStudyChange}
          handleMultipleUpdate={handleStudyMultipleUpdate}
          captureFile={captureStudyFile}
        />
        <Settings
          user={user}
          study={inputs}
          isLocked={isLocked}
          handleChange={handleStudyChange}
          handleMultipleUpdate={handleStudyMultipleUpdate}
        />
      </StyledParticipantPage>
    </>
  );
}

ParticipantPage.hasTour = true;
ParticipantPage.tours = participantPageTours;