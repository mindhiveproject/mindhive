import { useQuery } from "@apollo/client";
import Head from "next/head";
import Link from "next/link";
import ReactHtmlParser from "react-html-parser";

import { StyledStudyPage } from "../../styles/StyledStudyPage";

import StudyInfo from "./StudyInfo";

// import { GET_USER_STUDIES } from "../../Queries/User";
import UserPath from "./UserPath";

export default function StudyPage({ query, user, study, isDashboard }) {
  // const { data: userData } = useQuery(GET_USER_STUDIES);

  // console.log({ userData });

  // check whether the user joined the study before
  const hasJoined = user?.participantIn?.map(study => study?.id).includes(study?.id);
  // console.log({ hasJoined });

  // check which path the user has taken
  const studiesInfo = user?.studiesInfo || {};
  const participantInfo = studiesInfo[study?.id];
  const path = participantInfo?.info?.path || [];

  const imageURL = study?.image?.image?.publicUrlTransformed;

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

          {hasJoined ? (
            <UserPath 
              query={query}
              user={user}
              study={study}
              isDashboard={isDashboard}
              path={path} 
            />
          ) : (
            <Link
              href={{
                pathname: `/join/select`,
                query: { id: study?.id },
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
