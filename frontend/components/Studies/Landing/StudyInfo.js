import { useEffect, useState } from "react";
import ReactHtmlParser from "react-html-parser";
import { Menu } from "semantic-ui-react";

export default function StudyInfo({ query, user, study, isDashboard }) {
  const [tab, setTab] = useState(query?.tab);

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

  // do not display empty tabs
  const filteredTabs = tabs.filter(
    (tab) =>
      (!!tab.text && tab?.text !== "") ||
      (tab?.name === "what" &&
        study?.info?.filter((p) => p?.name === "what").length) ||
      (tab?.name === "who" &&
        study?.info?.filter((p) => p?.name === "who").length) ||
      (tab?.name === "why" &&
        study?.info?.filter((p) => p?.name === "why").length)
  );

  // by default display the first tab
  useEffect(() => {
    async function updateTab() {
      setTab(filteredTabs[0]?.header);
    }
    if (filteredTabs && filteredTabs.length && !tab) {
      updateTab();
    }
  }, [filteredTabs]);

  // parse study information
  const infoBlocks =
    study?.info?.reduce((acc, el) => {
      acc[el.name] = el.text;
      return acc;
    }, {}) || {};

  const faq =
    study?.info &&
    study.info
      .filter((i) => i.name.startsWith("faq") && i.text)
      .map((i) => ({
        key: `panel-${i.name}`,
        title: i.header,
        content: ReactHtmlParser(i.text),
      }));
  const timeToComplete =
    study?.info &&
    study.info
      .filter((i) => i.name === "time" && i.text)
      .map((i) => i.text)
      .map((i) => ReactHtmlParser(i));
  const frequency =
    study?.info &&
    study.info
      .filter((i) => i.name === "frequency" && i.text)
      .map((i) => i.text)
      .map((i) => ReactHtmlParser(i));
  const partnership =
    study?.info &&
    study.info
      .filter((i) => i.name.startsWith("partners") && i.text)
      .map((i) => {
        const src = i.file;
        return <img key={src} src={src} alt="icon" />;
      });
  const tags =
    study?.info &&
    study.info
      .filter((i) => i.name.startsWith("tag") && i.text)
      .map((i, n) => (
        <div className="studyTag" key={n}>
          {ReactHtmlParser(i.text)}
        </div>
      ));
  const contacts =
    study?.info &&
    study.info
      .filter((i) => i.name.startsWith("contact") && i.text)
      .map((i, n) => <div key={n}>{ReactHtmlParser(i.text)}</div>);
  const more =
    study?.info &&
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
            {filteredTabs.map((atab, num) => (
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

        {filteredTabs.map((atab, num) => (
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
