// Tours/useTour.js
import { useEffect } from "react";

export const useTour = (journalTours) => {
  // Tour setup
  useEffect(() => {
    let currentTour = null;
    let isStartingTour = false;

    function handleStartTour(event) {
      const tourId = event?.detail?.tourId || "overview";
      const tourData = event?.detail?.tourData;

      // Prevent multiple tours from starting simultaneously
      if (isStartingTour) {
        console.log("Tour already starting, ignoring request");
        return;
      }

      isStartingTour = true;

      // Exit any existing tour first
      if (currentTour) {
        currentTour.exit();
        currentTour = null;
      }

      (async () => {
        const introJs = (await import("intro.js")).default;

        // Use tour data from event if available, otherwise fallback to static import
        let selectedTour = tourData;
        if (!selectedTour) {
          const tours = journalTours;
          selectedTour = tours[tourId];
        }

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
          scrollTo: "off",
          exitOnOverlayClick: true,
          exitOnEsc: true,
          showBullets: true,
        });

        // Start the tour
        currentTour.start();

        // Clean up when tour ends
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

    // Remove any existing listeners first
    window.removeEventListener("start-walkthrough-tour", handleStartTour);
    window.addEventListener("start-walkthrough-tour", handleStartTour);

    return () => {
      window.removeEventListener("start-walkthrough-tour", handleStartTour);
      // Clean up any existing tour when component unmounts
      if (currentTour) {
        currentTour.exit();
      }
    };
  }, [journalTours]);
};
