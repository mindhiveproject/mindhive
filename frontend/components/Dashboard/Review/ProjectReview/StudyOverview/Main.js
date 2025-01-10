import Head from "next/head";
import ReactHtmlParser from "react-html-parser";
import StudyInfo from "./StudyInfo";

export default function StudyPreview({ study, user }) {
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
            <div className="p17">STUDY IN PEER REVIEW</div>
          )}
          {study?.status === "SUBMITTED_AS_PROPOSAL" && (
            <div className="p17">PROPOSAL</div>
          )}

          <div className="h28"> {study?.title}</div>
          <div className="studyDescription">
            <h3>{ReactHtmlParser(study?.description)}</h3>
          </div>

          {canReview || true ? (
            <StudyInfo user={user} study={study} />
          ) : (
            <div className="noStudyDetailsContainer">
              <div className="p18">You cannot view this section yet</div>
              <div>
                To access this section, you must review or participate in the
                study once it moves beyond the proposal phase.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
