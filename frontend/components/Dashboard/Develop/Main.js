import { useRouter } from "next/router";
import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";
import Trans from "next-translate/Trans";
import { useEffect } from 'react';

import Selector from "./DevelopNew/Selector";
import Panels from "./Panels";
import { developTours } from "./tours";

import DropdownMenu from "../../DesignSystem/DropdownMenu";
import { ArrowDropDownIcon } from "../../DesignSystem/Icons";
import { StyledSelector } from "../../styles/StyledSelector";

// A custom `trigger` puts DropdownMenu into its icon-button styling, which is
// wrong for a labelled primary action — these put it back on a filled button
// in the platform green the old Develop new button wore.
const DEVELOP_NEW_TRIGGER_STYLE = {
  height: "40px",
  padding: "8px 16px 8px 24px",
  borderRadius: "100px",
  background: "var(--green)",
  border: "none",
  color: "var(--MH-Theme-Neutrals-White, #FFFFFF)",
  fontWeight: 600,
};

/**
 * DropdownMenu writes its trigger styles inline, so only the keys it already
 * declares can be overridden via triggerStyle. box-shadow is not one of them,
 * which leaves the hover lift free to live here as ordinary CSS.
 */
const DevelopNewButton = styled.div`
  button:hover {
    box-shadow: var(--MH-Theme-Elevation-High, 2px 2px 12px rgba(0, 0, 0, 0.15));
  }
`;

export default function DevelopMain({ query, user }) {
  const { t } = useTranslation("builder");
  const router = useRouter();

  const { selector } = query;

  const userPermissions = user.permissions.map(
    (permission) => permission?.name
  );

  const developNewItems = [
    { key: "study", label: t("developNewMenu.project", {}, { default: "Project" }) },
    { key: "study", label: t("developNewMenu.study", {}, { default: "Study" }) },
    { key: "task", label: t("developNewMenu.task", {}, { default: "Task" }) },
    {
      key: "survey",
      label: t("developNewMenu.survey", {}, { default: "Survey" }),
    },
    { key: "block", label: t("developNewMenu.block", {}, { default: "Block" }) },
  ].map((item) => ({
    ...item,
    onClick: () =>
      router.push({
        pathname: "/dashboard/develop/new",
        query: { develop: item.key },
      }),
  }));

  // Visuals has no builder yet, so its entry points at the (empty) bank.
  if (userPermissions.includes("ADMIN")) {
    developNewItems.push({
      key: "visual",
      label: t("developNewMenu.visual", {}, { default: "Visual" }),
      onClick: () => router.push("/dashboard/develop/visuals"),
    });
  }

  useEffect(() => {
    let currentTour = null;
    let isStartingTour = false;
    
    function handleStartTour(event) {
      const tourId = event?.detail?.tourId || 'overview';
      const tourData = event?.detail?.tourData;
      
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
        
        // Use tour data from event if available, otherwise fallback to static import
        let selectedTour = tourData;
        if (!selectedTour) {
          const tours = developTours;
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
          scrollTo: 'off',
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
        <DevelopNewButton id="developNewBtn">
          <DropdownMenu
            ariaLabel={t("developNew")}
            triggerStyle={DEVELOP_NEW_TRIGGER_STYLE}
            trigger={
              <>
                {t("developNew")}
                <ArrowDropDownIcon />
              </>
            }
            items={developNewItems}
          />
        </DevelopNewButton>
      </div>
      <Panels query={query} user={user} />
    </>
  );
}

// Indicate this page has a tour
DevelopMain.hasTour = true;
