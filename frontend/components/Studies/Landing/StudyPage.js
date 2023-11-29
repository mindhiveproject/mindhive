import Head from "next/head";
import Link from "next/link";
import ReactHtmlParser from "react-html-parser";

import { StyledStudyPage } from "../../styles/StyledStudyPage";

import StudyInfo from "./StudyInfo";

import UserPath from "./UserPath";

export default function StudyPage({ query, user, study, isDashboard }) {
  // check whether the user is the study author or is among collaborators
  const isAuthor =
    study?.author?.id === user?.id ||
    study?.collaborators?.map((c) => c?.id).includes(user?.id);
  // check whether the user joined the study before
  const hasJoined = user?.participantIn
    ?.map((study) => study?.id)
    .includes(study?.id);

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
        </div>

        <div className="studyContent">
          {hasJoined ? (
            <UserPath
              query={query}
              user={user}
              study={study}
              isDashboard={isDashboard}
              path={path}
            />
          ) : (
            <>
              {isAuthor ? (
                <Link
                  href={{
                    pathname: `/join/details`,
                    query: {
                      id: study?.id,
                      step: `select`,
                      guest: `true`,
                    },
                  }}
                >
                  <div className="controlBtns">
                    <button>Participate as a guest</button>
                  </div>
                </Link>
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
            </>
          )}
        </div>
      </div>
    </StyledStudyPage>
  );
}
