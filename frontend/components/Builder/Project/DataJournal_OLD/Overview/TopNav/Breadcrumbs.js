import { Breadcrumb } from "semantic-ui-react";

export default function Breadcrumbs({ part, chapter, section }) {
  const sections = [
    { key: "Home", content: part?.title, link: true },
    { key: "Store", content: chapter?.title, link: true },
    { key: "Shirt", content: section?.title, active: true },
  ];

  return <Breadcrumb size="massive" icon="right angle" sections={sections} />;
}
