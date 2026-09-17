import { useQuery } from "@apollo/client";
import { useEffect } from "react";
import { GET_PROJECT_STUDY_ID } from "../../../Queries/Proposal";
import useTranslation from "next-translate/useTranslation";

import Collect from "./Main";
import Navigation from "../Navigation/Main";
import InDev from "../../../Global/InDev";
import { collectTours } from "./tours";
import { isProjectArea } from "../../shared/identity";

export default function ProjectWrapper({ query, user, tab, toggleSidebar }) {
  const { t } = useTranslation("builder");
  const selector = query?.selector;
  const projectMode = isProjectArea(query?.area);

  const { data } = useQuery(GET_PROJECT_STUDY_ID, {
    variables: { id: selector },
    skip: !projectMode || !selector,
  });

  const studyId = projectMode ? data?.proposalBoard?.study?.id : selector;

  useEffect(() => {
    if (!projectMode) return undefined;

    let currentTour = null;
    let isStartingTour = false;

    function handleStartTour(event) {
      const tourId = event?.detail?.tourId || "overview";
      const tourData = event?.detail?.tourData;

      if (isStartingTour) {
        return;
      }

      isStartingTour = true;

      if (currentTour) {
        currentTour.exit();
        currentTour = null;
      }

      (async () => {
        const introJs = (await import("intro.js")).default;

        let selectedTour = tourData;
        if (!selectedTour) {
          selectedTour = collectTours[tourId];
        }

        if (!selectedTour) {
          console.error(`Tour ${tourId} not found`);
          isStartingTour = false;
          return;
        }

        currentTour = introJs.tour();
        currentTour.setOptions({
          steps: selectedTour.steps,
          scrollToElement: false,
          scrollTo: "off",
          exitOnOverlayClick: true,
          exitOnEsc: true,
          showBullets: true,
        });

        currentTour.start();

        currentTour.onComplete(() => {
          currentTour = null;
          isStartingTour = false;
        });

        currentTour.onExit(() => {
          currentTour = null;
          isStartingTour = false;
        });
      })();
    }

    window.removeEventListener("start-walkthrough-tour", handleStartTour);
    window.addEventListener("start-walkthrough-tour", handleStartTour);

    return () => {
      window.removeEventListener("start-walkthrough-tour", handleStartTour);
      if (currentTour) {
        currentTour.exit();
      }
    };
  }, [projectMode]);

  if (!selector) {
    return (
      <div>
        {t(
          "collect.noProjectFound",
          "No project found, please save your project first."
        )}
      </div>
    );
  }

  if (studyId) {
    return (
      <Collect
        query={query}
        user={user}
        tab={tab}
        toggleSidebar={toggleSidebar}
        studyId={studyId}
      />
    );
  }

  return (
    <>
      <Navigation
        proposalId={selector}
        query={query}
        user={user}
        tab={tab}
        toggleSidebar={toggleSidebar}
      />
      <InDev
        header={t(
          "collect.noStudyAttachedHeader",
          "🤷🏻 Your project has no Study attached to it."
        )}
        message={t(
          "collect.noStudyAttachedMessage",
          "Let your teacher know so they can create one and associate it. If you need help, please contact tech support at support.mindhive@nyu.edu."
        )}
      />
    </>
  );
}

ProjectWrapper.hasTour = true;
ProjectWrapper.tours = collectTours;
