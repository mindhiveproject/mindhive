import { useQuery } from "@apollo/client";

import Navigation from "../Navigation/Main";
import Preprocessor from "./Preprocessor";

import { STUDY_SUMMARY_RESULTS } from "../../../Queries/SummaryResult";

import { StyledVisualizePage } from "../../../styles/StyledBuilder";

export default function Visualize({ query, user, tab }) {
  const studyId = query?.selector;
  const participantId = query?.id;

  // get the summary data of a specific study
  const { data, loading, error } = useQuery(STUDY_SUMMARY_RESULTS, {
    variables: { studyId },
  });

  const summaryResults = data?.summaryResults || [];

  if (!studyId) {
    return <div>No study found, please save your study first.</div>;
  }

  return (
    <>
      <Navigation query={query} user={user} tab={tab} />
      <StyledVisualizePage>
        <Preprocessor studyId={studyId} data={summaryResults} user={user} />
      </StyledVisualizePage>
    </>
  );
}
