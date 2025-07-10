import absoluteUrl from "next-absolute-url";
import { Icon } from "semantic-ui-react";
import moment from "moment";
import useTranslation from "next-translate/useTranslation";

export default function Created({ query, user, profile }) {
  const { t } = useTranslation("common");
  const { origin } = absoluteUrl();
  const studies = [
    ...profile?.researcherIn.map((study) => ({
      ...study,
      role: t("created.author"),
    })),
    ...profile?.collaboratorInStudy.map((study) => ({
      ...study,
      role: t("created.collaborator"),
    })),
  ];

  if (studies.length === 0) {
    return (
      <div className="empty">
        <div>{t("created.noStudiesYet")}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="headerCreatedStudies">
        <div>{t("created.studyTitle")}</div>
        <div>{t("created.role")}</div>
        <div>{t("created.dateCreated")}</div>
        <div>{t("created.dateUpdated")}</div>
      </div>

      {studies.map((study, id) => (
        <div className="rowCreatedStudies" key={id}>
          <div className="title">
            {study?.title}
            <a
              href={`${origin}/studies/${study.slug}`}
              target="_blank"
              rel="noreferrer"
            >
              <Icon name="external alternate" />
            </a>
          </div>
          <div>{study?.role}</div>
          <div>{moment(study.createdAt).format("MMMM D, YYYY, h:mma")}</div>
          <div>
            {study.updatedAt &&
              moment(study.updatedAt).format("MMMM D, YYYY, h:mma")}
          </div>
        </div>
      ))}
    </div>
  );
}
