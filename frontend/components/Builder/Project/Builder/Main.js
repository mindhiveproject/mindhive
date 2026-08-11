import { useQuery, useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import { useEffect } from 'react';
import generate from "project-name-generator";
import useTranslation from "next-translate/useTranslation";

import useForm from "../../../../lib/useForm";
import useStudyVersionSnapshot from "../../../../lib/useStudyVersionSnapshot";

// import { MY_STUDIES, MY_STUDY } from "../../../Queries/Study";
import { CREATE_STUDY, UPDATE_STUDY } from "../../../Mutations/Study";

import { GET_PROJECT_STUDY } from "../../../Queries/Proposal";

import Router, { BuilderLoading } from "./Router";
import { builderTours } from "./tours";

export default function Builder({ query, user, tab, toggleSidebar }) {
  const { t } = useTranslation("builder");
  const router = useRouter();
  const { area } = query;
  const projectId = query?.selector;

  const { data, error, loading } = useQuery(GET_PROJECT_STUDY, {
    variables: { id: projectId },
  });

  const project = data?.proposalBoard || {};
  const study = data?.proposalBoard?.study || {};

  // save and edit the study information
  const { inputs, handleChange, handleMultipleUpdate } = useForm({
    ...study,
  });

  const [
    createStudy,
    {
      data: createStudyData,
      loading: createStudyLoading,
      error: createStudyError,
    },
  ] = useMutation(CREATE_STUDY, {
    // refetchQueries: [{ query: MY_STUDIES, variables: { id: user?.id } }],
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
    },
    refetchQueries: [
      { query: GET_PROJECT_STUDY, variables: { id: projectId } },
    ],
  });

  const snapshotStudy = useStudyVersionSnapshot({ user });

  useEffect(() => {
    let currentTour = null;
    let isStartingTour = false;
    
    function handleStartTour(event) {
      const tourId = event?.detail?.tourId || 'overview';
      const tourData = event?.detail?.tourData;
      console.log(event)
      
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
          const tours = builderTours;
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

  const saveStudy = async ({
    flow,
    diagram,
    descriptionInProposalCardId,
    tags,
    status,
  }) => {
    if (projectId === "add" || area === "cloneofstudy") {
      const newStudy = await createStudy({
        variables: {
          input: {
            flow,
            diagram,
            descriptionInProposalCard: descriptionInProposalCardId
              ? { connect: { id: descriptionInProposalCardId } }
              : null,
            tags: tags?.length ? { connect: tags } : null,
            title: generate().dashed,
            talks: {
              create: [
                { settings: { type: "default", title: t("main.projectChat", "Project chat") } },
              ],
            },
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
            status,
          },
        },
      });
      router.push({
        pathname: `/builder/studies/`,
        query: {
          selector: newStudy?.data?.createStudy?.id,
        },
      });
    } else {
      // Store the design as a new version. A problem here must never stop the
      // study itself from being saved, so the failure is reported and the save
      // continues: the next save compares the canvas with the same version
      // again and stores it then.
      let newVersionId = null;
      try {
        newVersionId = await snapshotStudy({
          studyId: study?.id,
          diagram,
          flow,
        });
      } catch (error) {
        console.error("The study version could not be stored", error);
      }

      // The data collection version is stamped on every collected dataset and
      // keys the participant data-policy consent, so it only follows the
      // snapshots while no data has been collected yet.
      const shouldAdvanceCollectionVersion =
        newVersionId &&
        (!study?.currentVersion ||
          study?.dataCollectionStatus === "NOT_STARTED");

      await updateStudy({
        variables: {
          input: {
            flow,
            diagram,
            descriptionInProposalCard: descriptionInProposalCardId
              ? { connect: { id: descriptionInProposalCardId } }
              : null,
            tags: tags?.length ? { set: tags } : { set: [] },
            status,
            ...(shouldAdvanceCollectionVersion
              ? { currentVersion: newVersionId }
              : {}),
          },
        },
      });
    }
  };

  if (!projectId) {
    return <div>{t("main.noProjectFound", "No project found, please save your project first.")}</div>;
  }

  if (loading) return <BuilderLoading />;
  if (error) return <div>{t("main.errorLoadingStudy", "Error loading study: {{errorMessage}}", { errorMessage: error.message })}</div>;

  // The builder gets the form state, which useForm only fills in from the
  // loaded study in an effect, one commit after the query resolves. The canvas
  // is built once when the engine mounts, so mounting it in that first commit
  // would build it from an empty study and leave it showing the starting point
  // only. Wait until the form state has caught up with the loaded study.
  if (study?.id && inputs?.id !== study?.id) {
    return <BuilderLoading />;
  }

  return (
    <Router
      query={query}
      user={user}
      tab={tab}
      study={inputs}
      project={project}
      handleChange={handleChange}
      handleMultipleUpdate={handleMultipleUpdate}
      saveStudy={saveStudy}
      toggleSidebar={toggleSidebar}
    />
  );
}

Builder.hasTour = true;
