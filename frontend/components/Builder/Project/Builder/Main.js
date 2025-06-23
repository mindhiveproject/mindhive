import { useQuery, useMutation } from "@apollo/client";
import { useRouter } from "next/router";
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
