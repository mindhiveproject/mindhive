import ReactHtmlParser from "react-html-parser";

export default function Presenter({ content }) {
  return <>{ReactHtmlParser(content)}</>;
}
