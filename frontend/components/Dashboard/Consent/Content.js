import { useState } from "react";
import { Tab } from "semantic-ui-react";

import ContentBlock from "./ContentBlock";

export default function ConsentContent({ info, handleChange }) {
  const [index, setIndex] = useState(0);

  const handleTabChange = (e, data) => {
    setIndex(data?.activeIndex);
  };

  const updateInfo = ({ content, index }) => {
    handleChange({
      target: {
        name: "info",
        value: [
          ...info.map((block, i) => {
            if (i === index) {
              return {
                ...block,
                content: content,
              };
            } else {
              return block;
            }
          }),
        ],
      },
    });
  };

  return (
    <Tab
      menu={{ fluid: true, vertical: true, tabular: true }}
      panes={[...info].map((block, i) => ({
        menuItem: block?.description,
        render: () => (
          <Tab.Pane>
            <ContentBlock
              key={i}
              index={index}
              block={block}
              updateInfo={updateInfo}
            />
          </Tab.Pane>
        ),
      }))}
      defaultActiveIndex={index}
      onTabChange={handleTabChange}
    />
  );
}
