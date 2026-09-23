import { useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";
import { useEffect } from 'react';

import Selector from "./DevelopNew/Selector";
import Panels from "./Panels";
import { developTours } from "./tours";

import Button from "../../DesignSystem/Button";
import DropdownMenu from "../../DesignSystem/DropdownMenu";
import { ArrowDropDownIcon } from "../../DesignSystem/Icons";
import { StyledSelector } from "../../styles/StyledSelector";
import { CREATE_VISUAL } from "../../Mutations/YQVisual";

export default function DevelopMain({ query, user }) {
  const { t } = useTranslation("builder");
  const router = useRouter();

  const { selector } = query;

  const userPermissions = user.permissions.map(
    (permission) => permission?.name
  );

  const [createVisual] = useMutation(CREATE_VISUAL);

  async function onCreateVisual() {
    const result = await createVisual({
      variables: {
        data: {
          title: t("visuals:untitledVisual", {}, { default: "Untitled Visual" }),
          author: { connect: { id: user.id } },
          privacy: "private",
          participationMode: "sandbox",
          // A new visual declares its parameters in code; the legacy array
          // default would be read as a set of YQ-era parameters.
          parameters: { schemaVersion: 3, bindings: {} },
        },
      },
    });
    const id = result.data?.createVisual?.id;
    if (id) router.push(`/builder/visuals/${id}`);
  }

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

  // Visuals skip the shared /develop/new selector — there's nothing to pick, so
  // this entry creates one straight away and opens it in the builder.
  if (userPermissions.includes("ADMIN")) {
    developNewItems.push({
      key: "visual",
      label: t("developNewMenu.visual", {}, { default: "Visual" }),
      onClick: onCreateVisual,
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
      <div className="header">
        <div>
          <h1 className="MH-Type-Heading-Base">{t("develop")}</h1>
          <p>{t("developHeaderDescription")}</p>
        </div>
        <DropdownMenu
          ariaLabel={t("developNew")}
          renderTrigger={({ onClick, ariaLabel }) => (
            <Button
              id="developNewBtn"
              variant="filled"
              trailingIcon={<ArrowDropDownIcon />}
              onClick={onClick}
              aria-label={ariaLabel}
            >
              {t("developNew")}
            </Button>
          )}
          items={developNewItems}
        />
      </div>
      <Panels query={query} user={user} />
    </>
  );
}

// Indicate this page has a tour
DevelopMain.hasTour = true;
