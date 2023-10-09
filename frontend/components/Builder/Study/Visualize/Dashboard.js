import { useState } from "react";

import SpecEditor from "./Editor/SpecEditor";
import SpecManager from "./Editor/SpecManager";
import ChatGPT from "./ChatGPT/Main";
import Selector from "./Controller/Selector";
import DataUpload from "./DataUpload";

import Render from "./Render";

export default function Dashboard({ 
  user, 
  studyId, 
  data, 
  studyData,
  setData, 
  variables, 
  setVariables,
  spec, 
  defaultSpec, 
  setSpec
}) {

  const [tab, setTab] = useState("data")

    return <div>

        <div className="menu">
          
          <div
            className={
              tab === "data" ? "menuTitle selectedMenuTitle" : "menuTitle"
            }
            onClick={ () => { setTab("data") }}
          >
            <p>Data</p>
          </div>

          <div
            className={
              tab === "chat" ? "menuTitle selectedMenuTitle" : "menuTitle"
            }
            onClick={ () => { setTab("chat") }}
          >
            <p>ChatGPT</p>
          </div>
       
          <div
            className={
              tab === "manager" ? "menuTitle selectedMenuTitle" : "menuTitle"
            }
            onClick={ () => { setTab("manager") }}
          >
            <p>Save & Open</p>
          </div>
     
          <div
            className={
              tab === "selector" ? "menuTitle selectedMenuTitle" : "menuTitle"
            }
            onClick={ () => { setTab("selector") }}
          >
            <p>Selector</p>
          </div>
     
          <div
              className={
                tab === "editor" ? "menuTitle selectedMenuTitle" : "menuTitle"
              }
              onClick={ () => { setTab("editor") }}
            >
              <p>Spec Editor</p>
          </div>
      
      </div>

      <div className="main">

        <div className="dashboardArea">
                
          {tab === "data" && <div>
            <DataUpload 
              setData={setData} 
              setVariables={setVariables} 
              studyData={studyData} 
            />
          </div>}

          {tab === "chat" && <div>
            <ChatGPT 
              spec={spec}
              setSpec={setSpec}
              data={data} 
            />
          </div>}
          
          {tab === "manager" && 
            <SpecManager
              studyId={studyId}
              user={user}
              spec={spec}
              setSpec={setSpec}
              defaultSpec={defaultSpec}
            />
          }

          {tab === "selector" && <div>
            <Selector spec={spec} setSpec={setSpec} variables={variables} />
          </div>}

          {tab === "editor" && <div>
            <SpecEditor spec={spec} setSpec={setSpec} />
          </div>}
          
        </div>

        <Render data={data} spec={spec} />

      </div>

  </div>
}