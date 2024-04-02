import { useState } from "react";
import { Accordion, Icon, Dropdown, DropdownMenu } from "semantic-ui-react";

import OperationModal from "../../Process/OperationModal";
import Variable from "./Variable";
import UpdatePartContent from "../../Process/UpdatePart";

export default function Database({
  part,
  data,
  variables,
  components,
  updateDataset,
  onVariableChange,
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
        <div className="icons">
          <UpdatePartContent
            part={part}
            content={{ modified: { data, variables } }}
          />
          <div>
            <Dropdown
              icon={<img src={`/assets/icons/visualize/add_notes.svg`} />}
              direction="left"
            >
              <DropdownMenu>
                <OperationModal
                  type="copy"
                  data={data}
                  variables={variables}
                  updateDataset={updateDataset}
                  title="Copy existing variable"
                  iconSrc={`/assets/icons/visualize/content_paste_go.svg`}
                />
                <OperationModal
                  type="compute"
                  data={data}
                  variables={variables}
                  updateDataset={updateDataset}
                  title="Compute new variable"
                  iconSrc={`/assets/icons/visualize/table_chart_view.svg`}
                />
                <OperationModal
                  type="reverse"
                  data={data}
                  variables={variables}
                  updateDataset={updateDataset}
                  title="Reverse score"
                  iconSrc={`/assets/icons/visualize/database_reverse.svg`}
                />
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>
      </div>

      <div className="variables">
        {variables
          .filter((column) => column.type === "user")
          .map((column) => (
            <Variable column={column} onVariableChange={onVariableChange} />
          ))}
      </div>

      <div className="variables">
        {variables
          .filter((column) => column.type === "general")
          .map((column) => (
            <Variable column={column} onVariableChange={onVariableChange} />
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
                    <Variable
                      column={column}
                      onVariableChange={onVariableChange}
                    />
                  ))}
              </div>
            </Accordion.Content>
          </div>
        ))}
      </Accordion>
    </div>
  );
}
