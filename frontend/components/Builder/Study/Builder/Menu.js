import { useState } from "react";

import ComponentSelector from "./Selector/Main";
import StudySettings from "./Settings/Main";

export default function Menu({
  engine,
  user,
  addFunctions,
  setIsModalOpen,
  study,
  handleChange,
  handleMultipleUpdate,
}) {
  const [tab, setTab] = useState("addBlock");

  return (
    <div className="sidepanel">
      <div text stackable className="menu">
        <div
          onClick={() => setTab("addBlock")}
          className={
            tab === "addBlock" ? "menuTitle selectedMenuTitle" : "menuTitle"
          }
        >
          <h2>Add a block</h2>
        </div>

        <div
          onClick={() => setTab("study")}
          className={
            tab === "study" ? "menuTitle selectedMenuTitle" : "menuTitle"
          }
        >
          <h2>Study settings</h2>
        </div>
      </div>

      {tab === "addBlock" && (
        <ComponentSelector
          engine={engine}
          user={user}
          addFunctions={addFunctions}
          setIsModalOpen={setIsModalOpen}
        />
      )}

      {tab === "study" && (
        <StudySettings
          engine={engine}
          user={user}
          addFunctions={addFunctions}
          setIsModalOpen={setIsModalOpen}
          study={study}
          handleChange={handleChange}
          handleMultipleUpdate={handleMultipleUpdate}
        />
      )}
    </div>
  );
}