import { useQuery, useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import { useEffect } from "react";
import generate from "project-name-generator";
import useTranslation from "next-translate/useTranslation";

import useForm from "../../../../lib/useForm";
import useStudyVersionSnapshot from "../../../../lib/useStudyVersionSnapshot";

import { CREATE_STUDY, UPDATE_STUDY } from "../../../Mutations/Study";
import { UPDATE_PROJECT_BOARD } from "../../../Mutations/Proposal";
import { GET_PROJECT_STUDY } from "../../../Queries/Proposal";
import { MY_STUDIES, MY_STUDY } from "../../../Queries/Study";
import { builderHref, isProjectArea } from "../../shared/identity";

import Router, { BuilderLoading } from "./Router";
import { builderTours } from "./tours";

export default function Builder({ query, user, tab, toggleSidebar }) {
  const { t } = useTranslation("builder");
  const router = useRouter();
  const { area } = query;
  const selector = query?.selector;
  const projectMode = isProjectArea(area);

  const {
    data: projectData,
    error: projectError,
    loading: projectLoading,
  } = useQuery(GET_PROJECT_STUDY, {
    variables: { id: selector },
    skip: !projectMode || !selector,
  });

  const { data: studyData, error: studyError, loading: studyLoading } = useQuery(
    MY_STUDY,
    {
      variables: { id: selector },
      skip: projectMode || !selector,
    }
  );

  const project = projectData?.proposalBoard || {};
  const study = projectMode
    ? projectData?.proposalBoard?.study || {}
    : studyData?.study || {};
  const loading = projectMode ? projectLoading : studyLoading;
  const error = projectMode ? projectError : studyError;

  const { inputs, handleChange, handleMultipleUpdate } = useForm({
    ...study,
  });

  const [createStudy] = useMutation(CREATE_STUDY, {
    refetchQueries: [{ query: MY_STUDIES, variables: { id: user?.id } }],
  });

  const [updateProject] = useMutation(UPDATE_PROJECT_BOARD);

  const [updateStudy] = useMutation(UPDATE_STUDY, {
    variables: {
      id: study?.id,
    },
    refetchQueries: projectMode
      ? [{ query: GET_PROJECT_STUDY, variables: { id: selector } }]
      : [{ query: MY_STUDY, variables: { id: selector } }],
  });

  const snapshotStudy = useStudyVersionSnapshot({ user });

  useEffect(() => {
    let currentTour = null;
    let isStartingTour = false;

    function handleStartTour(event) {
      const tourId = event?.detail?.tourId || "overview";
      const tourData = event?.detail?.tourData;

      if (isStartingTour) {
        return;
      }

      isStartingTour = true;

      if (currentTour) {
        currentTour.exit();
        currentTour = null;
      }

      (async () => {
        const introJs = (await import("intro.js")).default;

        let selectedTour = tourData;
        if (!selectedTour) {
          selectedTour = builderTours[tourId];
        }

        if (!selectedTour) {
          console.error(`Tour ${tourId} not found`);
          isStartingTour = false;
          return;
        }

        currentTour = introJs.tour();
        currentTour.setOptions({
          steps: selectedTour.steps,
          scrollToElement: false,
          scrollTo: "off",
          exitOnOverlayClick: true,
          exitOnEsc: true,
          showBullets: true,
        });

        currentTour.start();

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

    window.removeEventListener("start-walkthrough-tour", handleStartTour);
    window.addEventListener("start-walkthrough-tour", handleStartTour);

    return () => {
      window.removeEventListener("start-walkthrough-tour", handleStartTour);
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
    const shouldCreate =
      selector === "add" || area === "cloneofstudy" || (projectMode && !study?.id);

    if (shouldCreate) {
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
                {
                  settings: {
                    type: "default",
                    title: t("main.projectChat", "Project chat"),
                  },
                },
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
      const newStudyId = newStudy?.data?.createStudy?.id;
      if (projectMode && selector && newStudyId) {
        await updateProject({
          variables: {
            id: selector,
            input: { study: { connect: { id: newStudyId } } },
          },
          refetchQueries: [
            { query: GET_PROJECT_STUDY, variables: { id: selector } },
          ],
        });
        return;
      }
      router.push(
        builderHref({
          area: "studies",
          selector: newStudyId,
          tab: "builder",
        })
      );
      return;
    }

    let newVersionId = null;
    try {
      newVersionId = await snapshotStudy({
        studyId: study?.id,
        diagram,
        flow,
      });
    } catch (snapshotError) {
      console.error("The study version could not be stored", snapshotError);
    }

    const shouldAdvanceCollectionVersion =
      newVersionId &&
      (!study?.currentVersion || study?.dataCollectionStatus === "NOT_STARTED");

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
  };

  if (!selector) {
    return (
      <div>
        {projectMode
          ? t(
              "main.noProjectFound",
              "No project found, please save your project first."
            )
          : t(
              "main.noStudyFound",
              "No study found, please save your study first."
            )}
      </div>
    );
  }

  if (loading) return <BuilderLoading />;
  if (error)
    return (
      <div>
        {t("main.errorLoadingStudy", "Error loading study: {{errorMessage}}", {
          errorMessage: error.message,
        })}
      </div>
    );

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
