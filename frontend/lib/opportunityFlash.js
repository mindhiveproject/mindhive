import { useEffect, useState } from "react";
import { useRouter } from "next/router";

/** Query values for `?flash=` after opportunity out-flows. */
export const OPPORTUNITY_FLASH = {
  SUBMITTED: "submitted",
  CREATED: "created",
  SAVED: "saved",
  FORM_SAVED: "formSaved",
  UNSUBMITTED_DRAFT: "unsubmittedDraft",
  UNSUBMITTED_REVISION: "unsubmittedRevision",
  PRE_SELECTED: "preSelected",
  ACCEPTED: "accepted",
  PUBLISHED: "published",
};

/**
 * Resolve a `?flash=` key to a translated MessageCard string (connect namespace).
 * @param {string} flashKey
 * @param {(key: string, query?: object, options?: object) => string} t
 * @returns {string|null}
 */
export function resolveOpportunityFlashMessage(flashKey, t) {
  switch (flashKey) {
    case OPPORTUNITY_FLASH.SUBMITTED:
      return t("opportunityEditor.submittedFlash", {}, {
        default: "Submitted for review.",
      });
    case OPPORTUNITY_FLASH.CREATED:
      return t("opportunityEditor.createdFlash", {}, {
        default: "Opportunity created.",
      });
    case OPPORTUNITY_FLASH.SAVED:
      return t("opportunityEditor.savedFlash", {}, {
        default: "Saved.",
      });
    case OPPORTUNITY_FLASH.FORM_SAVED:
      return t("myOpportunitiesList.flash.formSaved", {}, {
        default: "Follow-up form saved.",
      });
    case OPPORTUNITY_FLASH.UNSUBMITTED_DRAFT:
      return t("myOpportunitiesList.unsubmit.successDraft", {}, {
        default: "Unsubmitted — back to draft.",
      });
    case OPPORTUNITY_FLASH.UNSUBMITTED_REVISION:
      return t("myOpportunitiesList.unsubmit.successRevision", {}, {
        default: "Unsubmitted — marked as in revision.",
      });
    case OPPORTUNITY_FLASH.PRE_SELECTED:
      return t("opportunityEditor.review.preSelectSuccess", {}, {
        default: "Sponsor pre-selected and notified.",
      });
    case OPPORTUNITY_FLASH.ACCEPTED:
      return t("opportunityEditor.review.acceptSuccess", {}, {
        default: "Proposal accepted and sponsor notified.",
      });
    case OPPORTUNITY_FLASH.PUBLISHED:
      return t("opportunityEditor.review.publishSuccess", {}, {
        default: "Opportunity published.",
      });
    default:
      return null;
  }
}

/**
 * Build list URL query for a post-save flash on a specific opportunity.
 * Omits `op` / `tab` so Main mounts the list, not the editor.
 */
export function listFlashQuery(flashKey, opportunityId) {
  const query = { flash: flashKey };
  if (opportunityId) query.flashOp = opportunityId;
  return query;
}

/**
 * Consume `router.query.flash` (and optional `flashOp`) once, clear them
 * shallowly, and expose the message + opportunity id for a dismissible banner.
 *
 * @param {(key: string, query?: object, options?: object) => string} t - connect namespace
 */
export function useOpportunityFlashQuery(t) {
  const router = useRouter();
  const [flashMessage, setFlashMessage] = useState(null);
  const [flashOpportunityId, setFlashOpportunityId] = useState(null);

  useEffect(() => {
    if (!router.isReady) return;
    const key = router.query.flash;
    if (typeof key !== "string" || !key) return;

    const message = resolveOpportunityFlashMessage(key, t);
    if (!message) return;

    const opId =
      typeof router.query.flashOp === "string" ? router.query.flashOp : null;

    setFlashMessage(message);
    setFlashOpportunityId(opId);

    const nextQuery = { ...router.query };
    delete nextQuery.flash;
    delete nextQuery.flashOp;
    router.replace(
      { pathname: router.pathname, query: nextQuery },
      undefined,
      { shallow: true },
    );
    // Only react when the flash query value changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, router.query.flash]);

  return {
    flashMessage,
    flashOpportunityId,
    clearFlash: () => {
      setFlashMessage(null);
      setFlashOpportunityId(null);
    },
  };
}
