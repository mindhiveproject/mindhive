import Head from "next/head";
import ReactHtmlParser from "react-html-parser";

import Carousel from "./Carousel";

import { StyledDocumentPage } from "../styles/StyledDocument";

export default function MainDocument({ title, content }) {
  return (
    <StyledDocumentPage>
      <Head>
        <title>{title}</title>
      </Head>

      <div className="main">
        <h1>{title}</h1>
        {/* {title === "About" && <Carousel />} */}
        {ReactHtmlParser(content)}
      </div>
    </StyledDocumentPage>
  );
}
