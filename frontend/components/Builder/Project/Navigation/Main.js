import { useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import Link from "next/link";
import useTranslation from "next-translate/useTranslation";

import ConnectProject from "./Connect/Main";
import ConnectStudy from "./ConnectStudy/Main";
import ConnectStudyOnly from "../../Study/Navigation/Connect/Main";

import { PROPOSAL_QUERY } from "../../../Queries/Proposal";
import { MY_STUDY } from "../../../Queries/Study";
import StudyDropdown from "../../../Projects/StudyConnector/StudyDropdown";
import StudyOptions from "../../../Studies/Bank/StudyOptions";
import Tooltip from "../../../DesignSystem/Tooltip";
import Button from "../../../DesignSystem/Button";
import Navbar, { NavbarItem } from "../../../DesignSystem/Navbar";
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

  const toggleChatSidebar = () => {
    const [talk] = study?.talks || [];
    toggleSidebar?.({ chatId: talk?.id, studyId: study?.id });
  };

  return (
    <div className="navigation">
      <div className="firstLine">
        <div className="leftPanel">
          <div className="goBackBtn">
            <Link
              href={{ pathname: dashboardBackPath(area) }}
              onClick={tryToLeave}
            >
              ←
            </Link>
          </div>
        </div>
        <div className="middle">
          <Tooltip content={title} side="bottom" delayMs={650} maxWidth={400}>
            <span className="studyTitle">{title}</span>
          </Tooltip>
          {mode === "project" && project?.study && (
            <div className="studyTitle">
              <StudyDropdown user={user} project={project} />
            </div>
          )}
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
            <>
              <ConnectStudyOnly
                study={study}
                user={user}
                modalOpen={connectModalOpen}
                onModalOpenChange={onConnectModalOpenChange}
              />
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
