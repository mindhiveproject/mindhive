import { useLazyQuery } from "@apollo/client";
import Link from "next/link";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";

import { STUDY_PROPOSALS_QUERY } from "../../Queries/Study";

import { StyledStudyCard } from "../../styles/StyledCard";
import StudyOptions from "./StudyOptions";

export default function StudyCard({ user, study, url, id, name, studiesInfo }) {
  const { t } = useTranslation("builder");
  const imageURL = study?.image?.image?.publicUrlTransformed;
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

      const nonTemplateFirst =
        nonTemplateMain
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
        // Fallback to the original study link.
        router.push(linkHref);
      }
    } catch (err) {
      // Fallback to the original study link on any failure.
      router.push(linkHref);
    }
  };

  return (
    <StyledStudyCard>
      {studiesInfo && (
        <StudyOptions user={user} study={study} studiesInfo={studiesInfo} />
      )}
      <Link href={linkHref} onClick={handleClick}>
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
