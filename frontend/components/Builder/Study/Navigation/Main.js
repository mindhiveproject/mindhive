import { useQuery, useMutation } from "@apollo/client";
import Link from "next/link";

// import CreateStudy from "./Create";
// import UpdateStudy from "./Update";
import Connect from "./Connect/Main";
import StudyOptions from "../../../Studies/Bank/StudyOptions";

import { MY_STUDY } from "../../../Queries/Study";

const items = [
  {
    value: "proposal",
    name: "Proposal",
  },
  {
    value: "page",
    name: "Participant Page",
  },
  {
    value: "builder",
    name: "Study builder",
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
];

export default function Navigation({
  query,
  user,
  tab,
  saveBtnName,
  saveBtnFunction,
}) {
  const { area, selector } = query;
  const toggleSlidebar = () => {};

  const studyId = query?.selector;

  const { data, error, loading } = useQuery(MY_STUDY, {
    variables: { id: studyId },
  });
  const study = data?.study || {
    title: "",
    description: "",
    collaborators: [],
    classes: [],
    consent: [],
  };

  return (
    <div className="navigation">
      <div className="firstLine">
        <div className="leftPanel">
          <div className="goBackBtn">
            <Link
              href={{
                pathname: `/dashboard/develop/studies`,
              }}
            >
              ←
            </Link>
          </div>
          <div>
            <span className="studyTitle">{study?.title}</span>
          </div>
        </div>
        <div className="rightPanel">
          <Connect study={study} user={user} />
          <div className="icon" onClick={toggleSlidebar}>
            <img src="/assets/icons/chat.svg" />
          </div>

          <div className="icon">
            <StudyOptions user={user} study={study} />
          </div>
          {/* {study?.id ? (
            <UpdateStudy study={study} user={user} />
          ) : (
            <CreateStudy study={study} user={user} />
          )} */}
          {saveBtnFunction && 
            <button onClick={() => saveBtnFunction()}>{saveBtnName}</button>
          }
        </div>
      </div>

      <div className="secondLine">
        <div className="menu">
          {items.map((item, i) => (
            <Link
              key={i}
              href={{
                pathname: `/builder/studies`,
                query: {
                  selector,
                  tab: item?.value,
                },
              }}
            >
              <div
                className={
                  tab === item?.value
                    ? "menuTitle selectedMenuTitle"
                    : "menuTitle"
                }
              >
                <div className="titleWithIcon">
                  <img src={`/assets/icons/builder/${item?.value}.svg`} />
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
