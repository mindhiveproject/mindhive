import { useMutation, useQuery } from "@apollo/client";

import {
  SET_STUDY_DATA_COLLECTION,
  STUDY_DATA_COLLECTION,
} from "../../../Queries/Study";

// Every view that shows a study's data-collection state: the board card, the
// study builder (lock + Settings), the teacher dashboard and the review
// overview. Refetched by name, so only the ones on screen reload.
export const DATA_COLLECTION_REFETCH = [
  "STUDY_DATA_COLLECTION",
  "PROPOSAL_QUERY",
  "MY_STUDY",
  "GET_PROJECT_STUDY",
  "CLASS_DASHBOARD_PROJECTS_QUERY",
  "CLASS_DASHBOARD_STUDIES_QUERY",
  "GET_CLASS",
  "STUDIES_COLLECTING_DATA",
];

/**
 * A study's data-collection state (keystone/lib/studyDataCollection.js) and
 * `run(action, variables)` to change it through setStudyDataCollection.
 * `run` resolves to the new state, or null after showing the error.
 */
export function useStudyDataCollection(studyId, { skip = false } = {}) {
  const { data, loading, error } = useQuery(STUDY_DATA_COLLECTION, {
    variables: { studyId },
    skip: skip || !studyId,
    fetchPolicy: "cache-and-network",
  });
  const [mutate, { loading: saving }] = useMutation(SET_STUDY_DATA_COLLECTION, {
    refetchQueries: DATA_COLLECTION_REFETCH,
    awaitRefetchQueries: true,
  });

  const run = async (action, variables = {}) => {
    try {
      const res = await mutate({
        variables: { studyId, action, ...variables },
      });
      return res?.data?.setStudyDataCollection || null;
    } catch (err) {
      alert(err?.message);
      return null;
    }
  };

  return {
    state: data?.studyDataCollection || null,
    loading,
    error,
    saving,
    run,
  };
}

/** The people sharing the study, other than `userId`. */
export function otherPeople(state, userId) {
  return (state?.people || []).filter((person) => person.id !== userId);
}
