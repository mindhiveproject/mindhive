import Link from "next/link";
import CloneStudyBank from "../../../Studies/Bank/Clone";
import CloneTaskBank from "../../../Tasks/Bank/Clone";

const mainOptions = [
  {
    develop: "study",
    header: "Study",
    description: `A study is a research project with a research question. It can
  consist of multiple tasks and/or surveys.`,
  },
  {
    develop: "task",
    header: "Task",
    description: ` In a task, participants are asked to perform specific actions
    (e.g., press a button) based on what they see or hear.`,
  },
  {
    develop: "survey",
    header: "Survey",
    description: `In a survey, participants are asked questions about
    themselves, about how they behave, or about how they feel.`,
  },
  {
    develop: "block",
    header: "Block",
    description: `In a block, participants are presented with information.`,
  },
];

export default function Selector({ query, user }) {
  const { develop, clone } = query;

  if (!develop) {
    return (
      <div className="selectionBody">
        <h1>What would you like to develop?</h1>

        <div className="studyOptions">
          {mainOptions.map((option) => (
            <Link
              key={option.action}
              className="option"
              href={{
                pathname: "/dashboard/develop/new",
                query: {
                  develop: option?.develop,
                },
              }}
            >
              <div className="iconSelect">
                <img
                  src={`/assets/develop/${option?.develop}.svg`}
                  alt="icon"
                  width="50"
                />
              </div>
              <h3>{option.header}</h3>
              <p>{option.description}</p>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  if (develop === "study") {
    if (clone === "true") {
      return <CloneStudyBank user={user} />;
    }
    return (
      <div className="selectionBody">
        <h1>Develop a study</h1>

        <div className="studyOptions">
          <Link
            className="option"
            href={{
              pathname: "/dashboard/develop/new",
              query: {
                develop: "study",
                clone: "true",
              },
            }}
          >
            <div className="iconSelect">
              <img
                src={`/assets/develop/clone-study.svg`}
                alt="icon"
                width="50"
              />
            </div>
            <h3>Clone & modify a study</h3>
            <p>Build a study based on a pre-existing MindHive study.</p>
          </Link>

          <Link
            className="option"
            href={{
              pathname: "/builder/studies/add",
            }}
          >
            <div className="iconSelect">
              <img
                src={`/assets/develop/new-study.svg`}
                alt="icon"
                width="50"
              />
            </div>
            <h3>Start a study from scratch</h3>
            <p>Build a study based on a pre-existing MindHive study.</p>
          </Link>
        </div>
      </div>
    );
  }

  if (develop === "task" || develop === "survey") {
    if (clone === "true") {
      return <CloneTaskBank user={user} taskType={develop} />;
    }
    return (
      <div>
        <h1>Develop a {develop}</h1>
        <div className="studyOptions">
          <Link
            className="option"
            href={{
              pathname: "/dashboard/develop/new",
              query: {
                develop,
                clone: "true",
              },
            }}
          >
            <div className="iconSelect">
              <img
                src={`/assets/develop/clone-study.svg`}
                alt="icon"
                width="50"
              />
            </div>
            <h3>Clone & modify a {develop}</h3>
            <p>
              {develop === "task"
                ? "Build a task based on a pre-existing MindHive task."
                : "Duplicate and edit a pre-existing MindHive survey and its parameters."}
            </p>
          </Link>

          {develop === "survey" && (
            <Link
              className="option"
              href={{
                pathname: `/builder/cloneofsurvey`,
                query: {
                  selector: "survey-builder",
                },
              }}
            >
              <div className="iconSelect">
                <img
                  src={`/assets/develop/survey-builder.svg`}
                  alt="icon"
                  width="50"
                />
              </div>
              <h3>Use the Survey Builder</h3>
              <p>
                Select this option if you would prefer to build a survey
                entirely from scratch.
              </p>
            </Link>
          )}

          <Link
            className="option"
            href={{
              pathname: `/builder/${develop}s/add`,
            }}
          >
            <div className="iconSelect">
              <img
                src={`/assets/develop/clone-study.svg`}
                alt="icon"
                width="50"
              />
            </div>
            <h3>Upload a {develop} from lab.js</h3>
            <p>
              {develop === "task"
                ? "Select this option if you would prefer to upload your own task script from lab.js."
                : "Select this option if you would prefer to upload your own survey script from lab.js."}
            </p>
          </Link>

          <Link
            className="option"
            href={{
              pathname: `/builder/${develop}s/addexternal`,
            }}
          >
            <div className="iconSelect">
              <img src={`/assets/develop/task.svg`} alt="icon" width="50" />
            </div>
            <h3>Add an external {develop} with a web link</h3>
            <p>
              Select this option if you would prefer to add an external link
            </p>
          </Link>
        </div>
      </div>
    );
  }

  if (develop === "block") {
    return <CloneTaskBank user={user} taskType={develop} />;
  }
}
