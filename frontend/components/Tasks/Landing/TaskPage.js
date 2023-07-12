import Head from "next/head";
import Link from "next/link";
import ReactHtmlParser from "react-html-parser";

import { StyledTaskPage } from "../../styles/StyledTaskPage";

export default function TaskPage({ user, task }) {
  return (
    <StyledTaskPage>
      <Head>
        <title>MindHive | {task?.title}</title>
      </Head>

      <div className="taskDescription">
        {task?.image && (
          <div className="taskImage">
            <img src={task?.image} alt={task?.title} />
          </div>
        )}

        <div className="taskTitleDescriptionBtns">
          <h1>{task?.title}</h1>
          <div className="taskDescription">
            <h3>{ReactHtmlParser(task?.description)}</h3>
          </div>

          <div className="controlBtns">
            <a
              target="_blank"
              href={`/preview/${task?.taskType?.toLowerCase()}/${task?.id}`}
            >
              <button>Preview</button>
            </a>
          </div>
        </div>
      </div>
    </StyledTaskPage>
  );
}
