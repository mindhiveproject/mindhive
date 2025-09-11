import Link from "next/link";
import useTranslation from "next-translate/useTranslation";
import { useRouter } from "next/router";

const itemsInternalTask = [
  {
    value: "template",
    name: "templateTab",
    icon: "collect",
  },
  {
    value: "basic",
    name: "basicTab",
    icon: "proposal",
  },
  {
    value: "parameters",
    name: "parametersTab",
    icon: "builder",
  },
  {
    value: "sharing",
    name: "sharingTab",
    icon: "review",
  },
];

const itemsExternalTask = [
  {
    value: "basic",
    name: "basicTab",
    icon: "proposal",
  },
  {
    value: "sharing",
    name: "sharingTab",
    icon: "review",
  },
];

const itemsInStudyBuilder = [
  {
    value: "parameters",
    name: "parametersTab",
    icon: "builder",
  },
];

export default function Navigation({
  tab,
  setTab,
  task,
  user,
  handleSubmit,
  submitBtnName,
  openFullscreenPreview,
  isTemplateAuthor,
  close,
  isInStudyBuilder,
}) {
  const { t } = useTranslation("builder");
  // decide whether include the template tab based on whether the user is the author or a collaborator on the template
  const itemsInternalTaskSelected = isInStudyBuilder
    ? itemsInStudyBuilder
    : isTemplateAuthor
    ? itemsInternalTask
    : itemsInternalTask.filter((item) => item.value !== "template");
  // decide whether to show only tabs for an external task
  const items = task?.isExternal
    ? itemsExternalTask
    : itemsInternalTaskSelected;
  const router = useRouter();   
  const { locale } = router;
  return (
    <div className="navigation">
      <div className="firstLine">
        <div className="leftPanel">
          {close ? (
            <div className="goBackBtn" onClick={close}>
              ←
            </div>
          ) : (
            <div className="goBackBtn">
              <Link
                href={{
                  pathname: `/dashboard/develop/studies`,
                }}
              >
                ←
              </Link>
            </div>
          )}

          <div>
            <span className="studyTitle">{task?.i18nContent?.[locale]?.title || task?.title}</span>
          </div>
        </div>
        <div className="rightPanel">
          {false && (
            <div className="icon">
              <img src="/assets/icons/chat.svg" />
            </div>
          )}

          {task?.template?.script && (
            <button onClick={() => openFullscreenPreview()}>
              {t("fullscreenPreview")}
            </button>
          )}

          <div className="submitButton">
            <button onClick={() => handleSubmit()}>{submitBtnName || t("submit")}</button>
          </div>
        </div>
      </div>

      <div className="secondLine">
        <div className="menu">
          {items.map((item, i) => (
            <div key={i} onClick={() => setTab(item?.value)}>
              <div
                key={i}
                className={
                  tab === item?.value
                    ? "menuTitle selectedMenuTitle"
                    : "menuTitle"
                }
              >
                <div className="titleWithIcon">
                  <img src={`/assets/icons/builder/${item?.icon}.svg`} />
                  <p>{t(item?.name)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
