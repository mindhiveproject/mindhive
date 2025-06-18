import { useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import Link from "next/link";

import Connect from "./Connect/Main";
import ConnectStudy from "./ConnectStudy/Main";

import { PROPOSAL_QUERY } from "../../../Queries/Proposal";
import StudyDropdown from "../../../Projects/StudyConnector/StudyDropdown";

const items = [
  {
    value: "board",
    name: "Project Board",
  },
  {
    value: "builder",
    name: "Study builder",
  },
  {
    value: "page",
    name: "Participant Page",
  },
  {
    value: "review",
    name: "Review",
  },
  {
    value: "collect",
    name: "Test & Collect",
  },
  {
    value: "visualize",
    name: "Visualize",
  },
  {
    value: "journal",
    name: "Data Journals 🚧",
  },
];

export default function Navigation({
  proposalId,
  query,
  tab,
  user,
  saveBtnName,
  saveBtnFunction,
  toggleSidebar,
  hasStudyChanged,
  cardId,
  onUpdateCard,
  isCanvasLocked,
}) {
  const router = useRouter();

  const { area, selector } = query;

  const { data, error, loading } = useQuery(PROPOSAL_QUERY, {
    variables: { id: proposalId },
  });
  const project = data?.proposalBoard || {
    title: "",
  };

  // const toggleChatSidebar = () => {
  //   const [talk] = study?.talks;
  //   toggleSidebar({ chatId: talk?.id });
  // };

  const tryToLeave = (e) => {
    if (hasStudyChanged) {
      if (
        !confirm(
          "Your unsaved changes will be lost. Click Cancel to return and save the changes."
        )
      ) {
        e.preventDefault();
      }
    }
  };

  return (
    <div className="navigation">
      <div className="firstLine">
        <div className="leftPanel">
          <div className="goBackBtn">
            <Link
              href={{
                pathname: `/dashboard/develop/projects`,
              }}
              onClick={tryToLeave}
            >
              ←
            </Link>
          </div>
        </div>
        <div className="middle">
          <div className="studyTitle">
            <span className="title">Project </span> {project?.title}
          </div>
          {project?.study && (
            <div className="studyTitle">
              <StudyDropdown user={user} project={project} />
            </div>
          )}
        </div>
        <div className="right">
          {tab === "board" ? (
            <Connect project={project} user={user} />
          ) : (
            <ConnectStudy study={project?.study} user={user} />
          )}

          {cardId && (
            <button
              onClick={async () => {
                await saveBtnFunction();
                router.push({
                  pathname: `/builder/projects/`,
                  query: {
                    selector: proposalId,
                  },
                });
              }}
              className={
                hasStudyChanged || area === "cloneofstudy" ? "on" : "off"
              }
            >
              {saveBtnName}
            </button>
          )}

          {saveBtnFunction && !isCanvasLocked && (
            <button
              onClick={() => saveBtnFunction()}
              className={
                hasStudyChanged || area === "cloneofstudy" ? "on" : "off"
              }
            >
              {saveBtnName}
            </button>
          )}
        </div>
      </div>

      <div className="secondLine">
        <div className="menu">
          {items.map((item, i) => (
            <Link
              key={i}
              href={{
                pathname: `/builder/${area}`,
                query: {
                  selector,
                  tab: item?.value,
                },
              }}
              onClick={tryToLeave}
            >
              <div
                className={
                  tab === item?.value
                    ? "menuTitle selectedMenuTitle"
                    : "menuTitle"
                }
              >
                <div className="titleWithIcon">
                  <img src={`/assets/icons/project/${item?.value}.svg`} />
                  <p>{item?.name}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
