import { useState } from "react";

import Dashboard from "./Dashboard";
import Table from "./Table/Main";

import { StyledChatGPTPage } from "../../../styles/StyledBuilder";

const defaultSpec = {
  width: "500",
  height: "400",
  title: "My graph",
  mark: "point",
  transform: [],
  encoding: {
    x: {
      field: "",
      type: "quantitative",
    },
    y: {
      field: "",
      type: "quantitative",
    },
  },
  data: { name: "values" },
};



export default function StateManager({ studyId, studyData, variables, user }) {

  // state of the Vega spec
  const [spec, setSpec] = useState(defaultSpec);
  // state of the data we are working with
  const [data, setData] = useState([...studyData]);

  return (
    <StyledChatGPTPage>
      <div className="board">

        <Dashboard 
            user={user}
            studyId={studyId}
            data={data}
            studyData={studyData}
            variables={variables}
            setData={setData}
            spec={spec} 
            defaultSpec={defaultSpec}
            setSpec={setSpec} 
        />

        <Table data={data} />

      </div>  
    </StyledChatGPTPage>    
  );
}