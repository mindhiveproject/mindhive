import { useState } from "react";
import ReactHtmlParser from "react-html-parser";
import { Menu } from "semantic-ui-react";
import Link from "next/link";

export default function StudyInfo({ query, canReview, study }) {
  const [tab, setTab] = useState(query?.tab || "Why");

  const additionalTabs =
    study?.info?.filter((p) => p.name.startsWith("tab")) || [];

  const tabs = [
    {
      name: "why",
      header: "Why",
    },
    {
      name: "how",
      header: "How",
    },
    {
      name: "who",
      header: "Who",
    },
    ...additionalTabs,
  ];

  // parse study information
  const infoBlocks =
    study?.info?.reduce((acc, el) => {
      acc[el.name] = el.text;
      return acc;
    }, {}) || {};

  return (
    <div className="studyWhatWhoHow">
      <div className="navTopLine">
        <div className="descriptionMenu">
          <Menu tabular stackable>
            {tabs.map((atab, num) => (
              <div key={num}>
                <Menu.Item
                  key={num}
                  name={atab.name}
                  active={tab === atab.header}
                  onClick={() => setTab(atab.header)}
                >
                  {atab.header}
                </Menu.Item>
              </div>
            ))}
          </Menu>
        </div>
        <div className="options">
          {study?.status === "IN_REVIEW" && (
            <a
              href={`/dashboard/discover/studies/?name=${study?.slug}`}
              target="_blank"
              rel="noreferrer"
            >
              <div className="option">
                <img src="/assets/icons/review/participate-green.svg" />
                <div className="p22">Participate</div>
              </div>
            </a>
          )}
          <Link
            href={{
              pathname: `/dashboard/review/comment`,
              query: { id: study?.id },
            }}
          >
            <div className="option">
              <img src="/assets/icons/review/comment.svg" />
              <div className="p22">
                {canReview ? `Comment` : `View Feedback`}
              </div>
            </div>
          </Link>
        </div>
      </div>

      {canReview ? (
        <div>
          {tabs.map((atab, num) => (
            <div key={num}>
              {tab === atab.header && (
                <div className="content">
                  {infoBlocks && ReactHtmlParser(infoBlocks[atab.name])}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="noStudyDetailsContainer">
          <div className="p18">You cannot view this section yet</div>
          <div>
            To access this section, you must review or participate in the study
            once it moves beyond the proposal phase.
          </div>
        </div>
      )}
    </div>
  );
}
