import Link from "next/link";

import { StyledStudyCard } from "../../styles/StyledCard";
// import StudyOptions from "./StudyOptions";

export default function ProjectCard({
  user,
  study,
  url,
  id,
  name,
  studiesInfo,
}) {
  const imageURL = study?.image?.image?.publicUrlTransformed;

  return (
    <StyledStudyCard>
      {/* {studiesInfo && (
        <StudyOptions user={user} study={study} studiesInfo={studiesInfo} />
      )} */}
      {user ? (
        <Link
          href={{
            pathname: url,
            query: { [name]: study[id] },
          }}
        >
          <div className="studyImage">
            {imageURL ? (
              <img src={imageURL} alt={study?.title} />
            ) : (
              <div className="noImage"></div>
            )}
          </div>
          <div className="cardInfo">
            <div className="studyHeader">
              <h2>{study.title}</h2>
              <span>created by {study?.author?.username}</span>
            </div>
          </div>
        </Link>
      ) : (
        <Link
          href={{
            pathname: url,
          }}
        >
          <div className="studyImage">
            {imageURL ? (
              <img src={imageURL} alt={study?.title} />
            ) : (
              <div className="noImage"></div>
            )}
          </div>
          <div className="cardInfo">
            <div className="studyHeader">
              <h2>{study.title}</h2>
            </div>
          </div>
        </Link>
      )}
    </StyledStudyCard>
  );
}
