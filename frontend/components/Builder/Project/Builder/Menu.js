import { useEffect, useState } from "react";
import useTranslation from "next-translate/useTranslation";

import Navbar, { NavbarItem } from "../../../DesignSystem/Navbar";
import { DatasetIcon } from "../../../DesignSystem/Icons";
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

  // Selecting a data source (from the persistent panel or the link modal's
  // gear icon) surfaces an extra tab here and switches straight to it — the
  // "select a block, get its settings tab" flow the mockups called for.
  useEffect(() => {
    if (dataSourceSettingsId) setTab("dataSource");
  }, [dataSourceSettingsId]);

  const closeDataSourceTab = () => {
    onCloseDataSourceSettings?.();
    setTab("flow");
  };

  // The navbar has three responsive states, driven by how much room the widened
  // sidepanel has for the labels:
  //   "full"    – every item shows its label
  //   "compact" – only the selected item shows its label; the rest are icons
  //   "icons"   – every item is an icon, with the label on hover
  // The two breakpoints were tuned by eye for 3 items; the "Data source" tab
  // adds a 4th when a data source is selected, so both thresholds scale with
  // the actual item count instead of letting a label wrap onto two lines.
  const itemCount = dataSourceSettingsId ? 4 : 3;
  const [navState, setNavState] = useState("full");
  useEffect(() => {
    const fullPx = Math.round(1121 * (itemCount / 3));
    const compactPx = 761 + (itemCount - 3) * 64;
    const fitsAll = window.matchMedia(`(min-width: ${fullPx}px)`);
    const fitsOne = window.matchMedia(`(min-width: ${compactPx}px)`);
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
  }, [itemCount]);

  const labels = {
    addBlock: t("menu.addBlock", {}, { default: "Add a block" }),
    flow: t("menu.studyFlow", {}, { default: "Study Flow" }),
    study: t("menu.settings", {}, { default: "Settings" }),
    dataSource: t("dataSources.tab", {}, { default: "Data source" }),
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
          {dataSourceSettingsId && (
            <NavbarItem
              selected={tab === "dataSource"}
              collapsed={isItemCollapsed("dataSource")}
              onClick={() => setTab("dataSource")}
              leadingIcon={<DatasetIcon />}
              tooltipContent={
                isItemCollapsed("dataSource") ? labels.dataSource : undefined
              }
              id="dataSourceSettings"
            >
              {labels.dataSource}
            </NavbarItem>
          )}
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

      {tab === "dataSource" && dataSourceSettingsId && (
        <DataSourceSettingsTab
          study={study}
          studyDataSourceId={dataSourceSettingsId}
          onClose={closeDataSourceTab}
        />
      )}
    </>
  );
}
