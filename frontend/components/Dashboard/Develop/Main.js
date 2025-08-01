import Link from "next/link";
import useTranslation from "next-translate/useTranslation";
import Trans from "next-translate/Trans";
import { useEffect } from 'react';

import Selector from "./DevelopNew/Selector";
import Panels from "./Panels";
import { developTours } from "./tours";

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
    let currentTour = null;
    let isStartingTour = false;
    
    function handleStartTour(event) {
      const tourId = event?.detail?.tourId || 'overview';
      
      // Prevent multiple tours from starting simultaneously
      if (isStartingTour) {
        console.log('Tour already starting, ignoring request');
        return;
      }
      
      isStartingTour = true;
      
      // Exit any existing tour first
      if (currentTour) {
        currentTour.exit();
        currentTour = null;
      }
      
      (async () => {
        const introJs = (await import('intro.js')).default;
        const tours = developTours;
        const selectedTour = tours[tourId];
        
        if (!selectedTour) {
          console.error(`Tour ${tourId} not found`);
          isStartingTour = false;
          return;
        }

        // Create new tour instance
        currentTour = introJs.tour();
        currentTour.setOptions({
          steps: selectedTour.steps,
          scrollToElement: false,
          scrollTo: 'off',
          exitOnOverlayClick: true,
          exitOnEsc: true,
          showBullets: true,
        });
        
        // Start the tour
        currentTour.start();

      })();
    }
    
    // Remove any existing listeners first
    window.removeEventListener('start-walkthrough-tour', handleStartTour);
    window.addEventListener('start-walkthrough-tour', handleStartTour);
    
    return () => {
      window.removeEventListener('start-walkthrough-tour', handleStartTour);
      // Clean up any existing tour when component unmounts
      if (currentTour) {
        currentTour.exit();
      }
    };
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
