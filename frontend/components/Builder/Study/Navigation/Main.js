import { useQuery, useMutation } from "@apollo/client";
import Link from "next/link";
import useTranslation from "next-translate/useTranslation";

import Connect from "./Connect/Main";
import StudyOptions from "../../../Studies/Bank/StudyOptions";

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
    //   name: t("review"),
    // },
    {
      value: "collect",
      name: t("testAndCollect"),
    },
    {
      value: "visualize",
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

  const { data, error, loading } = useQuery(MY_STUDY, {
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
      if (
        !confirm(
          t("unsavedChangesWarning")
        )
      ) {
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
          <div>
            <span className="studyTitle">{study?.title}</span>
            {/* {study?.currentVersion && (
              <span className="studyVersion">
                [
                {
                  study?.versionHistory.filter(
                    (v) => v?.id === study?.currentVersion
                  )[0]?.name
                }
                ]
              </span>
            )} */}
          </div>
        </div>
        <div className="rightPanel">
          {area !== "cloneofstudy" && (
            <>
              <Connect study={study} user={user} />

              {study?.talks?.length > 0 && (
                <div className="icon" onClick={toggleChatSidebar}>
                  <img src="/assets/icons/chat.svg" />
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
          {itemsOriginal.map((item, i) => (
            <Link
              key={i}
              href={{
                pathname: `/builder/${area}`,
                query: {
                  selector,
                  tab: item?.value,
                },
              }}
              onClick={tryToLeave}
            >
              <div
                className={
                  tab === item?.value
                    ? "menuTitle selectedMenuTitle"
                    : "menuTitle"
                }
              >
                <div className="titleWithIcon">
                  <img src={`/assets/icons/builder/${item?.value}.svg`} />
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
