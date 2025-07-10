import Link from "next/link";
import { useQuery } from "@apollo/client";
import { STUDY_TO_JOIN } from "../../../Queries/Study";
import StudyInfo from "./StudyInfo";
import useTranslation from "next-translate/useTranslation";

export default function View({ query, user }) {
  const { t } = useTranslation("builder");
  const { id } = query;

  const { data, error, loading } = useQuery(STUDY_TO_JOIN, {
    variables: { id: id },
  });

  const study = data?.study || {};
  const imageURL = study?.image?.image?.publicUrlTransformed;

  const permissions = user?.permissions?.map((p) => p?.name);
  // A user can review if the user has mentor, teacher, or scientist permission or if
  // the study is in the review stage
  const canReview =
    permissions.includes("MENTOR") ||
    permissions.includes("TEACHER") ||
    permissions.includes("SCIENTIST") ||
    study?.status === "IN_REVIEW";

  const commentCount = study?.reviews?.filter((r) => r?.stage == study?.status).length;

  return (
    <div className="view">
      <div className="h40">{t("review.feedbackCenter")}</div>
      <div className="h24">{t("review.intro")}</div>
      <div className="studyArea">
        <div className="closeBtn">
          <Link href={`/dashboard/review/`}>
            <img src="/assets/icons/review/close.svg" />
          </Link>
        </div>

        <div className="studyImage">
          {imageURL ? (
            <img src={imageURL} alt={study?.title} />
          ) : (
            <div className="noImage"></div>
          )}
        </div>
        <div className="studyInfo">
          <div className="topLine">
            {study?.status === "IN_REVIEW" && (
              <div className="p12">{t("review.studyInPeerReview")}</div>
            )}
            {study?.status === "SUBMITTED_AS_PROPOSAL" && (
              <div className="p12">{t("review.proposal")}</div>
            )}
            {study?.status === "COLLECTING_DATA" && (
              <div className="p12">{t("review.collectingData")}</div>
            )}
            {study?.status !== "COLLECTING_DATA" && (
              <div className="p12">
                {commentCount} {t("review.comment", { count: commentCount })}
              </div>
            )}
          </div>

          <div className="title">{study?.title}</div>
          <div>{study?.description}</div>

          <StudyInfo query={query} study={study} canReview={canReview} />
        </div>
      </div>
    </div>
  );
}
