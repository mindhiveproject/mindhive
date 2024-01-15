import { useState } from "react";

import Render from "./Render";
import Selector from "./Controller/Selector";
import SpecEditor from "./Controller/SpecEditor";
import TemplateSelector from "./Controller/Templates";

export default function StateManager({
  studyData,
  studyVariables,
  content,
  handleChange,
}) {
  // state of the Vega spec
  const [spec, setSpec] = useState(content?.spec || null);
  // state of the data we are working with
  const [data, setData] = useState([...studyData]);
  // state of the variables
  const [variables, setVariables] = useState([...studyVariables]);

  const updateSpec = (spec) => {
    setSpec(spec);
    handleChange(spec);
  };

  return (
    <div className="graph">
      {!spec && <TemplateSelector updateSpec={updateSpec} />}

      {spec && <Render data={data} spec={spec} />}

      <Selector spec={spec} updateSpec={updateSpec} variables={variables} />

      {/* <SpecEditor spec={spec} updateSpec={updateSpec} /> */}
    </div>
  );
}
