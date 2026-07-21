import { useRouter } from "next/router";
import moment from "moment";
import useTranslation from "next-translate/useTranslation";

export default function Studies({ myclass, user }) {
  const { t } = useTranslation("classes");
  const router = useRouter();

  const studies = myclass?.studies || [];
  const getCollaborators = (study) => {
    const collaboratorMap = new Map();
    [study?.author, ...(study?.collaborators || [])].forEach((profile) => {
      const key = profile?.id || profile?.username;
      if (key && profile?.username) {
        collaboratorMap.set(key, profile.username);
      }
    });
    return Array.from(collaboratorMap.values()).join(", ");
  };

  if (studies.length === 0) {
    return (
      <div className="empty">
        <div>{t("noStudies")}</div>
      </div>
    );
  }

  return (
    <div className="studies">
      <div className="studiesHeader">
        <div>
          <span>{t("studyTitle")} </span>
          <span
            style={{ cursor: "pointer" }}
            onClick={() => randomizeStudiesOrder(false)}
          >
            ↓
          </span>
        </div>
        <div>{t("collaborators")}</div>
        <div>{t("participants")}</div>
        <div>{t("dateCreated")}</div>
        <div></div>
        <div></div>
      </div>
      {studies.map((study) => {
        const authors = getCollaborators(study);
        return (
          <div key={study?.id} className="studiesRow">
            <div>{study?.title}</div>
            <div>{authors}</div>
            <div>{study?.participants?.length}</div>
            <div>{moment(study?.createdAt).format("MMMM D, YYYY")}</div>
            <div>
              <a
                target="_blank"
                href={`/studies/${study.slug}`}
                rel="noreferrer"
              >
                {t("studyPage")}
              </a>
            </div>
            <div></div>
          </div>
        );
      })}
    </div>
  );
}
