import { useQuery } from "@apollo/client";
import Link from "next/link";
import useTranslation from "next-translate/useTranslation";

import Connect from "./Connect/Main";
import StudyOptions from "../../../Studies/Bank/StudyOptions";
import Tooltip from "../../../DesignSystem/Tooltip";
import Navbar, { NavbarItem } from "../../../DesignSystem/Navbar";

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
          <Tooltip
            content={study?.title || t("myStudies", "My Studies")}
            side="bottom"
            delayMs={650}
            maxWidth={400}
          >
            <span className="studyTitle">{study?.title ?? ""}</span>
          </Tooltip>
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
        <Navbar variant="underline" dense hoverUnderline>
          {items.map((item) => (
            <NavbarItem
              key={item.value}
              as={Link}
              href={{
                pathname: `/builder/${area}`,
                query: {
                  selector,
                  tab: item?.value,
                },
              }}
              onClick={tryToLeave}
              selected={tab === item?.value}
              leadingIcon={
                <img
                  src={`/assets/icons/project/${item?.value}.svg`}
                  alt=""
                  width="24"
                  height="24"
                />
              }
            >
              {item?.name}
            </NavbarItem>
          ))}
        </Navbar>
      </div>
    </div>
  );
}
