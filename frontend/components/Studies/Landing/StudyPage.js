import Head from "next/head";
import Link from "next/link";
import ReactHtmlParser from "react-html-parser";
import useTranslation from "next-translate/useTranslation";

import { StyledStudyPage } from "../../styles/StyledStudyPage";

import StudyInfo from "./StudyInfo";

import UserPath from "./UserPath";
import { getStudyImageUrl } from "../../../lib/profileStudyImageUrls";
import Button from "../../DesignSystem/Button";
import MessageCard from "../../DesignSystem/MessageCard";

export default function StudyPage({ query, user, study, isDashboard }) {
  const { t } = useTranslation("builder");
  
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

  // A study submitted (or finished) through its class milestone that the
  // researcher closed: participants see the button disabled. Self-managed
  // studies are not gated, as their participation flag starts closed.
  const closedForParticipation =
    ["SUBMITTED", "FINISHED"].includes(study?.dataCollectionStatus) &&
    !study?.dataCollectionOpenForParticipation;

  const imageURL = getStudyImageUrl(study);

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
                    <Button variant="filled">
                      {t("participateAsGuest", {}, { default: "Participate as a guest" })}
                    </Button>
                  </div>
                </Link>
              ) : closedForParticipation ? (
                <>
                  <div className="controlBtns">
                    <Button variant="filled" disabled>
                      {t("participate", {}, { default: "Participate" })}
                    </Button>
                  </div>
                  <MessageCard
                    variant="information"
                    message={t("studyClosedForParticipation", {}, {
                      default:
                        "This study has been closed for participation by the researcher.",
                    })}
                  />
                </>
              ) : (
                <Link
                  href={{
                    pathname: `/join/select`,
                    query: { id: study?.id },
                  }}
                >
                  <div className="controlBtns">
                    <Button variant="filled">
                      {t("participate", {}, { default: "Participate" })}
                    </Button>
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
