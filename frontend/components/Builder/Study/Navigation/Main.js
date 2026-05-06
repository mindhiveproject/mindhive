import { useQuery } from "@apollo/client";
import Link from "next/link";
import useTranslation from "next-translate/useTranslation";

import Connect from "./Connect/Main";
import StudyOptions from "../../../Studies/Bank/StudyOptions";
import InfoTooltip from "../../../DesignSystem/InfoTooltip";

import { MY_STUDY } from "../../../Queries/Study";

export default function Navigation({
  query,
  user,
  tab,
  saveBtnName,
  saveBtnFunction,
  toggleSidebar,
  hasStudyChanged,
  isCanvasLocked,
}) {
  const { t } = useTranslation("builder");
  const { area, selector } = query;
  const itemsOriginal = [
    {
      value: "proposal",
      name: t("projectBoard"),
    },
    {
      value: "page",
      name: t("participantPage"),
    },
    {
      value: "builder",
      name: t("studyBuilder"),
    },
    // {
    //   value: "review",
    //   name: t("review.review"),
    // },
    {
      value: "collect",
      name: t("testAndCollect"),
    },
    // {
    //   value: "visualize",
    //   name: t("visualize"),
    // },
    {
      value: "journal",
      name: t("visualize"),
    },
  ];
  const itemsClone = [
    {
      value: "page",
      name: t("participantPage"),
    },
  ];

  const studyId = query?.selector;

  const items = area === "cloneofstudy" && studyId ? itemsClone : itemsOriginal;

  const { data } = useQuery(MY_STUDY, {
    variables: { id: studyId },
  });
  const study = data?.study || {
    title: "",
    description: "",
    collaborators: [],
    classes: [],
    consent: [],
    talks: [],
    currentVersion: "",
  };

  const toggleChatSidebar = () => {
    const [talk] = study?.talks;
    toggleSidebar({ chatId: talk?.id });
  };

  const tryToLeave = (e) => {
    if (hasStudyChanged) {
      if (!confirm(t("unsavedChangesWarning"))) {
        e.preventDefault();
      }
    }
  };

  return (
    <div className="navigation">
      <div className="firstLine">
        <div className="leftPanel">
          <div className="goBackBtn">
            <Link
              href={{
                pathname: `/dashboard/develop/studies`,
              }}
              onClick={tryToLeave}
            >
              ←
            </Link>
          </div>
        </div>
        <div className="middle">
          <InfoTooltip
            content={study?.title || t("myStudies", "My Studies")}
            delayMs={650}
            wrapperStyle={{ width: "100%", minWidth: 0 }}
            tooltipStyle={{
              maxWidth: "100%",
              width: "fit-content",
              background: "#F7F9F8",
            }}
          >
            <span className="studyTitle">{study?.title ?? ""}</span>
          </InfoTooltip>
        </div>
        <div className="right">
          {area === "cloneofstudy" && studyId && (
            <span className="saveFirstMessage">
              {t(
                "navigation.cloneSavePrompt",
                "Change the study name and click the Save button"
              )}
            </span>
          )}
          {area !== "cloneofstudy" && (
            <>
              <Connect study={study} user={user} />

              {study?.talks?.length > 0 && (
                <div className="icon" onClick={toggleChatSidebar}>
                  <img src="/assets/icons/chat.svg" alt="" />
                </div>
              )}

              <div className="icon">
                <StudyOptions user={user} study={study} />
              </div>
            </>
          )}

          {saveBtnFunction && !isCanvasLocked && (
            <button
              onClick={() => saveBtnFunction()}
              className={
                hasStudyChanged || area === "cloneofstudy" ? "on" : "off"
              }
            >
              {saveBtnName}
            </button>
          )}
        </div>
      </div>

      <div className="secondLine">
        <div className="menu">
          {items.map((item, i) => (
            <Link
              key={item.value}
              href={{
                pathname: `/builder/${area}`,
                query: {
                  selector,
                  tab: item?.value,
                },
              }}
              onClick={tryToLeave}
              aria-current={tab === item?.value ? "page" : undefined}
            >
              <div
                className={
                  tab === item?.value
                    ? "menuTitle selectedMenuTitle"
                    : "menuTitle"
                }
              >
                <div className="titleWithIcon">
                  <img src={`/assets/icons/project/${item?.value}.svg`} alt="" />
                  <p>{item?.name}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
