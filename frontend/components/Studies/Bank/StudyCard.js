import { useLazyQuery } from "@apollo/client";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";

import { STUDY_PROPOSALS_QUERY } from "../../Queries/Study";
import { getStudyImageUrl } from "../../../lib/profileStudyImageUrls";

import Card from "../../DesignSystem/Card";
import Chip from "../../DesignSystem/Chip";
import { BuilderIcon } from "../../DesignSystem/Icons";
import StudyOptions from "./StudyOptions";

export default function StudyCard({ user, study, url, id, name, studiesInfo }) {
  const { t } = useTranslation("builder");
  const imageURL = getStudyImageUrl(study);
  const router = useRouter();

  const [fetchStudyProjects, { loading: redirectLoading }] = useLazyQuery(
    STUDY_PROPOSALS_QUERY
  );

  const shouldRedirectToProjectBuilder =
    !!user?.id && typeof url === "string" && url.includes("/builder/studies");

  const resolvedStudyId = study?.id ?? study?.[id];

  const linkHref = user
    ? { pathname: url, query: { [name]: study[id] } }
    : { pathname: url };

  const handleClick = async (e) => {
    if (!shouldRedirectToProjectBuilder) return;
    if (!resolvedStudyId) return;
    if (redirectLoading) return;

    // Prevent navigating to the study page; we'll decide where to go.
    e.preventDefault();
    e.stopPropagation();

    try {
      const res = await fetchStudyProjects({
        variables: { id: resolvedStudyId },
      });

      const proposals = res?.data?.study?.proposal || [];
      const proposalMain = res?.data?.study?.proposalMain;

      const nonTemplateMain =
        proposalMain && !proposalMain?.isTemplate ? proposalMain : null;

      const nonTemplateByAuthor =
        proposals.find(
          (p) =>
            !p?.isTemplate &&
            p?.author?.id &&
            String(p.author.id) === String(user?.id)
        ) || null;

      const nonTemplateFirst = nonTemplateMain
        ? nonTemplateMain
        : nonTemplateByAuthor ||
          proposals.find((p) => p && !p?.isTemplate) ||
          null;

      const projectId = nonTemplateFirst?.id;

      if (projectId) {
        router.push({
          pathname: `/builder/projects`,
          query: { selector: projectId, tab: "builder" },
        });
      } else {
        router.push(linkHref);
      }
    } catch (err) {
      router.push(linkHref);
    }
  };

  const createdBy = study?.author?.username
    ? t("createdBy", { username: study.author.username })
    : null;

  return (
    <Card
      variant="elevated"
      href={linkHref}
      onClick={handleClick}
      padding={0}
      ariaLabel={study?.title}
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
          <BuilderIcon
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
          padding: 16,
        }}
      >
        <Chip
          variant="static"
          tone="neutral"
          label={t("studyCard.typeLabel", {}, { default: "Study" })}
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
          {study?.title}
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

      {/* TODO: favorite studies once a backend exists (Figma shows a star here). */}
      {studiesInfo && (
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            padding: "0 16px 16px",
          }}
        >
          <StudyOptions user={user} study={study} studiesInfo={studiesInfo} />
        </div>
      )}
    </Card>
  );
}
