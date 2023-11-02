import { useState } from "react";

import Dashboard from "./Dashboard";
import Table from "./Table/Main";

import { StyledChatGPTPage } from "../../../styles/StyledBuilder";

const defaultSpec = `
import matplotlib
import matplotlib.pyplot as plt

matplotlib.use("module://matplotlib_pyodide.html5_canvas_backend");

# Sample data
x = [1, 2, 3, 4, 5]
y = [10, 15, 13, 18, 20]

# Create a line graph
plt.plot(x, y, marker='o', linestyle='-', color='b', label='Sample Data')

# Customize the graph
plt.title('Sample Line Graph')
plt.xlabel('X-axis Label')
plt.ylabel('Y-axis Label')
plt.legend()
plt.grid(True)

# Show the graph
plt.show()
`




export default function StateManager({ studyId, studyData, studyVariables, user }) {

  // state of the Vega spec
  const [spec, setSpec] = useState(defaultSpec);
  // state of the data we are working with
  const [data, setData] = useState([...studyData]);
  // state of the variables 
  const [variables, setVariables] = useState([...studyVariables]);

  return (
    <StyledChatGPTPage>
      <div className="board">

        <Dashboard 
            user={user}
            studyId={studyId}
            data={data}
            studyData={studyData}
            setData={setData}
            variables={variables}
            setVariables={setVariables}
            spec={spec} 
            defaultSpec={defaultSpec}
            setSpec={setSpec} 
        />

        <Table data={data} />

      </div>  
    </StyledChatGPTPage>    
  );
}