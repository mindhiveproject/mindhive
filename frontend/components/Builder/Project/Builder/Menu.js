import { useEffect, useState } from "react";
import useTranslation from "next-translate/useTranslation";

import Navbar, { NavbarItem } from "../../../DesignSystem/Navbar";
import ComponentSelector from "./Selector/Main";
import StudySettings from "./Settings/Main";
import StudyTasks from "../../../Dashboard/Review/Board/StudyOverview/StudyTasks";

const ICON_MASK = (src) => ({
  display: "block",
  width: 24,
  height: 24,
  backgroundColor: "currentColor",
  WebkitMaskImage: `url(${src})`,
  WebkitMaskSize: "contain",
  WebkitMaskRepeat: "no-repeat",
  WebkitMaskPosition: "center",
  maskImage: `url(${src})`,
  maskSize: "contain",
  maskRepeat: "no-repeat",
  maskPosition: "center",
});

function MediumIcon({ src }) {
  return <span aria-hidden style={ICON_MASK(src)} />;
}

export default function Menu({
  engine,
  user,
  addFunctions,
  study,
  handleChange,
  handleMultipleUpdate,
  hasStudyChanged,
}) {
  const { t } = useTranslation("builder");
  const [tab, setTab] = useState("addBlock");

  // The navbar has three responsive states, driven by how much room the widened
  // sidepanel has for the three labels:
  //   "full"    – every item shows its label
  //   "compact" – only the selected item shows its label; the rest are icons
  //   "icons"   – every item is an icon, with the label on hover
  const [navState, setNavState] = useState("full");
  useEffect(() => {
    const fitsAll = window.matchMedia("(min-width: 1121px)");
    const fitsOne = window.matchMedia("(min-width: 761px)");
    const sync = () => {
      if (fitsAll.matches) setNavState("full");
      else if (fitsOne.matches) setNavState("compact");
      else setNavState("icons");
    };
    sync();
    fitsAll.addEventListener("change", sync);
    fitsOne.addEventListener("change", sync);
    return () => {
      fitsAll.removeEventListener("change", sync);
      fitsOne.removeEventListener("change", sync);
    };
  }, []);

  const labels = {
    addBlock: t("menu.addBlock", {}, { default: "Add a block" }),
    flow: t("menu.studyFlow", {}, { default: "Study Flow" }),
    study: t("menu.settings", {}, { default: "Settings" }),
  };

  // "compact" keeps the selected tab's label and collapses the rest; "icons"
  // collapses everything.
  const isItemCollapsed = (key) =>
    navState === "icons" || (navState === "compact" && tab !== key);

  return (
    <>
      <div className="sidepanelNavbar">
        <Navbar variant="tonal">
          <NavbarItem
            selected={tab === "addBlock"}
            collapsed={isItemCollapsed("addBlock")}
            onClick={() => setTab("addBlock")}
            leadingIcon={
              <MediumIcon src="/assets/icons/builder/medium-add.svg" />
            }
            tooltipContent={
              isItemCollapsed("addBlock") ? labels.addBlock : undefined
            }
            id="addBlock"
          >
            {labels.addBlock}
          </NavbarItem>
          <NavbarItem
            selected={tab === "flow"}
            collapsed={isItemCollapsed("flow")}
            onClick={() => setTab("flow")}
            leadingIcon={
              <MediumIcon src="/assets/icons/builder/medium-study-flow.svg" />
            }
            tooltipContent={isItemCollapsed("flow") ? labels.flow : undefined}
            id="flow"
          >
            {labels.flow}
          </NavbarItem>
          <NavbarItem
            selected={tab === "study"}
            collapsed={isItemCollapsed("study")}
            onClick={() => setTab("study")}
            leadingIcon={
              <MediumIcon src="/assets/icons/builder/medium-settings.svg" />
            }
            tooltipContent={isItemCollapsed("study") ? labels.study : undefined}
            id="studySettings"
          >
            {labels.study}
          </NavbarItem>
        </Navbar>
      </div>

      {tab === "addBlock" && (
        <ComponentSelector
          engine={engine}
          user={user}
          addFunctions={addFunctions}
        />
      )}

      {tab === "flow" && (
        <div className="studyFlow" id="studyFlow">
          <StudyTasks study={study} />
        </div>
      )}

      {tab === "study" && (
        <StudySettings
          engine={engine}
          user={user}
          addFunctions={addFunctions}
          study={study}
          handleChange={handleChange}
          handleMultipleUpdate={handleMultipleUpdate}
          hasStudyChanged={hasStudyChanged}
        />
      )}
    </>
  );
}
