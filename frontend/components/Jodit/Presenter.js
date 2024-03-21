import ReactHtmlParser from "react-html-parser";

export default function Presenter({ content }) {
  return (
    <>
      <div>Button</div>
      <div>{ReactHtmlParser(content)}</div>
    </>
  );
}
