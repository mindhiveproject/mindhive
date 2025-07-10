import { useState } from "react";
import ReactHtmlParser from "react-html-parser";
import {
  Menu,
  AccordionTitle,
  AccordionContent,
  Accordion,
} from "semantic-ui-react";
import useTranslation from "next-translate/useTranslation";

export default function StudyInfo({ query, user, study, isDashboard }) {
  const { t } = useTranslation("builder");
  const [tab, setTab] = useState(query?.tab || "What");

  const additionalTabs =
    study?.info?.filter((p) => p.name.startsWith("tab")) || [];

  const tabs = [
    {
      name: "why",
      header: t("reviewTabs.whyTab"),
    },
    {
      name: "how",
      header: t("reviewTabs.howTab"),
    },
    {
      name: "who",
      header: t("reviewTabs.whoTab"),
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
