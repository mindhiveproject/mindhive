import { useEffect, useRef, useState } from "react";
import useTranslation from "next-translate/useTranslation";

import Navbar, { NavbarItem } from "../../../DesignSystem/Navbar";
import ComponentSelector from "./Selector/Main";
import StudySettings from "./Settings/Main";
import DataSourceSettingsTab from "./DataSources/SettingsTab";
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
  dataSourceSettingsId,
  onCloseDataSourceSettings,
}) {
  const { t } = useTranslation("builder");
  const [tab, setTab] = useState("addBlock");

  const dataSourceOpen = Boolean(dataSourceSettingsId);

  // Opening a data source's settings (from the persistent panel or the link
  // modal's gear icon) doesn't add a tab to this bar — the settings tab has
  // its own close button, so this bar just steps aside. Closing it returns
  // to whichever of the three regular tabs was showing before, since `tab`
  // was never touched.
  const closeDataSourceTab = () => onCloseDataSourceSettings?.();

  // The navbar has three responsive states, driven by how much room the
  // widened sidepanel has for the labels:
  //   "full"    – every item shows its label
  //   "compact" – only the selected item shows its label; the rest are icons
  //   "icons"   – every item is an icon, with the label on hover
  // Always exactly 3 items (data source mode swaps the whole row out instead
  // of adding a 4th), so these breakpoints are fixed.
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

  // Collapse from the navbar's own width, not the viewport. Window media
  // queries went icon-only while the side panel still had room for labels.
  const navRef = useRef(null);
  const [navState, setNavState] = useState("full");
  useEffect(() => {
    const el = navRef.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;

    const FULL_MIN = 420;
    const COMPACT_MIN = 260;
    const sync = () => {
      const width = el.clientWidth;
      if (width >= FULL_MIN) setNavState("full");
      else if (width >= COMPACT_MIN) setNavState("compact");
      else setNavState("icons");
    };

    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // "compact" keeps the selected tab's label and collapses the rest; "icons"
  // collapses everything.
  const isItemCollapsed = (key) =>
    navState === "icons" || (navState === "compact" && tab !== key);

  return (
    <>
      {!dataSourceOpen && (
        <div className="sidepanelNavbar" ref={navRef}>
          <Navbar variant="underline">
            <NavbarItem
              selected={tab === "addBlock"}
              collapsed={isItemCollapsed("addBlock")}
              onClick={() => setTab("addBlock")}
              leadingIcon={
                isItemCollapsed("addBlock") ? <MediumIcon src="/assets/icons/builder/medium-add.svg" /> : undefined
         
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
                isItemCollapsed("flow") ? <MediumIcon src="/assets/icons/builder/medium-study-flow.svg" /> : undefined
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
                isItemCollapsed("study") ? <MediumIcon src="/assets/icons/builder/medium-settings.svg" /> : undefined
              }
              tooltipContent={isItemCollapsed("study") ? labels.study : undefined}
              id="studySettings"
            >
              {labels.study}
            </NavbarItem>
          </Navbar>
        </div>
      )}

      {dataSourceOpen ? (
        <DataSourceSettingsTab
          study={study}
          studyDataSourceId={dataSourceSettingsId}
          onClose={closeDataSourceTab}
        />
      ) : (
        <>
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
      )}
    </>
  );
}
