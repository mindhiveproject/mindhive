import Link from "next/link";
import CloneStudyBank from "../../../Studies/Bank/Clone";
import CloneTaskBank from "../../../Tasks/Bank/Clone";
import useTranslation from "next-translate/useTranslation";

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
  const { t } = useTranslation("builder");
  const { develop, clone } = query;
  const userPermissions = user.permissions.map(
    (permission) => permission?.name
  );

  if (!develop) {
    return (
      <div className="selectionBody">
        <h1>{t("whatWouldYouLikeToDevelop")}</h1>
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
              <h3>{t(option.header.toLowerCase())}</h3>
              <p>{t(option.develop + "Description")}</p>
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
            <h3>{t("cloneAndModify", { taskType: t("study") })}</h3>
            <p>{t("buildStudyFromExisting")}</p>
            {(userPermissions.includes("ADMIN") ||
              userPermissions.includes("STUDENT")) && (
              <p>{t("teacherExplicitInstruction")}</p>
            )}
          </Link>

          {(userPermissions.includes("ADMIN") ||
            userPermissions.includes("STUDENT")) && (
            <Link
              className="option"
              href={{
                pathname: "/builder/projects/start",
              }}
            >
              <div className="iconSelect">
                <img
                  src={`/assets/develop/new-study.svg`}
                  alt="icon"
                  width="50"
                />
              </div>
              <h3>{t("startMindHiveProject")}</h3>
              <p></p>
            </Link>
          )}

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
            <h3>{t("startStudyFromScratch")}</h3>
            <p>{t("createStudyWithoutProject")}</p>
            {(userPermissions.includes("ADMIN") ||
              userPermissions.includes("STUDENT")) && (
              <p>{t("teacherExplicitInstruction")}</p>
            )}
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
      <div className="selectionBody">
        <h1>{t("developA", { develop: t(develop) })}</h1>
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
            <h3>{t("cloneAndModify", { taskType: t(develop) })}</h3>
            <p>{t(develop === "task" ? "buildTaskFromExisting" : "duplicateEditSurvey")}</p>
          </Link>

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
            <h3>{t("uploadFromLabjs", { develop: t(develop) })}</h3>
            <p>{t(develop === "task" ? "uploadTaskScript" : "uploadSurveyScript")}</p>
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
            <h3>{t("addExternalWithLink", { develop: t(develop) })}</h3>
            <p>{t("addExternalLinkInstruction")}</p>
          </Link>
        </div>
      </div>
    );
  }

  if (develop === "block") {
    if (clone === "true") {
      return <CloneTaskBank user={user} taskType={develop} />;
    }

    return (
      <div className="selectionBody">
        <h1>{t("developA", { develop: t(develop) })}</h1>
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
            <h3>{t("cloneAndModify", { taskType: t(develop) })}</h3>
            <p>{t("duplicateEditBlock")}</p>
          </Link>

          <Link
            className="option"
            href={{
              pathname: `/builder/cloneofblock`,
              query: {
                selector: "block",
              },
            }}
          >
            <div className="iconSelect">
              <img src={`/assets/develop/block.svg`} alt="icon" width="50" />
            </div>
            <h3>{t("createNewBlock")}</h3>
            <p>{t("buildBlockFromScratch")}</p>
          </Link>
        </div>
      </div>
    );
  }
}
