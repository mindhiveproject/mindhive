import { useState } from "react";
import ReactHtmlParser from "react-html-parser";
import {
  Menu,
  AccordionTitle,
  AccordionContent,
  Accordion,
} from "semantic-ui-react";

export default function StudyInfo({ query, user, study, isDashboard }) {
  const [tab, setTab] = useState(query?.tab || "What");

  const additionalTabs =
    study?.info?.filter((p) => p.name.startsWith("tab")) || [];

  const tabs = [
    // {
    //   name: "what",
    //   header: "What",
    // },
    {
      name: "why",
      header: "Why",
    },
    {
      name: "who",
      header: "Who",
    },

    ...additionalTabs,
  ];

  // parse study information
  const infoBlocks =
    study?.info?.reduce((acc, el) => {
      acc[el.name] = el.text;
      return acc;
    }, {}) || {};

  const panels = tabs.map((tab, i) => ({
    key: `panel-${i}`,
    title: tab?.header,
    content: infoBlocks && ReactHtmlParser(infoBlocks[tab?.name]),
  }));

  const AccordionExampleExclusive = () => (
    <Accordion
      defaultActiveIndex={[0]}
      panels={panels}
      exclusive={false}
      fluid
    />
  );

  return (
    <div>
      <AccordionExampleExclusive />
    </div>
  );
}
