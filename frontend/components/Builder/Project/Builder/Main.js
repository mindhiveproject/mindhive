import { useQuery, useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import { useEffect } from 'react';
import generate from "project-name-generator";
import useTranslation from "next-translate/useTranslation";

import useForm from "../../../../lib/useForm";

// import { MY_STUDIES, MY_STUDY } from "../../../Queries/Study";
import { CREATE_STUDY, UPDATE_STUDY } from "../../../Mutations/Study";

import { GET_PROJECT_STUDY } from "../../../Queries/Proposal";

import Router from "./Router";

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
  useEffect(() => {
    function handleStartTour() {
      (async () => {
        const introJs = (await import('intro.js')).default;
        introJs.tour().setOptions({
          steps: [
            {
              element: '#menue',
              intro: "Use this menu to switch between different components of your project.",
              position: "auto",
              disableInteraction: false
            },
            {
              element: '#canvas',
              intro: "This is your study builder canvas. Here you can drag and drop blocks to create your study.",
              position: "auto",
              disableInteraction: false
            },
            {
              element: '#commentButton',
              intro: "You can add comments to your study here.<br><br> Use this to discuss your study with your collaborators, teachers, and mentors.",
              position: "auto",
              disableInteraction: false
            },
            {
              element: '#sidepanel',
              intro: "This side panel contains all the necessary to build your study.<br><br>Let's explore each tab one by one.",
              position: "auto",
              disableInteraction: false,
            },
            {
              element: '#addBlock',
              intro: "Click here to see the blocks you can use in your study.",
              position: "auto",
              disableInteraction: false,
            },
            {
              element: '#search',
              intro: "You can search for blocks here ...",
              position: "auto",
              disableInteraction: false
            },
            {
              element: '#createdBy',
              intro: "... and filter the blocks by created by here.<br><br>Make sure to select 'Owned by me' to see the blocks you have created yourself.",
              position: "auto",
              disableInteraction: false
            },
            {
              element: '#blocksMenu',
              intro: "This is the menu of blocks you can use in your study.<ul><li>Basic Blocks: These are blocks offering a fully customizable experience for your participants.</li><li>Tasks: Use tasks to measure participant's behavior.</li><li>Survey: Employ these questionnaires to collect data from your participants.</li><li>Study design: Select a block from this category to control your study design, for example, when creating a between-subjects design.</li><li>Templates: Here you can find the same pre-made study that are in the Discover Area.</li></ul>",
              position: "auto",
              disableInteraction: false
            },
            {
              element: '#board',
              intro: "Let's try!<br>Add a block to your canvas:<br><br><img src='/assets/develop/add-block-to-study-builder.gif' alt='add block to canvas' style='max-width: 100%; height: auto;'><br><br>Press 'Next' once you have added a block.",
              position: "auto",
              disableInteraction: false
            },
            {
              element: '#block',
              intro: "Nice! Now that you have added a block, you can do the following actions ...<br>If you haven't, go back one step and add a block again.",
              position: "top",
              disableInteraction: false
            },
            {
              element: '#blockSettings',
              intro: 'You can click on this gear button to change the settings of your block (displayed language and other parameters)',
              position: "top",
              disableInteraction: false
            },
            {
              element: '#blockInfo',
              intro: 'You can click on this exlamation point button to <ul><li>learn more about what you can use this block for</li><li>See what variable it collects and what they represent</li><li>Find additional ressources</li><ul>',
              position: "top",
              disableInteraction: false
            },
            {
              element: '#blockPlay',
              intro: 'You can click on this play button to preview the block (tip: make sure you test your block after changing its settings!)',
              position: "top",
              disableInteraction: false
            },
            {
              element: '#sidepanel',
              intro: "Now, scroll back to the top of the side panel to continue exploring.",
              position: "auto",
              disableInteraction: false,
            },
            {
              element: '#flow',
              intro: "Now click on 'Study flow' to verify that your study is structured as you expect.<br><br>If you are not happy with the structure, you can always go back and change it.",
              position: "auto",
              disableInteraction: false
            },
            {
              element: '#studyFlow',
              intro: "Here you can see each of the condition that you have created.<br><br>You can see under each condition column the blocks that are part of it.",
              position: "auto",
              disableInteraction: false
            },
            {
              element: '#firstLine',
              intro: "Here you can see the probability that each condition has to be selected.<br><br>Hover the mouse over the condition to read an explanation of the probability.",
              position: "auto",
              disableInteraction: false
            },
            {
              element: '#taskBlocks',
              intro: "This is where you find the blocks that are part of the condition.",
              position: "auto",
              disableInteraction: false
            },
            {
              element: '#studySettings',
              intro: "Now, let's go to the study settings tab to configure the study.",
              position: "auto",
              disableInteraction: false
            },
          ],
          scrollToElement: false,
          scrollTo: 'off',
        }).start();
      })();
    }
    window.addEventListener('start-walkthrough-tour', handleStartTour);
    return () => window.removeEventListener('start-walkthrough-tour', handleStartTour);
  }, []);

  const saveStudy = async ({
    flow,
    diagram,
    descriptionInProposalCardId,
    tags,
    status,
    currentVersion,
    versionHistory,
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
            status,
            currentVersion,
            versionHistory,
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
      updateStudy({
        variables: {
          input: {
            flow,
            diagram,
            descriptionInProposalCard: descriptionInProposalCardId
              ? { connect: { id: descriptionInProposalCardId } }
              : null,
            tags: tags?.length ? { set: tags } : { set: [] },
            status,
            currentVersion,
            versionHistory,
          },
        },
      });
    }
  };

  if (!projectId) {
    return <div>{t("main.noProjectFound", "No project found, please save your project first.")}</div>;
  }

  if (loading) return <div>{t("main.loadingStudy", "Loading study...")}</div>;
  if (error) return <div>{t("main.errorLoadingStudy", "Error loading study: {{errorMessage}}", { errorMessage: error.message })}</div>;

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
