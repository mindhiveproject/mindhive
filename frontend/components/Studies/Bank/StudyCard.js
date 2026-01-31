import Link from "next/link";
import useTranslation from "next-translate/useTranslation";

import { StyledStudyCard } from "../../styles/StyledCard";
import StudyOptions from "./StudyOptions";

export default function StudyCard({ user, study, url, id, name, studiesInfo }) {
  const { t } = useTranslation("builder");
  const imageURL = study?.image?.image?.publicUrlTransformed;

  const linkHref = user
    ? { pathname: url, query: { [name]: study[id] } }
    : { pathname: url };

  return (
    <StyledStudyCard>
      {studiesInfo && (
        <StudyOptions user={user} study={study} studiesInfo={studiesInfo} />
      )}
      <Link href={linkHref}>
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
            {study?.author?.username && (
              <span>{t("createdBy", { username: study.author.username })}</span>
            )}
          </div>
        </div>
      </Link>
    </StyledStudyCard>
  );
}
