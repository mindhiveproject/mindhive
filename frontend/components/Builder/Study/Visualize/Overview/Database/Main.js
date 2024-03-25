import { useState } from "react";
import { Accordion, Icon } from "semantic-ui-react";

import OperationModal from "../../Process/OperationModal";
import Variable from "./Variable";
import UpdatePartContent from "../../Process/UpdatePart";

export default function Database({
  part,
  data,
  variables,
  components,
  addNewColumn,
  checkData,
  onColumnChange,
}) {
  const [activeIndex, setActiveIndex] = useState(
    data.map((task, index) => index) || []
  );

  const handleClick = (e, titleProps) => {
    const { index } = titleProps;
    let newIndex;
    if (activeIndex.includes(index)) {
      newIndex = activeIndex.filter((i) => i !== index);
    } else {
      newIndex = [...activeIndex, index];
    }
    setActiveIndex(newIndex);
  };

  return (
    <div className="database">
      <div className="header">
        <div>
          <img src={`/assets/icons/visualize/database.svg`} />
        </div>
        <div>Active Data</div>
        <div>
          <UpdatePartContent
            part={part}
            content={{ modified: { data, variables } }}
          />
        </div>
      </div>

      <div className="variables">
        {variables
          .filter((column) => column.type === "user")
          .map((column) => (
            <Variable column={column} onColumnChange={onColumnChange} />
          ))}
      </div>

      <div className="variables">
        {variables
          .filter((column) => column.type === "general")
          .map((column) => (
            <Variable column={column} onColumnChange={onColumnChange} />
          ))}
      </div>

      <Accordion exclusive={false} fluid>
        {components.map((task, index) => (
          <div key={index}>
            <Accordion.Title
              active={activeIndex.includes(index)}
              index={index}
              onClick={handleClick}
            >
              <div className="task">
                <Icon name="dropdown" />
                <div>
                  <div className="title">{task?.name}</div>
                  <div className="subtitle">
                    {task?.subtitle} - {task?.testId}
                  </div>
                </div>
              </div>
            </Accordion.Title>
            <Accordion.Content active={activeIndex.includes(index)}>
              <div className="variables">
                {variables
                  .filter((column) => column.type === "task")
                  .filter((column) => column.testId === task?.testId)
                  .map((column) => (
                    <Variable column={column} onColumnChange={onColumnChange} />
                  ))}
              </div>
            </Accordion.Content>
          </div>
        ))}
      </Accordion>

      <div>
        <OperationModal variables={variables} addNewColumn={addNewColumn} />

        {/* <button onClick={checkData}>Check the data status</button> */}
      </div>
    </div>
  );
}
