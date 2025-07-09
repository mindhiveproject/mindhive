import { useState } from "react";
import ReactHtmlParser from "react-html-parser";
import { Menu } from "semantic-ui-react";
import Link from "next/link";
import useTranslation from "next-translate/useTranslation";

export default function StudyInfo({ query, canReview, study }) {
  const { t } = useTranslation("builder");
  const [tab, setTab] = useState(query?.tab || "Why");

  const additionalTabs =
    study?.info?.filter((p) => p.name.startsWith("tab")) || [];

  const tabs = [
    {
      name: "why",
      header: t("reviewTabs.whyTab"),
    },
    {
      name: "how",
      header: t("reviewTabs.howTab"),
    },
    {
      name: "who",
      header: t("reviewTabs.whoTab"),
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
          {(study?.status === "IN_REVIEW" ||
            study?.status === "COLLECTING_DATA") && (
            <a
              href={`/dashboard/discover/studies/?name=${study?.slug}`}
              target="_blank"
              rel="noreferrer"
            >
              <div className="option">
                <img src="/assets/icons/review/participate-green.svg" />
                <div className="p22">{t("review.participate")}</div>
              </div>
            </a>
          )}

          {study?.status !== "COLLECTING_DATA" && (
            <Link
              href={{
                pathname: `/dashboard/review/comment`,
                query: { id: study?.id },
              }}
            >
              <div className="option">
                <img src="/assets/icons/review/comment.svg" />
                <div className="p22">
                  {canReview ? t("review.commentBtn") : t("reviewDetail.viewFeedback")}
                </div>
              </div>
            </Link>
          )}
        </div>
      </div>

      {canReview || true ? (
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
          <div className="p18">{t("reviewDetail.cannotViewSection")}</div>
          <div>
            {t("reviewDetail.cannotViewSectionDescription")}
          </div>
        </div>
      )}
    </div>
  );
}
