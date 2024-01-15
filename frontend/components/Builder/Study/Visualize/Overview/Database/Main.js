import { useState } from "react";
import { Accordion, Icon } from "semantic-ui-react";

export default function Database({ data }) {
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
        {data.map((task, index) => (
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
