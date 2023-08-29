import { useQuery } from "@apollo/client";
import Head from "next/head";
import Link from "next/link";
import ReactHtmlParser from "react-html-parser";

import { StyledStudyPage } from "../../styles/StyledStudyPage";

import StudyInfo from "./StudyInfo";

import { GET_USER_STUDIES } from "../../Queries/User";
import TaskCard from "./TaskCard";

export default function StudyPage({ query, user, study, isDashboard }) {
  const { data: userData } = useQuery(GET_USER_STUDIES);

  const studiesInfo = userData?.authenticatedItem?.studiesInfo || {};
  const participantInfo = studiesInfo[study?.id];
  const path = participantInfo?.info?.path || [];

  const imageURL = study?.image?.image?.publicUrlTransformed;
  // pathname for participants
  const pathname = "/participate/select";
  return (
    <StyledStudyPage>
      <Head>
        <title>MindHive | {study?.title}</title>
      </Head>

      <div>
        {imageURL && (
          <div className="studyImage">
            <img src={imageURL} alt={study?.title} />
          </div>
        )}

        <div className="studyTitleDescriptionBtns">
          <h1>{study?.title}</h1>
          <div className="studyDescription">
            <h3>{ReactHtmlParser(study?.description)}</h3>
          </div>

          <StudyInfo
            query={query}
            user={user}
            study={study}
            isDashboard={isDashboard}
          />

          {participantInfo ? (
            <div>
              {path
                .filter((step) => step?.type === "task")
                .map((step, num) => (
                  <TaskCard key={num} step={step} study={study} />
                ))}
            </div>
          ) : (
            <Link
              href={{
                pathname,
                query: { id: study.id },
              }}
            >
              <div className="controlBtns">
                <button>Participate</button>
              </div>
            </Link>
          )}
        </div>
      </div>
    </StyledStudyPage>
  );
}
