import { useState } from "react";
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

  return (
    <>
      <div className="sidepanelNavbar">
        <Navbar variant="tonal">
          <NavbarItem
            selected={tab === "addBlock"}
            onClick={() => setTab("addBlock")}
            leadingIcon={
              <MediumIcon src="/assets/icons/builder/medium-add.svg" />
            }
            id="addBlock"
          >
            {t("menu.addBlock", {}, { default: "Add a block" })}
          </NavbarItem>
          <NavbarItem
            selected={tab === "flow"}
            onClick={() => setTab("flow")}
            leadingIcon={
              <MediumIcon src="/assets/icons/builder/medium-study-flow.svg" />
            }
            id="flow"
          >
            {t("menu.studyFlow", {}, { default: "Study Flow" })}
          </NavbarItem>
          <NavbarItem
            selected={tab === "study"}
            onClick={() => setTab("study")}
            leadingIcon={
              <MediumIcon src="/assets/icons/builder/medium-settings.svg" />
            }
            id="studySettings"
          >
            {t("menu.settings", {}, { default: "Settings" })}
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
