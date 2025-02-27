import { useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import Link from "next/link";

import Connect from "./Connect/Main";
import ConnectStudy from "./ConnectStudy/Main";

import { Dropdown, DropdownMenu } from "semantic-ui-react";

import { PROPOSAL_QUERY } from "../../../Queries/Proposal";

const items = [
  {
    value: "board",
    name: "Project Board",
  },
  {
    value: "builder",
    name: "Study builder",
  },
  // {
  //   value: "review",
  //   name: "Review",
  // },
  {
    value: "page",
    name: "Participant Page",
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
    value: "exit",
    name: "Exit Study Builder",
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
      <div className="left">
        <div className="selector">
          <Dropdown
            upward={false}
            icon={null}
            trigger={
              <div className="icon">
                <img src="/assets/icons/project/list.svg" />
              </div>
            }
          >
            <Dropdown.Menu>
              {items
                .filter((item) => item.value !== "exit")
                .map((item, i) => (
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
                    <Dropdown.Item>
                      <div className="option">
                        <img src={`/assets/icons/project/${item?.value}.svg`} />
                        <p>{item?.name}</p>
                      </div>
                    </Dropdown.Item>
                  </Link>
                ))}
              {items
                .filter((item) => item.value === "exit")
                .map((item, i) => (
                  <Link
                    key={i}
                    href={{
                      pathname: `/dashboard/develop`,
                    }}
                    onClick={tryToLeave}
                  >
                    <Dropdown.Item>
                      <div className="option">
                        <img src={`/assets/icons/project/${item?.value}.svg`} />
                        <p>{item?.name}</p>
                      </div>
                    </Dropdown.Item>
                  </Link>
                ))}
            </Dropdown.Menu>
          </Dropdown>

          {items
            .filter((item) => item?.value === tab)
            .map((item) => item?.name)}
        </div>
      </div>
      <div className="middle">
        <span className="studyTitle">{project?.title}</span>
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
      </div>
    </div>
  );
}
