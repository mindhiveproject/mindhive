import Link from "next/link";
import ReactHtmlParser from "react-html-parser";
import { Menu } from "semantic-ui-react";

export default function StudyInfo({ query, user, study }) {
  const tab = query?.tab || "What";

  const additionalTabs =
    study?.info?.filter((p) => p.name.startsWith("tab")) || [];

  const tabs = [
    {
      name: "what",
      header: "What",
    },
    {
      name: "who",
      header: "Who",
    },
    {
      name: "why",
      header: "Why",
    },
    ...additionalTabs,
  ];

  // parse study information
  const infoBlocks =
    study?.info?.reduce((acc, el) => {
      acc[el.name] = el.text;
      return acc;
    }, {}) || {};

  const faq =
    study.info &&
    study.info
      .filter((i) => i.name.startsWith("faq") && i.text)
      .map((i) => ({
        key: `panel-${i.name}`,
        title: i.header,
        content: ReactHtmlParser(i.text),
      }));
  const timeToComplete =
    study.info &&
    study.info
      .filter((i) => i.name === "time" && i.text)
      .map((i) => i.text)
      .map((i) => ReactHtmlParser(i));
  const frequency =
    study.info &&
    study.info
      .filter((i) => i.name === "frequency" && i.text)
      .map((i) => i.text)
      .map((i) => ReactHtmlParser(i));
  const partnership =
    study.info &&
    study.info
      .filter((i) => i.name.startsWith("partners") && i.text)
      .map((i) => {
        const src = i.file;
        return <img key={src} src={src} alt="icon" />;
      });
  const tags =
    study.info &&
    study.info
      .filter((i) => i.name.startsWith("tag") && i.text)
      .map((i, n) => (
        <div className="studyTag" key={n}>
          {ReactHtmlParser(i.text)}
        </div>
      ));
  const contacts =
    study.info &&
    study.info
      .filter((i) => i.name.startsWith("contact") && i.text)
      .map((i, n) => <div key={n}>{ReactHtmlParser(i.text)}</div>);
  const more =
    study.info &&
    study.info
      .filter((i) => i.name === "more")
      .map((i) => ReactHtmlParser(i.text));

  return (
    <div>
      <div className="studyInfoTimePartners">
        <div className="timeFrequency">
          {timeToComplete && timeToComplete.length ? (
            <div>
              <div className="studyInformationHeader">Time to complete</div>
              <div>{timeToComplete}</div>
            </div>
          ) : (
            <div></div>
          )}

          {frequency && frequency.length ? (
            <div>
              <div className="studyInformationHeader">Frequency</div>
              <div>{frequency}</div>
            </div>
          ) : (
            <div></div>
          )}
        </div>

        {partnership && partnership.length ? (
          <div>
            <div className="studyInformationHeader">In partnership with</div>
            <div className="partnersInfo">{partnership}</div>
          </div>
        ) : (
          <div></div>
        )}
      </div>
      <div className="studyTagsContacts">
        {tags && tags.length ? (
          <div>
            <div className="studyInformationHeader">Tags</div>
            <div className="studyTags">{tags}</div>
          </div>
        ) : (
          <div></div>
        )}

        {contacts && contacts.length ? (
          <div>
            <div className="studyInformationHeader">Contact information</div>
            <div>{contacts}</div>
          </div>
        ) : (
          <div></div>
        )}
      </div>
      <div className="studyWhatWhoHow">
        <div className="descriptionMenu">
          <Menu tabular stackable>
            {tabs.map((atab, num) => (
              <Link
                key={num}
                href={{
                  pathname: `/studies/${study?.slug}`,
                  query: { tab: atab.header },
                }}
              >
                <Menu.Item name={atab.name} active={tab === atab.header}>
                  {atab.header}
                </Menu.Item>
              </Link>
            ))}
          </Menu>
        </div>

        {tabs.map((atab, num) => (
          <div key={num}>
            {tab === atab.header && (
              <div>{infoBlocks && ReactHtmlParser(infoBlocks[atab.name])}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
