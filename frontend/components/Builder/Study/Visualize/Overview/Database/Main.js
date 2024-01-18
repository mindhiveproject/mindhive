import { useState } from "react";
import { Accordion, Icon } from "semantic-ui-react";

const processByTask = ({ data }) => {
  // filter out unique tasks
  const allTasks = data.map((row) => row?.testVersion);
  const tasks = [...new Set(allTasks)];
  // populate the array of data with tasks
  const dataByTask = tasks.map((taskId) => {
    const taskData = data.filter((row) => row?.testVersion === taskId);
    // get the names of all variables
    const allVariables = taskData.map((row) => Object.keys(row)).flat();
    const variables = [...new Set(allVariables)];
    return {
      id: taskId,
      title: taskData[0]?.task,
      subtitle: taskData[0]?.subtitle,
      condition: taskData[0]?.condition,
      variables: variables,
      data: taskData,
    };
  });
  return dataByTask;
};

export default function Database({ data, variables }) {
  const formatedData = processByTask({ data: data });

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
        <div></div>
      </div>

      <Accordion exclusive={false} fluid>
        {formatedData.map((task, index) => (
          <>
            <Accordion.Title
              active={activeIndex.includes(index)}
              index={index}
              onClick={handleClick}
            >
              <div className="task">
                <Icon name="dropdown" />
                <div>
                  <div className="title">{task?.title}</div>
                  <div className="subtitle">{task?.subtitle || task?.id}</div>
                </div>
              </div>
            </Accordion.Title>
            <Accordion.Content active={activeIndex.includes(index)}>
              <div className="variables">
                {task?.variables.map((variable) => (
                  <div className="variable"># {variable}</div>
                ))}
              </div>
            </Accordion.Content>
          </>
        ))}
      </Accordion>
    </div>
  );
}
