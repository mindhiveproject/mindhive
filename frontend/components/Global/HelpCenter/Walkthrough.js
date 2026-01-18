import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useTheme } from "styled-components";
import useTranslation from "next-translate/useTranslation";
import "intro.js/introjs.css";

/**
 * Configuration map for route patterns to tour file paths and export names.
 * This allows automatic tour discovery without hardcoding each case.
 * 
 * To add a new tour:
 * 1. Create a tours.js file in your component directory (e.g., `components/Builder/Project/MyNewTab/tours.js`)
 * 2. Export a tours object with the naming convention: `export const myNewTabTours = { ... }`
 * 3. Add an entry to the appropriate section below:
 *    - For dashboard routes: Add to `dashboard` object
 *    - For builder project tabs: Add to `builderProject` object
 * 
 * Example:
 *   myNewTab: {
 *     path: "../../Builder/Project/MyNewTab/tours",
 *     exportName: "myNewTabTours",
 *   },
 * 
 * Special cases:
 * - If your tours file is in a subdirectory or has a different name, specify the full path
 * - If you need to skip localization, add `isSpecialPath: true`
 */
const TOUR_CONFIG = {
  // Dashboard routes
  dashboard: {
    develop: {
      path: "../../Dashboard/Develop/tours",
      exportName: "developTours",
    },
    review: {
      path: "../../Dashboard/Review/Overview/tours",
      exportName: "reviewOverviewTours",
    },
  },
  // Builder Project routes - maps tab names to component paths and export names
  builderProject: {
    board: {
      path: "../../Builder/Project/ProjectBoard/tours",
      exportName: "projectBoardTours",
    },
    builder: {
      path: "../../Builder/Project/Builder/tours",
      exportName: "builderTours",
    },
    page: {
      path: "../../Builder/Project/ParticipantPage/tours",
      exportName: "participantPageTours",
    },
    review: {
      path: "../../Builder/Project/Review/tours",
      exportName: "reviewTours",
    },
    collect: {
      path: "../../Builder/Project/Collect/tours",
      exportName: "collectTours",
    },
    visualize: {
      path: "../../Builder/Project/Visualize/tours",
      exportName: "visualizeTours",
    },
    journal: {
      // Special case: DataJournal uses Tours/journalTours.js instead of tours.js
      path: "../../Builder/Project/DataJournal/Tours/journalTours",
      exportName: "journalTours",
      isSpecialPath: true, // Skip localization for this special path
    },
  },
};

/**
 * Dynamically imports tour files based on route configuration
 * @param {string} basePath - Base path to the tours file (without .js extension)
 * @param {string} exportName - Name of the exported tours object
 * @param {string} locale - Current locale
 * @param {boolean} isSpecialPath - If true, skip localization attempts
 * @returns {Promise<Object>} Imported tours module
 */
async function importTours(basePath, exportName, locale, isSpecialPath = false) {
  // For special paths (like DataJournal), skip localization
  if (isSpecialPath) {
    try {
      const toursImport = await import(`${basePath}.js`);
      return toursImport[exportName];
    } catch (error) {
      console.error(`Failed to import tours from ${basePath}.js:`, error);
      throw error;
    }
  }

  // Try localized version first if not English
  if (locale && locale !== "en-us") {
    try {
      const localizedImport = await import(`${basePath}.${locale}.js`);
      return localizedImport[exportName];
    } catch (localizedError) {
      // Fallback to English if localized version doesn't exist
      console.log(`Localized tours not found for ${locale}, falling back to English`);
    }
  }

  // Fallback to English/default
  try {
    const defaultImport = await import(`${basePath}.js`);
    return defaultImport[exportName];
  } catch (error) {
    console.error(`Failed to import tours from ${basePath}.js:`, error);
    throw error;
  }
}

/**
 * Determines tour configuration based on current route
 * @param {Object} router - Next.js router object
 * @returns {Object|null} Tour configuration or null if no match
 */
function getTourConfig(router) {
  const { pathname, query } = router;

  // Dashboard routes
  if (pathname.startsWith("/dashboard/[area]")) {
    const area = query.area;
    const config = TOUR_CONFIG.dashboard[area];
    if (config) {
      return config;
    }
  }

  // Builder Project routes
  if (pathname === "/builder/[area]" && query.area === "projects" && query.selector) {
    const tab = query.tab || "board";
    const config = TOUR_CONFIG.builderProject[tab];
    if (config) {
      return config;
    }
  }

  return null;
}

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

      // Get tour configuration based on current route
      const tourConfig = getTourConfig(router);

      if (!tourConfig) {
        // Check for other routes that might have tours in the future
        if (router.pathname.startsWith("/studies")) {
          console.log("Walkthrough: Detected studies route");
        }
        setHasTour(false);
        return;
      }

      // Dynamically import tours using the configuration
      try {
        const currentLocale = router.locale || "en-us";
        const importedTours = await importTours(
          tourConfig.path,
          tourConfig.exportName,
          currentLocale,
          tourConfig.isSpecialPath
        );

        componentImport = {
          default: { hasTour: true },
          tours: importedTours,
        };
      } catch (error) {
        console.error(`Failed to import tours for ${tourConfig.path}:`, error);
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
