import Link from "next/link";

import Tools from "./Tools";
import Program from "./Program";
import NotionData from "./NotionData.js";


import { StyledTeachersInfo } from "../../styles/StyledDocument";

export default function TeachersInformation() {
  const pageId = process.env.NEXT_PUBLIC_NOTION_TEACHERS_PAGE_ID; 

  return (
    <NotionData pageId={pageId} />
  );
}
