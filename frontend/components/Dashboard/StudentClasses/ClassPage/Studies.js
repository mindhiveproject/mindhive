import { useRouter } from "next/router";
import moment from "moment";
import useTranslation from "next-translate/useTranslation";

export default function Studies({ myclass, user }) {
  const { t } = useTranslation("classes");
  const router = useRouter();

  const studies = myclass?.studies || [];

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
        const authors = [
          study?.author?.username,
          study?.collaborators?.map((c) => c.username),
        ].join(", ");
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
