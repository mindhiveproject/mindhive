import { useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import Link from "next/link";
import useTranslation from "next-translate/useTranslation";

import Connect from "./Connect/Main";
import ConnectStudy from "./ConnectStudy/Main";

import { PROPOSAL_QUERY } from "../../../Queries/Proposal";
import StudyDropdown from "../../../Projects/StudyConnector/StudyDropdown";

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
  const { t } = useTranslation("builder");

  const { area, selector } = query;

  const { data, error, loading } = useQuery(PROPOSAL_QUERY, {
    variables: { id: proposalId },
  });
  const project = data?.proposalBoard || {
    title: "",
  };

  // Check if user has Admin permission
  const isAdmin = user?.permissions?.some(
    (permission) => permission.name === "ADMIN"
  );

  const tryToLeave = (e) => {
    if (hasStudyChanged) {
      if (!confirm(t("unsavedChangesWarning"))) {
        e.preventDefault();
      }
    }
  };

  const items = [
    {
      value: "board",
      name: t("projectBoard"),
    },
    {
      value: "builder",
      name: t("studyBuilder"),
    },
    {
      value: "page",
      name: t("participantPage"),
    },
    {
      value: "review",
      name: t("review.review"),
    },
    {
      value: "collect",
      name: t("testAndCollect"),
    },
    {
      value: "visualize",
      name: t("visualize"),
    },
    {
      value: "journal",
      name: t("dataJournals"),
      requiresAdmin: true, // Add flag to indicate admin-only item
    },
  ];

  // Filter items based on admin permission
  const filteredItems = items.filter(
    (item) => !item.requiresAdmin || (item.requiresAdmin && isAdmin)
  );

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
            <span className="title">{t("studyManager.project")} </span>{" "}
            {project?.title}
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
        <div className="menu" id="menue">
          {filteredItems.map((item, i) => (
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
