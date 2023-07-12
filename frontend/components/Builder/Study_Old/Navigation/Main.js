import Link from "next/link";

import CreateStudy from "./Create";
import UpdateStudy from "./Update";
import Connect from "./Connect/Main";
import StudyOptions from "../../../Studies/Bank/StudyOptions";

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
  tab,
  setTab,
  study,
  user,
  handleChange,
  saveDiagramState,
  toggleSlidebar,
}) {
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
          <Connect study={study} user={user} handleChange={handleChange} />
          <div className="icon" onClick={toggleSlidebar}>
            <img src="/assets/icons/chat.svg" />
          </div>

          <div className="icon">
            <StudyOptions user={user} study={study} />
          </div>
          {study?.id ? (
            <UpdateStudy
              study={study}
              user={user}
              saveDiagramState={saveDiagramState}
            />
          ) : (
            <CreateStudy
              study={study}
              user={user}
              saveDiagramState={saveDiagramState}
            />
          )}
        </div>
      </div>

      <div className="secondLine">
        <div className="menu">
          {items.map((item, i) => (
            <div key={i} onClick={() => setTab(item?.value)}>
              <div
                key={i}
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
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
