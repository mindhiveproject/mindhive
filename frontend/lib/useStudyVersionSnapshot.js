import { useApolloClient, useMutation } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import { CREATE_STUDY_VERSION } from "../components/Mutations/StudyVersion";
import { LATEST_STUDY_VERSION } from "../components/Queries/StudyVersion";

// Stores the study design as a new version every time it is saved with a
// changed diagram. Shared by the study builders, so that both save paths keep
// the same version history.
export default function useStudyVersionSnapshot({ user }) {
  const { t } = useTranslation("builder");
  const apolloClient = useApolloClient();

  const [createStudyVersion] = useMutation(CREATE_STUDY_VERSION, {
    // refetch by name, so that the list of versions is only reloaded when the
    // settings panel showing it is open
    refetchQueries: ["STUDY_VERSIONS"],
  });

  // Returns the id of the version that has been created, or null when the
  // design has not changed and the existing versions stay as they are.
  return async ({ studyId, diagram, flow }) => {
    if (!studyId || !diagram) return null;

    const { data: latest } = await apolloClient.query({
      query: LATEST_STUDY_VERSION,
      variables: { studyId },
      fetchPolicy: "network-only",
    });

    const [latestVersion] = latest?.studyVersions || [];
    if (latestVersion?.diagram === diagram) return null;

    // continue counting from the most recent version, so that deleting a
    // version in the middle does not hand out a name that is already taken.
    // Renamed versions fall back to the number of versions.
    const latestNumber = /^\D*(\d+)\s*$/.exec(latestVersion?.name || "");
    const versionNumber = latestNumber
      ? Number(latestNumber[1]) + 1
      : (latest?.studyVersionsCount || 0) + 1;

    const { data: created } = await createStudyVersion({
      variables: {
        input: {
          study: { connect: { id: studyId } },
          name: t(
            "version.autoName",
            { number: versionNumber },
            { default: "Version {{number}}" }
          ),
          diagram,
          flow,
          createdBy: user?.id ? { connect: { id: user?.id } } : null,
        },
      },
    });

    return created?.createStudyVersion?.id || null;
  };
}
