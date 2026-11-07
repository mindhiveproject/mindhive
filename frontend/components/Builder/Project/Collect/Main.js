import { useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import { StyledCollectPage } from "../../../styles/StyledBuilder";

import { GET_STUDY_COLLECT_DATA } from "../../../Queries/User";
import { GET_STUDY_RESULTS } from "../../../Queries/Study";

import Navigation from "../Navigation/Main";
import ParticipantPage from "./Participant/Main";
import Table from "./Table/Main";

export default function Collect({ query, user, tab, studyId }) {
  const { t } = useTranslation("builder");
  const participantId = query?.id;
  const { type } = query;

  if (!studyId) {
    return <div>{t("collect.noStudyFound", "No study found, please save your study first.")}</div>;
  }

  const {
    data: collectData,
    loading: collectLoading,
    error: collectError,
  } = useQuery(GET_STUDY_COLLECT_DATA, {
    variables: { studyId: studyId },
  });
  const users = collectData?.studyCollectData?.participants || [];
  const guests = collectData?.studyCollectData?.guests || [];

  const {
    data: studyData,
    loading: studyLoading,
    error: studyError,
  } = useQuery(GET_STUDY_RESULTS, {
    variables: { id: studyId },
  });
  const study = studyData?.study || { participants: [], guests: [] };

  // find all tests in the study with recursive search
  var components = [];
  const findComponents = ({ flow, conditionLabel }) => {
    flow?.forEach((stage) => {
      if (stage?.type === "my-node") {
        components.push({
          // the flow node id, which is what the data source recorder keys its
          // per-step aggregate windows on
          id: stage?.id,
          testId: stage?.testId,
          name: stage?.name,
          subtitle: stage?.subtitle,
          conditionLabel,
        });
      }
      if (stage?.type === "design") {
        stage?.conditions?.forEach((condition) => {
          findComponents({
            flow: condition?.flow,
            conditionLabel: condition?.label,
          });
        });
      }
    });
  };
  findComponents({ flow: study?.flow });

  return (
    <>
      <Navigation
        proposalId={query?.selector}
        query={query}
        user={user}
        tab={tab}
      />
      <StyledCollectPage>
        {participantId ? (
          <ParticipantPage
            query={query}
            study={study}
            components={components}
            participantId={participantId}
            type={type}
          />
        ) : collectError || studyError ? (
          <div>
            {t(
              "collect.loadError",
              "The study's data could not be loaded. If you work on this study and see this message, please contact tech support at support.mindhive@nyu.edu."
            )}
          </div>
        ) : (
          <Table
            query={query}
            study={study}
            components={components}
            users={users}
            guests={guests}
            loading={collectLoading || studyLoading}
          />
        )}
      </StyledCollectPage>
    </>
  );
}
