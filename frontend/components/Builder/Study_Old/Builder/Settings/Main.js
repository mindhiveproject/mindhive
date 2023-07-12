import { useState } from "react";

import ComponentSelector from "../Selector/Main";

export default function Settings({
  engine,
  user,
  addFunctions,
  setIsModalOpen,
  setComponentId,
}) {
  const [tab, setTab] = useState("addBlock");

  return (
    <div>
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
          setComponentId={setComponentId}
        />
      )}
    </div>
  );
}
