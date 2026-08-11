import { useQuery, useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import generate from "project-name-generator";

import useForm from "../../../../lib/useForm";
import useStudyVersionSnapshot from "../../../../lib/useStudyVersionSnapshot";

import { MY_STUDIES, MY_STUDY } from "../../../Queries/Study";
import { CREATE_STUDY, UPDATE_STUDY } from "../../../Mutations/Study";

import Router, { BuilderLoading } from "./Router";

export default function Builder({ query, user, tab, toggleSidebar }) {
  const router = useRouter();
  const { area } = query;
  const studyId = query?.selector;

  const { data, error, loading } = useQuery(MY_STUDY, {
    variables: { id: studyId },
  });
  const study = data?.study || {};

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

  const snapshotStudy = useStudyVersionSnapshot({ user });

  const saveStudy = async ({
    flow,
    diagram,
    descriptionInProposalCardId,
    tags,
    status,
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
      // versions while no data has been collected yet.
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

  if (!studyId) {
    return <div>No study found, please save your study first.</div>;
  }

  // The canvas is built once, when the engine mounts, so the study has to be
  // loaded first: otherwise the builder starts on an empty canvas and saving
  // would overwrite the study design with it.
  if (loading) return <BuilderLoading />;
  if (error) return <div>Error loading study: {error.message}</div>;

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
      handleChange={handleChange}
      handleMultipleUpdate={handleMultipleUpdate}
      saveStudy={saveStudy}
      toggleSidebar={toggleSidebar}
    />
  );
}
