import { useQuery, useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import generate from "project-name-generator";

import useForm from "../../../../lib/useForm";

import { MY_STUDIES, MY_STUDY } from "../../../Queries/Study";
import { CREATE_STUDY, UPDATE_STUDY } from "../../../Mutations/Study";

import Router from "./Router";

export default function Builder({ query, user, tab, toggleSidebar }) {
  const router = useRouter();
  const { area } = query;
  const studyId = query?.selector;

  const { data, error, loading } = useQuery(MY_STUDY, {
    variables: { id: studyId },
  });
  const study = data?.study || {};

  // save and edit the study information
  const { inputs, handleChange } = useForm({
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
    },
    refetchQueries: [{ query: MY_STUDY, variables: { id: studyId } }],
  });

  const saveStudy = async ({
    flow,
    diagram,
    descriptionInProposalCardId,
    tags,
  }) => {
    if (studyId === "add" || area === "cloneofstudy") {
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
                { settings: { type: "default", title: "Project chat" } },
              ],
            },
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
          },
        },
      });
    }
  };

  if (!studyId) {
    return <div>No study found, please save your study first.</div>;
  }

  return (
    <Router
      query={query}
      user={user}
      tab={tab}
      study={inputs}
      handleChange={handleChange}
      saveStudy={saveStudy}
      toggleSidebar={toggleSidebar}
    />
  );
}
