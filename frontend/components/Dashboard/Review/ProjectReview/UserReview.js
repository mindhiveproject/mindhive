import { useQuery } from "@apollo/client";
import Link from "next/link";
import useTranslation from "next-translate/useTranslation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";

import { GET_REVIEW } from "../../../Queries/Review";

import Navigation from "./Navigation";
import StudyDetails from "./StudyDetails/Main";
import Questions from "./Review/Main";

import useForm from "../../../../lib/useForm";

import { useTemplateQuestions } from "./Review/Template";
import {
  useReviewFormDefinition,
  reviewContentFromFormDefinition,
} from "./Review/MilestoneReviewForm";
import Feedback from "../Feedback/Main";
import {
  getCurriculumType,
  mergeReviewContentWithTemplate,
} from "../../../../lib/curriculumTypes";
import { reviewStageMatches } from "../../../../lib/milestones";
import Navbar, { NavbarItem } from "../../../DesignSystem/Navbar";
import SplitPane from "../../../DesignSystem/SplitPane";

const SPLIT_STORAGE_KEY = "mh.feedbackCenter.splitFraction";
const DEFAULT_SPLIT_FRACTION = 0.64;

// The reviewer's preferred column split, kept per browser. `null` until the
// stored value has been read, so the split mounts once at the right width
// instead of hydrating at the default and jumping.
function useStoredSplitFraction() {
  const [fraction, setFraction] = useState(null);
  // Latest dragged value, so a split that remounts (after the card was
  // stacked) comes back where the reviewer left it.
  const latestRef = useRef(null);
  const saveTimerRef = useRef();

  useEffect(() => {
    let stored = NaN;
    try {
      stored = parseFloat(window.localStorage.getItem(SPLIT_STORAGE_KEY));
    } catch {
      // storage blocked; fall back to the default
    }
    const initial = stored > 0 && stored < 1 ? stored : DEFAULT_SPLIT_FRACTION;
    latestRef.current = initial;
    setFraction(initial);
    return () => clearTimeout(saveTimerRef.current);
  }, []);

  // The divider reports every pointer move; only the resting value matters.
  const saveFraction = useCallback((next) => {
    latestRef.current = next;
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      try {
        window.localStorage.setItem(SPLIT_STORAGE_KEY, String(next));
      } catch {
        // ignore storage errors
      }
    }, 200);
  }, []);

  return [fraction === null ? null : latestRef.current, saveFraction];
}

// Below this card width the two column minimums can't both fit, so the form
// stacks under the content instead of sitting beside it.
const STACKED_BELOW = 720;

function useIsNarrow(ref, threshold) {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(([entry]) => {
      setNarrow(entry.contentRect.width < threshold);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, threshold]);
  return narrow;
}

export default function UserReview({
  query,
  user,
  tab,
  project,
  status,
  actionCardType,
  canReview,
  milestone,
}) {
  const { t } = useTranslation("builder");
  const router = useRouter();
  const [splitFraction, saveSplitFraction] = useStoredSplitFraction();
  const reviewBodyRef = useRef(null);
  const stacked = useIsNarrow(reviewBodyRef, STACKED_BELOW);
  const locale = router.locale || "en-us";
  const curriculumType = getCurriculumType(project);

  const scopeContext = useMemo(
    () => ({
      organizationId: project?.usedInClass?.creator?.organization?.id || null,
      classNetworkId: project?.usedInClass?.networks?.[0]?.id || null,
    }),
    [project]
  );

  // Blocks the student's teacher hid from the class; the task suggestion
  // field grays these out so mentors don't recommend what students can't use.
  const hiddenTaskIds = useMemo(
    () => (project?.usedInClass?.hiddenTasks || []).map((task) => task?.id),
    [project?.usedInClass?.hiddenTasks]
  );

  const { definition, loading: definitionLoading } = useReviewFormDefinition(
    status,
    curriculumType,
    scopeContext,
    { milestone }
  );

  const { data } = useQuery(GET_REVIEW, {
    variables: {
      projectId: project?.id,
      authorId: user?.id,
      stage: status,
    },
    fetchPolicy: "network-only",
  });

  const reviews = data?.reviews || [];
  const review = reviews.length ? reviews[0] : {};

  const templates = useTemplateQuestions(curriculumType);
  // Memoized so a status with no template (milestone keys) doesn't produce a
  // new [] each render; that re-ran the sync effect below and wiped answers.
  const templateFallback = useMemo(
    () => templates[status] || [],
    [templates, status]
  );
  const defaultContent = useMemo(() => {
    if (definition) {
      return reviewContentFromFormDefinition(
        review?.content,
        definition,
        locale
      );
    }
    return templateFallback;
  }, [definition, review?.content, locale, templateFallback]);

  const { inputs, handleChange, handleMultipleUpdate } = useForm(
    {
      id: review?.id,
      content: defaultContent,
      authorId: user?.id,
      projectId: project?.id,
      stage: status,
    },
    { freezeInitialSync: true }
  );

  // Load the saved review (or the empty form) into the inputs only when its
  // source really changes: the saved review, the form, the milestone or the
  // language. Navigating (e.g. Proposal <-> Comments tabs) hands out new
  // objects for the same values (a new `t`, refetched queries), and syncing
  // on those wiped what the mentor had typed.
  const syncKey = JSON.stringify([
    review?.id || null,
    review?.content || null,
    definition?.id || definition?.key || null,
    curriculumType || null,
    status || null,
    locale,
  ]);
  const lastSyncKey = useRef(null);
  useEffect(() => {
    if (!defaultContent?.length || definitionLoading) {
      return;
    }
    if (lastSyncKey.current === syncKey) return;
    lastSyncKey.current = syncKey;
    const merged = definition
      ? defaultContent
      : mergeReviewContentWithTemplate(review?.content, defaultContent);
    handleMultipleUpdate({
      id: review?.id,
      content: merged,
      // The inputs are frozen after mount; keep the submit target current.
      stage: status,
      projectId: project?.id,
      authorId: user?.id,
    });
  }, [syncKey, defaultContent, definitionLoading]);

  const handleItemChange = ({ className, name, value }) => {
    const updatedContent = [...inputs?.content];
    const content = updatedContent.map((item) => {
      if (item.name === name) {
        const updatedItem = { ...item };
        updatedItem[className] = value;
        return updatedItem;
      }
      return item;
    });
    handleChange({
      target: {
        name: "content",
        value: content,
      },
    });
  };

  const stageCandidates = [
    status,
    milestone?.key,
    milestone?.reviewStage,
    actionCardType,
  ];
  const commentsCount =
    project?.reviews?.filter((r) =>
      reviewStageMatches(r?.stage, stageCandidates)
    ).length || 0;

  const tabHref = (nextTab) => ({
    pathname: "/dashboard/review/project",
    query: {
      id: project?.id,
      stage: query?.stage,
      tab: nextTab,
      ...(query?.from ? { from: query.from } : {}),
    },
  });

  const mainColumn = (
    <div className="reviewMainColumn">
      <div className="reviewTabBar">
        <Navbar
          variant="underline"
          showRule
          gapless
          aria-label={t(
            "reviewDetail.reviewNavLabel",
            {},
            { default: "Review sections" }
          )}
        >
          <NavbarItem
            as={Link}
            href={tabHref("proposal")}
            selected={tab === "proposal"}
          >
            {t("reviewDetail.proposalTab")}
          </NavbarItem>
          <NavbarItem
            as={Link}
            href={tabHref("reviews")}
            selected={tab === "reviews"}
            trailingContent={
              commentsCount > 0 ? commentsCount : undefined
            }
          >
            {t("reviewDetail.commentsTab")}
          </NavbarItem>
        </Navbar>
      </div>

      <div className="reviewContentColumn">
        {tab === "proposal" ? (
          <StudyDetails
            project={project}
            status={status}
            actionCardType={actionCardType}
          />
        ) : null}
        {tab === "reviews" ? (
          <Feedback
            user={user}
            projectId={project?.id}
            status={status}
            curriculumType={curriculumType}
            reviews={
              project?.reviews?.filter((item) =>
                reviewStageMatches(item?.stage, stageCandidates)
              ) || []
            }
          />
        ) : null}
      </div>
    </div>
  );

  const questions = (
    <Questions
      projectId={project?.id}
      review={review}
      reviewContent={inputs?.content || []}
      status={status}
      handleItemChange={handleItemChange}
      hiddenTaskIds={hiddenTaskIds}
    />
  );

  return (
    <div className="reviewContainer">
      <Navigation
        project={project}
        inputs={inputs}
        canReview={canReview}
        handleChange={handleChange}
        status={status}
        milestone={milestone}
      />

      <div
        ref={reviewBodyRef}
        className={
          canReview && stacked ? "reviewBody reviewBody--stacked" : "reviewBody"
        }
      >
        {canReview && stacked ? (
          <>
            {mainColumn}
            {questions}
          </>
        ) : canReview ? (
          splitFraction !== null ? (
            <SplitPane
              start={mainColumn}
              end={questions}
              defaultFraction={splitFraction}
              minStart={360}
              minEnd={320}
              onFractionChange={saveSplitFraction}
              ariaLabel={t(
                "reviewDetail.resizeColumns",
                {},
                { default: "Resize columns" }
              )}
            />
          ) : null
        ) : (
          mainColumn
        )}
      </div>
    </div>
  );
}
