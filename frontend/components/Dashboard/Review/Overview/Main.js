import Link from "next/link";
import { useRouter } from "next/router";

import { useQuery } from "@apollo/client";
import { GET_USER_CLASSES } from "../../../Queries/User";
import { useEffect, useMemo } from "react";

import ProjectsBoard from "./Projects/Main";
import StudiesBoard from "./Studies/Main";
import { NavbarItem, SectionNavbar } from "../../../DesignSystem/Navbar";
import DropdownSelect from "../../../DesignSystem/DropdownSelect";
import useTranslation from "next-translate/useTranslation";
import { reviewOverviewTours } from "./tours";
import { buildClassTemplateTabs } from "../../../../lib/feedbackCenterTabs";
import { CLASS_TEMPLATE_PROJECTS_QUERY } from "../../../Queries/Proposal";
import { isStudyStatusMilestone } from "../../../../lib/milestones";
import {
  getClassTemplateBoards,
  getPrimaryTemplateBoardId,
} from "../../../../lib/classTemplateBoards";
import { getMilestonesForTemplateBoard } from "../../../../lib/templateBoardActionCards";
import { useBoardMilestones } from "../../../../lib/useBoardMilestones";

function reviewHref(selector, classId) {
  if (!selector) return "/dashboard/review";
  return classId
    ? `/dashboard/review/${selector}?class=${classId}`
    : `/dashboard/review/${selector}`;
}

export default function Overview({ query, user }) {
  const { t } = useTranslation("builder");
  const router = useRouter();

  const { data: classesData } = useQuery(GET_USER_CLASSES);
  const us = classesData?.authenticatedItem || {
    studentIn: [],
    teacherIn: [],
    mentorIn: [],
  };

  const myClasses = [...us?.studentIn, ...us?.teacherIn, ...us?.mentorIn] || [];

  const networkClasses =
    myClasses
      .map((myClass) => {
        if (myClass?.networks) {
          return myClass?.networks?.map((net) => net.classes).flat();
        }
        return [];
      })
      .flat() || [];
  const allClasses = [...myClasses, ...networkClasses];
  const allClassIds = allClasses.map((theclass) => theclass.id);
  const allUniqueClassIds = [...new Set([...allClassIds])];
  const allUniqueClasses = allUniqueClassIds.map((id) => {
    const cl = allClasses.find((item) => item?.id === id);
    return {
      id,
      title: cl?.title,
      code: cl?.code,
      templateProposal: cl?.templateProposal,
      classTemplateBoards: cl?.classTemplateBoards,
    };
  });

  const classFromQuery =
    (router.isReady && router.query?.class) || query?.class;
  const selectedClassId =
    classFromQuery && allUniqueClassIds.includes(String(classFromQuery))
      ? String(classFromQuery)
      : allUniqueClassIds.length === 1
        ? allUniqueClassIds[0]
        : null;

  const selectedClass = allUniqueClasses.find(
    (cl) => cl.id === selectedClassId
  );

  const { data: templateProjectsData, loading: templateBoardsLoading } =
    useQuery(CLASS_TEMPLATE_PROJECTS_QUERY, {
      variables: { classId: selectedClassId },
      skip: !selectedClassId,
    });

  const templateBoards = useMemo(() => {
    const boardsFromQuery = templateProjectsData?.proposalBoards || [];
    const listed = getClassTemplateBoards(selectedClass).filter(
      (board) => board?.id
    );
    if (!listed.length) return boardsFromQuery.filter((board) => board?.id);
    return listed.map((board) => {
      const withCards = boardsFromQuery.find((item) => item.id === board.id);
      return withCards ? { ...board, ...withCards } : board;
    });
  }, [selectedClass, templateProjectsData?.proposalBoards]);

  const primaryBoardId = useMemo(() => {
    if (templateBoards.length === 1) return templateBoards[0]?.id;
    return (
      getPrimaryTemplateBoardId(selectedClass) || templateBoards[0]?.id || null
    );
  }, [templateBoards, selectedClass]);

  const primaryBoard = templateBoards.find(
    (board) => board.id === primaryBoardId
  );

  const { milestones: resolvedMilestones, loading: milestonesLoading } =
    useBoardMilestones(primaryBoardId);

  const classTemplateSteps = useMemo(() => {
    if (!primaryBoard) return [];
    return getMilestonesForTemplateBoard(primaryBoard, resolvedMilestones);
  }, [primaryBoard, resolvedMilestones]);

  const feedbackTabs = buildClassTemplateTabs(classTemplateSteps, t);

  useEffect(() => {
    let currentTour = null;
    let isStartingTour = false;

    function handleStartTour(event) {
      const tourId = event?.detail?.tourId || "overview";
      const tourData = event?.detail?.tourData;

      if (isStartingTour) {
        console.log("Tour already starting, ignoring request");
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
          const tours = reviewOverviewTours;
          selectedTour = tours[tourId];
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
  }, []);

  const selector = query?.selector;
  const matchedTab = feedbackTabs.find(
    (tab) => tab.selector === selector || tab.milestoneKey === selector
  );
  const activeTab = matchedTab || (!selector ? feedbackTabs[0] : null);
  const activeSelector = activeTab?.selector || selector;
  const activeMilestone = activeTab?.milestone;

  const isCollectingData =
    activeSelector === "collectingdata" ||
    (activeMilestone && isStudyStatusMilestone(activeMilestone));

  const tabsLoading =
    !!selectedClassId && (templateBoardsLoading || milestonesLoading);

  const handleClassChange = (nextClassId) => {
    if (!nextClassId) return;
    router.push(`/dashboard/review?class=${nextClassId}`);
  };

  return (
    <div className="overview" id="overview">
      <header className="overviewHeader">
        <h1 className="MH-Type-Heading-Base">{t("review.feedbackCenter")}</h1>
        <p>{t("review.overviewIntro")}</p>
        {allUniqueClasses.length > 0 ? (
          <div className="overviewClassPicker" id="classPicker">
            <DropdownSelect
              ariaLabel={t("review.selectClass", {}, { default: "Select a class" })}
              placeholder={t("review.selectClass", {}, { default: "Select a class" })}
              value={selectedClassId || ""}
              options={allUniqueClasses.map((cl) => ({
                value: cl.id,
                label: cl.title,
              }))}
              onChange={handleClassChange}
            />
          </div>
        ) : (
          <p>{t("review.noClassesAvailable", {}, {
            default: "You are not connected to any classes yet.",
          })}</p>
        )}
      </header>

      {!selectedClassId && allUniqueClasses.length > 1 ? (
        <p>{t("review.selectClassPrompt", {}, {
          default: "Choose a class to see its review milestones.",
        })}</p>
      ) : null}

      {selectedClassId && !tabsLoading && feedbackTabs.length === 0 ? (
        <p>{t("review.noMilestonesForClass", {}, {
          default: "This class has no review milestones on its project template yet.",
        })}</p>
      ) : null}

      {selectedClassId && feedbackTabs.length > 0 ? (
        <SectionNavbar
          variant="underline"
          showRule
          gapless
          id="options"
          aria-label={t("review.feedbackCenter")}
        >
          {!tabsLoading &&
            feedbackTabs.map((tab) => (
              <NavbarItem
                key={tab.selector}
                as={Link}
                href={reviewHref(tab.selector, selectedClassId)}
                id={tab.selector === "proposals" ? "proposal" : tab.selector}
                selected={
                  activeSelector === tab.selector ||
                  (!selector && tab.selector === feedbackTabs[0]?.selector)
                }
              >
                {tab.label || t(tab.labelKey, {}, { default: tab.milestoneKey })}
              </NavbarItem>
            ))}
        </SectionNavbar>
      ) : null}

      {selectedClassId && !isCollectingData && activeSelector ? (
        <ProjectsBoard
          selector={activeSelector}
          selectedClassId={selectedClassId}
          myClassesIds={myClasses.map((cl) => cl?.id)}
          milestones={classTemplateSteps}
        />
      ) : null}

      {selectedClassId && isCollectingData ? (
        <StudiesBoard
          selector={activeSelector || "collectingdata"}
          selectedClassId={selectedClassId}
          myClassesIds={myClasses.map((cl) => cl?.id)}
        />
      ) : null}
    </div>
  );
}

// Indicate this page has a tour
Overview.hasTour = true;
