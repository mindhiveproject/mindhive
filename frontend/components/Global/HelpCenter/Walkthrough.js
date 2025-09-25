import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useTheme } from "styled-components";
import useTranslation from "next-translate/useTranslation";
import "intro.js/introjs.css";

export default function Walkthrough({ onStartWalkthrough }) {
  const [hasTour, setHasTour] = useState(false);
  const [tours, setTours] = useState(null);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation("home");

  useEffect(() => {
    let isMounted = true;
    async function checkTour() {
      let componentImport;

      // Dashboard area routing
      if (
        router.pathname.startsWith("/dashboard/[area]") &&
        router.query.area === "develop"
      ) {
        // Import tours directly without importing the component
        try {
          const currentLocale = router.locale || "en-us";
          let developToursImport;

          // Try localized tour file first
          if (currentLocale !== "en-us") {
            try {
              developToursImport = await import(
                `../../Dashboard/Develop/tours.${currentLocale}.js`
              );
            } catch (localizedError) {
              // Fallback to English
              developToursImport = await import(
                "../../Dashboard/Develop/tours.js"
              );
            }
          } else {
            developToursImport = await import(
              "../../Dashboard/Develop/tours.js"
            );
          }

          componentImport = {
            default: { hasTour: true },
            tours: developToursImport.developTours,
          };
        } catch (error) {
          console.error("Failed to import develop tours:", error);
          setHasTour(false);
          return;
        }
      } else if (
        router.pathname.startsWith("/dashboard/[area]") &&
        router.query.area === "review"
      ) {
        // Import tours directly without importing the component
        try {
          const currentLocale = router.locale || "en-us";
          let reviewOverviewToursImport;

          // Try localized tour file first
          if (currentLocale !== "en-us") {
            try {
              reviewOverviewToursImport = await import(
                `../../Dashboard/Review/Overview/tours.${currentLocale}.js`
              );
            } catch (localizedError) {
              // Fallback to English
              reviewOverviewToursImport = await import(
                "../../Dashboard/Review/Overview/tours.js"
              );
            }
          } else {
            reviewOverviewToursImport = await import(
              "../../Dashboard/Review/Overview/tours.js"
            );
          }

          componentImport = {
            default: { hasTour: true },
            tours: reviewOverviewToursImport.reviewOverviewTours,
          };
        } catch (error) {
          console.error("Failed to import review tours:", error);
          setHasTour(false);
          return;
        }
      } else if (
        router.pathname === "/builder/[area]" &&
        router.query.area === "projects" &&
        router.query.selector
      ) {
        // Import the specific tab component based on the tab parameter
        const tab = router.query.tab || "board"; // Default to 'board' if no tab specified
        switch (tab) {
          case "board":
            // Import tours directly without importing the component
            try {
              const currentLocale = router.locale || "en-us";
              let boardToursImport;

              // Try localized tour file first
              if (currentLocale !== "en-us") {
                try {
                  boardToursImport = await import(
                    `../../Builder/Project/ProjectBoard/tours.${currentLocale}.js`
                  );
                } catch (localizedError) {
                  // Fallback to English
                  boardToursImport = await import(
                    "../../Builder/Project/ProjectBoard/tours.js"
                  );
                }
              } else {
                boardToursImport = await import(
                  "../../Builder/Project/ProjectBoard/tours.js"
                );
              }

              componentImport = {
                default: { hasTour: true },
                tours: boardToursImport.projectBoardTours,
              };
            } catch (error) {
              console.error("Failed to import board tours:", error);
              setHasTour(false);
              return;
            }
            break;
          case "builder":
            // Import tours directly without importing the component
            try {
              const currentLocale = router.locale || "en-us";
              let toursImport;

              // Try localized tour file first
              console.log(currentLocale);
              if (currentLocale !== "en-us") {
                try {
                  toursImport = await import(
                    `../../Builder/Project/Builder/tours.${currentLocale}.js`
                  );
                } catch (localizedError) {
                  console.log(localizedError);
                  // Fallback to English
                  toursImport = await import(
                    "../../Builder/Project/Builder/tours.js"
                  );
                }
              } else {
                toursImport = await import(
                  "../../Builder/Project/Builder/tours.js"
                );
              }

              componentImport = {
                default: { hasTour: true },
                tours: toursImport.builderTours,
              };
            } catch (error) {
              console.error("Failed to import builder tours:", error);
              setHasTour(false);
              return;
            }
            break;
          case "page":
            // Import tours directly without importing the component
            try {
              const currentLocale = router.locale || "en-us";
              let participantPageToursImport;

              // Try localized tour file first
              if (currentLocale !== "en-us") {
                try {
                  participantPageToursImport = await import(
                    `../../Builder/Project/ParticipantPage/tours.${currentLocale}.js`
                  );
                } catch (localizedError) {
                  // Fallback to English
                  participantPageToursImport = await import(
                    "../../Builder/Project/ParticipantPage/tours.js"
                  );
                }
              } else {
                participantPageToursImport = await import(
                  "../../Builder/Project/ParticipantPage/tours.js"
                );
              }

              componentImport = {
                default: { hasTour: true },
                tours: participantPageToursImport.participantPageTours,
              };
            } catch (error) {
              console.error("Failed to import participant page tours:", error);
              setHasTour(false);
              return;
            }
            break;
          case "review":
            // Import tours directly without importing the component
            try {
              const currentLocale = router.locale || "en-us";
              let reviewToursImport;

              // Try localized tour file first
              if (currentLocale !== "en-us") {
                try {
                  reviewToursImport = await import(
                    `../../Builder/Project/Review/tours.${currentLocale}.js`
                  );
                } catch (localizedError) {
                  // Fallback to English
                  reviewToursImport = await import(
                    "../../Builder/Project/Review/tours.js"
                  );
                }
              } else {
                reviewToursImport = await import(
                  "../../Builder/Project/Review/tours.js"
                );
              }

              componentImport = {
                default: { hasTour: true },
                tours: reviewToursImport.reviewTours,
              };
            } catch (error) {
              console.error("Failed to import review tours:", error);
              setHasTour(false);
              return;
            }
            break;
          case "collect":
            // Import tours directly without importing the component
            try {
              const currentLocale = router.locale || "en-us";
              let collectToursImport;

              // Try localized tour file first
              if (currentLocale !== "en-us") {
                try {
                  collectToursImport = await import(
                    `../../Builder/Project/Collect/tours.${currentLocale}.js`
                  );
                } catch (localizedError) {
                  // Fallback to English
                  collectToursImport = await import(
                    "../../Builder/Project/Collect/tours.js"
                  );
                }
              } else {
                collectToursImport = await import(
                  "../../Builder/Project/Collect/tours.js"
                );
              }

              componentImport = {
                default: { hasTour: true },
                tours: collectToursImport.collectTours,
              };
            } catch (error) {
              console.error("Failed to import collect tours:", error);
              setHasTour(false);
              return;
            }
            break;
          case "visualize": // will be deprecated
            try {
              componentImport = await import(
                "../../Builder/Project/Visualize/Wrapper.js"
              );
            } catch (error) {
              console.error("Failed to import visualize wrapper:", error);
              setHasTour(false);
              return;
            }
            break;
          case "journal": // TODO: add tours for visualize -- Not doing till the UI is ready
            try {
              componentImport = await import(
                "../../Builder/Project/DataJournal/Main.js"
              );
            } catch (error) {
              console.error("Failed to import journal wrapper:", error);
              setHasTour(false);
              return;
            }
            break;
          default:
            setHasTour(false);
            return;
        }
      } else if (router.pathname.startsWith("/studies")) {
        console.log("Walkthrough: Detected studies route");
      } else {
        setHasTour(false);
        return;
      }

      if (isMounted) {
        try {
          const component = componentImport.default;
          // Handle both component functions and our custom structure
          if (typeof component === "function") {
            setHasTour(component.hasTour === true);
            setTours(component.tours || null);
            setSelectedComponent(component);
          } else if (component && typeof component === "object") {
            // Handle our custom structure for builder component
            setHasTour(component.hasTour === true);
            setTours(componentImport.tours || null);
            setSelectedComponent(component);
          } else {
            setHasTour(false);
            setTours(null);
            setSelectedComponent(null);
          }
        } catch (error) {
          console.error("Error loading component for walkthrough:", error);
          setHasTour(false);
          setTours(null);
          setSelectedComponent(null);
        }
      }
    }
    checkTour();
    return () => {
      isMounted = false;
    };
  }, [
    router.pathname,
    router.query.area,
    router.query.selector,
    router.query.tab,
  ]);

  const handleStart = (tourId = "overview") => {
    // Get the current tours data
    const currentTours = tours || {};
    const selectedTour = currentTours[tourId];

    // Dispatch custom event with tour ID and tour data
    window.dispatchEvent(
      new CustomEvent("start-walkthrough-tour", {
        detail: { tourId, tourData: selectedTour },
      })
    );
    // Only call onStartWalkthrough if it exists and we're not already in a tour
    if (onStartWalkthrough) {
      onStartWalkthrough();
    }
  };

  return (
    <div>
      {hasTour && !tours && (
        <button
          className="primaryBtn"
          style={{
            border: `1px solid ${theme.secondaryBlue}`,
            background: theme.secondaryBlue,
          }}
          onClick={() => handleStart()}
        >
          {t("walkthroughs.startTour")}
        </button>
      )}
      {hasTour && tours && (
        <div>
          <p>{t("walkthroughs.availableTours")}</p>
          {Object.entries(tours).map(([tourId, tour]) => (
            <div
              key={tourId}
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "1em",
              }}
            >
              <button
                className="primaryBtn"
                style={{
                  border: `1px solid ${theme.secondaryBlue}`,
                  background: theme.secondaryBlue,
                  marginRight: "1em",
                  whiteSpace: "nowrap",
                }}
                onClick={() => handleStart(tourId)}
              >
                <span
                  style={{
                    color: theme.neutral5,
                    margin: 0,
                    whiteSpace: "nowrap",
                  }}
                >
                  {t("walkthroughs.startTourButton")}
                </span>
              </button>
              <div>
                <p
                  style={{
                    color: theme.neutral1,
                    margin: 0,
                    fontWeight: "bold",
                  }}
                >
                  {tour.title}
                </p>
                <p style={{ color: theme.neutral3 }}>{tour.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      {!hasTour && <p>{t("walkthroughs.noWalkthroughAvailable")}</p>}
    </div>
  );
}
