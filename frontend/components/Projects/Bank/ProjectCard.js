import useTranslation from "next-translate/useTranslation";

import { getStudyImageUrl } from "../../../lib/profileStudyImageUrls";

import Card from "../../DesignSystem/Card";
import Chip from "../../DesignSystem/Chip";
import { ProjectBoardIcon } from "../../DesignSystem/Icons";
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
  const imageURL = getStudyImageUrl(project);

  const linkHref = user
    ? { pathname: url, query: { [name]: project[id] } }
    : { pathname: url };

  const createdBy =
    user && project?.author?.username
      ? t("createdBy", { username: project.author.username })
      : null;

  return (
    <Card
      variant="elevated"
      href={linkHref}
      padding={0}
      ariaLabel={project?.title}
    >
      <div
        style={{
          height: 192,
          width: "100%",
          flexShrink: 0,
          background: "var(--MH-Theme-Neutrals-Lighter, #F3F3F3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
          overflow: "hidden",
        }}
      >
        {imageURL ? (
          <img
            src={imageURL}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <ProjectBoardIcon
            width={24}
            height={24}
            style={{ color: "var(--MH-Theme-Neutrals-Dark, #6A6A6A)" }}
          />
        )}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          padding: "16px 16px 0",
        }}
      >
        <Chip
          variant="static"
          tone="neutral"
          label={t("projectCard.typeLabel", {}, { default: "Project" })}
          style={{ alignSelf: "flex-start" }}
        />
        <span
          className="MH-Type-Title-Base"
          style={{
            color: "#171717",
            minHeight: 72,
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {project?.title}
        </span>
        {createdBy && (
          <span
            className="MH-Type-Body-Base"
            style={{
              color: "var(--MH-Theme-Neutrals-Dark, #6A6A6A)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {createdBy}
          </span>
        )}
      </div>

      <div
        style={{
          marginTop: "auto",
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
          padding: 16,
        }}
      >
        {/* TODO: favorite projects once a backend exists (Figma shows a star here). */}
        <ProjectOptions
          user={user}
          project={project}
          projectsInfo={projectsInfo}
        />
      </div>
    </Card>
  );
}
