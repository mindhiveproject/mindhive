import Link from "next/link";
import useTranslation from "next-translate/useTranslation";

import { StyledStudyCard } from "../../styles/StyledCard";
import ProjectOptions from "./ProjectOptions";

export default function ProjectCard({
  user,
  project,
  url,
  id,
  name,
  projectsInfo,
}) {
  const { t } = useTranslation("builder");
  const imageURL = project?.image?.image?.publicUrlTransformed;

  return (
    <StyledStudyCard>
      <ProjectOptions
        user={user}
        project={project}
        projectsInfo={projectsInfo}
      />

      {user ? (
        <Link
          href={{
            pathname: url,
            query: { [name]: project[id] },
          }}
        >
          <div className="studyImage">
            {imageURL ? (
              <img src={imageURL} alt={project?.title} />
            ) : (
              <div className="noImage"></div>
            )}
          </div>
          <div className="cardInfo">
            <div className="studyHeader">
              <h2>{project.title}</h2>
              <span>{t("createdBy", { username: project?.author?.username })}</span>
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
              <img src={imageURL} alt={project?.title} />
            ) : (
              <div className="noImage"></div>
            )}
          </div>
          <div className="cardInfo">
            <div className="studyHeader">
              <h2>{project.title}</h2>
            </div>
          </div>
        </Link>
      )}
    </StyledStudyCard>
  );
}
