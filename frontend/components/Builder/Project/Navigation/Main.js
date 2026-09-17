import { useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import Link from "next/link";
import useTranslation from "next-translate/useTranslation";

import ConnectProject from "./Connect/Main";
import ConnectStudy from "./ConnectStudy/Main";
import ConnectStudyOnly from "../../Study/Navigation/Connect/Main";

import { PROPOSAL_QUERY } from "../../../Queries/Proposal";
import { MY_STUDY } from "../../../Queries/Study";
import StudyOptions from "../../../Studies/Bank/StudyOptions";
import Tooltip from "../../../DesignSystem/Tooltip";
import Button from "../../../DesignSystem/Button";
import IconButton from "../../../DesignSystem/IconButton";
import Navbar, { NavbarItem } from "../../../DesignSystem/Navbar";
import { NavigateBackIcon } from "../../../DesignSystem/Icons";
import {
  builderHref,
  dashboardBackPath,
  getBuilderMode,
  getNavTabs,
  isProjectArea,
} from "../../shared/identity";

export default function Navigation({
  proposalId,
  query,
  tab,
  user,
  saveBtnName,
  saveBtnFunction,
  toggleSidebar,
  hasStudyChanged,
  cardId,
  isCanvasLocked,
  connectModalOpen,
  onConnectModalOpenChange,
}) {
  const router = useRouter();
  const { t } = useTranslation("builder");

  const { area, selector } = query;
  const mode = getBuilderMode(area);
  const projectSelector = isProjectArea(area) ? proposalId || selector : null;
  const studySelector = isProjectArea(area) ? null : selector;

  const { data: projectData } = useQuery(PROPOSAL_QUERY, {
    variables: { id: projectSelector },
    skip: !projectSelector,
  });
  const project = projectData?.proposalBoard || { title: "" };

  const { data: studyData } = useQuery(MY_STUDY, {
    variables: { id: studySelector },
    skip: !studySelector,
  });
  const study = studyData?.study || {
    title: "",
    collaborators: [],
    classes: [],
    consent: [],
    talks: [],
  };

  const navItems = getNavTabs({ mode, t });

  const title =
    mode === "project"
      ? project?.title || t("header.myProjectBoard", "My Project Board")
      : study?.title || t("myStudies", "My Studies");

  const tryToLeave = (e) => {
    if (hasStudyChanged) {
      if (!confirm(t("unsavedChangesWarning"))) {
        e.preventDefault();
      }
    }
  };

  const studyForNav = mode === "project" ? project?.study : study;

  const toggleChatSidebar = () => {
    const [talk] = studyForNav?.talks || [];
    toggleSidebar?.({ chatId: talk?.id, studyId: studyForNav?.id });
  };

  return (
    <div className="navigation">
      <div className="firstLine">
        <div className="leftPanel">
          <IconButton
            variant="subtle"
            elevated={false}
            ariaLabel={t("navigation.goBack", {}, { default: "Go back" })}
            title={t("navigation.goBack", {}, { default: "Go back" })}
            icon={<NavigateBackIcon />}
            size="large"
            onClick={(e) => {
              if (hasStudyChanged) {
                if (!confirm(t("unsavedChangesWarning"))) {
                  e.preventDefault();
                  return;
                }
              }
              router.push({ pathname: dashboardBackPath(area) });
            }}
          />
        </div>
        <div className="middle">
          <Tooltip content={title} side="bottom" delayMs={650} maxWidth={400}>
            <span className="studyTitle">{title}</span>
          </Tooltip>
        </div>
        <div className="right">
          {mode === "cloneofstudy" && studySelector && (
            <span className="saveFirstMessage">
              {t(
                "navigation.cloneSavePrompt",
                "Change the study name and click the Save button"
              )}
            </span>
          )}

          {mode === "project" &&
            (tab === "board" ? (
              <ConnectProject project={project} user={user} />
            ) : (
              <ConnectStudy study={project?.study} user={user} />
            ))}

          {mode === "study" && (
            <ConnectStudyOnly
              study={study}
              user={user}
              modalOpen={connectModalOpen}
              onModalOpenChange={onConnectModalOpenChange}
            />
          )}

          {studyForNav?.talks?.length > 0 && (
            <IconButton
              variant="subtle"
              elevated={false}
              ariaLabel={t("navigation.chat", {}, { default: "Chat" })}
              title={t("navigation.chat", {}, { default: "Chat" })}
              icon={<img src="/assets/icons/chat.svg" alt="" />}
              onClick={toggleChatSidebar}
            />
          )}

          <StudyOptions
            user={user}
            study={studyForNav}
            project={mode === "project" ? project : undefined}
            variant="popover"
          />

          {cardId && (
            <Button
              type="button"
              variant="tonal"
              disabled={!(hasStudyChanged || area === "cloneofstudy")}
              onClick={async () => {
                await saveBtnFunction();
                router.push(
                  builderHref({
                    area,
                    selector,
                  })
                );
              }}
            >
              {saveBtnName}
            </Button>
          )}

          {saveBtnFunction && !isCanvasLocked && (
            <Button
              type="button"
              variant="tonal"
              disabled={!(hasStudyChanged || area === "cloneofstudy")}
              onClick={() => saveBtnFunction()}
            >
              {saveBtnName}
            </Button>
          )}
        </div>
      </div>

      <div className="secondLine">
        <Navbar variant="underline" dense hoverUnderline id="menue">
          {navItems.map((item) => (
            <NavbarItem
              key={item.value}
              as={Link}
              href={
                item.href ||
                builderHref({
                  area,
                  selector,
                  tab: item.value,
                })
              }
              onClick={tryToLeave}
              selected={tab === item.value}
              leadingIcon={
                <img
                  src={`/assets/icons/project/${item.value}.svg`}
                  alt=""
                  width="24"
                  height="24"
                />
              }
            >
              {item.name}
            </NavbarItem>
          ))}
        </Navbar>
      </div>
    </div>
  );
}
