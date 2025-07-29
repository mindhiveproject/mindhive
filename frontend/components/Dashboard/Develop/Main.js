import Link from "next/link";
import useTranslation from "next-translate/useTranslation";
import Trans from "next-translate/Trans";
import { useEffect } from 'react';

import Selector from "./DevelopNew/Selector";
import Panels from "./Panels";

import { StyledSelector } from "../../styles/StyledSelector";

export default function DevelopMain({ query, user }) {
  const { t } = useTranslation("builder");

  const { selector } = query;
  let developNewQuery;
  switch (selector) {
    case "studies":
      developNewQuery = "study";
      break;
    case "tasks":
      developNewQuery = "task";
      break;
    case "surveys":
      developNewQuery = "survey";
      break;
    case "blocks":
      developNewQuery = "block";
      break;
    default:
      developNewQuery = "study";
  }

  useEffect(() => {
    function handleStartTour() {
      (async () => {
        const introJs = (await import('intro.js')).default;
        introJs.tour().setOptions({
          steps: [
            {
              element: '#developNewBtn',
              intro: "Click here to start developing a new study, task, survey, or block.",
              position: "bottom",
              disableInteraction: false
            },
            {
              element: '#myPanel', // this id is in the Panels component
              intro: "Click on the tab bellow to see the projects, studies, tasks, surveys, and blocks you have created.",
              position: "auto",
              disableInteraction: false,
            }
          ],
          scrollToElement: false,
          scrollTo: 'off',
        }).start();
      })();
    }
    window.addEventListener('start-walkthrough-tour', handleStartTour);
    return () => window.removeEventListener('start-walkthrough-tour', handleStartTour);
  }, []);

  if (selector === "new") {
    return (
      <StyledSelector>
        <Selector query={query} user={user} />
      </StyledSelector>
    );
  }

  return (
    <>
      <h1>{t("develop")}</h1>
      <div className="header">
        <div>
          <p>
            <Trans
              i18nKey="builder:developHeaderDescription"
              components={[<strong />]}
            />
          </p>
        </div>
        <div>
          <Link
            href={{
              pathname: `/dashboard/develop/new`,
              query: { develop: developNewQuery },
            }}
          >
            <button id="developNewBtn"> {t("developNew")} </button>
          </Link>
        </div>
      </div>
      <Panels query={query} user={user} />
    </>
  );
}

// Indicate this page has a tour
DevelopMain.hasTour = true;
