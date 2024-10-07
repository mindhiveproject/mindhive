import Link from "next/link";
import { useQuery } from "@apollo/client";
import { STUDY_TO_JOIN } from "../../../Queries/Study";
import StudyInfo from "./StudyInfo";

export default function View({ query, user }) {
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

  return (
    <div className="view">
      <div className="h40">Feedback Center</div>
      <div className="h24">
        Whether you're starting your study or collecting participants, use this
        page to review community brainstorms and studies.
      </div>
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
              <div className="p12">STUDY IN PEER REVIEW</div>
            )}
            {study?.status === "SUBMITTED_AS_PROPOSAL" && (
              <div className="p12">PROPOSAL</div>
            )}
            <div className="p12">
              {study?.reviews?.filter((r) => r?.stage == study?.status).length}{" "}
              comment
              {study?.reviews?.filter((r) => r?.stage == study?.status)
                .length !== 1
                ? `s`
                : ``}
            </div>
          </div>

          <div className="title">{study?.title}</div>
          <div>{study?.description}</div>

          <StudyInfo query={query} study={study} canReview={canReview} />
        </div>
      </div>
    </div>
  );
}
