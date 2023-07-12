import Head from "next/head";
import ReactHtmlParser from "react-html-parser";

import Carousel from "./Carousel";

export default function MainDocument({ title, content }) {
  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>

      <div>
        <h1>{title}</h1>
        {title === "About" && <Carousel />}
        {ReactHtmlParser(content)}
      </div>
    </>
  );
}
