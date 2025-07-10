import Head from "next/head";
import ReactHtmlParser from "react-html-parser";
import StudyInfo from "./StudyInfo";
import useTranslation from "next-translate/useTranslation";

export default function StudyPreview({ study, user }) {
  const { t } = useTranslation("builder");
  const permissions = user?.permissions?.map((p) => p?.name);
  // Students should be able to view the feedback, but they cannot provide reviews for the proposal page
  const canReview =
    permissions.includes("MENTOR") ||
    permissions.includes("TEACHER") ||
    permissions.includes("SCIENTIST") ||
    study?.status === "IN_REVIEW";
  const imageURL = study?.image?.image?.publicUrlTransformed;

  return (
    <div className="studyPage">
      <Head>
        <title>MindHive | {study?.title}</title>
      </Head>

      <div>
        <div className="imageContainer">
          {imageURL && (
            <div className="studyImage">
              <img src={imageURL} alt={study?.title} />
            </div>
          )}
        </div>

        <div className="studyInformation">
          {study?.status === "IN_REVIEW" && (
            <div className="p17">{t("review.studyInPeerReview")}</div>
          )}
          {study?.status === "SUBMITTED_AS_PROPOSAL" && (
            <div className="p17">{t("review.proposal")}</div>
          )}

          <div className="h28"> {study?.title}</div>
          <div className="studyDescription">
            <h3>{ReactHtmlParser(study?.description)}</h3>
          </div>

          {canReview || true ? (
            <StudyInfo user={user} study={study} />
          ) : (
            <div className="noStudyDetailsContainer">
              <div className="p18">{t("reviewDetail.cannotViewSection")}</div>
              <div>
                {t("reviewDetail.cannotViewSectionDescription")}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
