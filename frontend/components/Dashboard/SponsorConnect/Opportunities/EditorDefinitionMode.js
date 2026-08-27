// Definition-driven Opportunity editor — DefinitionForm is the intake UI.
// Messages open from the top bar (OpportunityMessagesMenu). Follow-up forms
// attached to held matching rounds appear as chips under the top bar.
// Custom ConnectQuestion CRUD lived on the legacy Editor and is not ported;
// structured intake + round follow-up FormDefinitions replace that path.
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

import { UserContext } from "../../../Global/Authorized";
import DefinitionForm from "../../../Forms/DefinitionForm";
import Button from "../../../DesignSystem/Button";
import Chip from "../../../DesignSystem/Chip";
import OpportunityClassNetworksField from "./OpportunityClassNetworksField";
import OpportunityFollowUpFormPanel from "./OpportunityFollowUpFormPanel";
import OpportunityListStepper from "./OpportunityListStepper";
import OpportunityMessagesMenu from "./OpportunityMessagesMenu";
import UnsubmitOpportunityModal from "./UnsubmitOpportunityModal";
import {
  GET_OPPORTUNITY,
  MY_OPPORTUNITIES,
  OPPORTUNITY_EDITOR_CLASS_NETWORKS,
} from "../../../Queries/Opportunity";
import { GET_MY_ORGANIZATION } from "../../../Queries/Organization";
import {
  CREATE_OPPORTUNITY,
  UPDATE_OPPORTUNITY,
} from "../../../Mutations/Opportunity";
import useConnectRole from "../../Connect/useConnectRole";
import { isReturnableOpportunityStatus } from "../../Connect/returnOpportunityUtils";
import {
  buildClassNetworksMutationInput,
  collectMemberClassNetworks,
  isNewOpportunityId,
} from "../../../../lib/opportunityClassNetworks";
import {
  OPPORTUNITY_FLASH,
  listFlashQuery,
} from "../../../../lib/opportunityFlash";
import {
  OpportunityPageShell as Shell,
  OPPORTUNITY_PAGE_GUTTER,
} from "./OpportunityPageLayout";
import {
  OPPORTUNITY_EDITOR_TABS,
  collectFollowUpForms,
  formTabKey,
  parseFormTabKey,
  resolveOpportunityEditorTab,
} from "../../../../lib/opportunityEditorTabs";

const BACK_CHEVRON = (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <path
      d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12l4.58-4.59z"
      fill="currentColor"
    />
  </svg>
);

const StickyHeader = styled.div`
  position: sticky;
  /* Sponsor Connect has no ConnectNavigationBar — stick to the top of the scrollport */
  top: 0;
  z-index: 5;
  margin: 0 calc(-1 * ${OPPORTUNITY_PAGE_GUTTER}) 8px;
  background: rgba(247, 249, 248, 0.92);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
`;

const TopBar = styled.header.attrs({ className: "Editor__TopBar" })`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 16px;
  padding: 10px ${OPPORTUNITY_PAGE_GUTTER};
  border-bottom: 1px solid rgba(211, 218, 224, 0.85);
`;

const ChipSelectorRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 8px ${OPPORTUNITY_PAGE_GUTTER} 10px;
  box-sizing: border-box;
  border-bottom: 1px solid rgba(211, 218, 224, 0.45);
`;

const IntakePane = styled.div`
  display: ${(p) => (p.$hidden ? "none" : "contents")};
`;

const TopBarLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1 1 220px;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 12px;
  min-width: 0;
  flex: 1 1 auto;

  h1 {
    margin: 0;
    min-width: 0;
    max-width: 100%;
    font: var(--MH-Type-Heading-Small);
    letter-spacing: 0;
    color: #171717;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const BackLink = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  padding: 0;
  background: none;
  border: none;
  border-radius: 8px;
  color: #336f8a;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: rgba(51, 111, 138, 0.08);
  }

  &:focus-visible {
    outline: 2px solid #336f8a;
    outline-offset: 2px;
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  align-items: center;
  flex-wrap: wrap;
  flex: 0 0 auto;
`;

function rolesForViewer(connectRole) {
  const roles = [];
  if (connectRole.isAdmin) roles.push("admin");
  if (connectRole.isTeacher) roles.push("teacher");
  if (connectRole.isScientist) roles.push("scientist");
  if (connectRole.isMentor) roles.push("mentor");
  if (connectRole.isStudent) roles.push("student");
  if (connectRole.isSponsor) roles.push("sponsor");
  return roles;
}

const LIST_PATH = "/dashboard/sponsor-connect/opportunities";

function goToListWithFlash(router, flashKey, opportunityId) {
  router.push({
    pathname: LIST_PATH,
    query: listFlashQuery(flashKey, opportunityId),
  });
}

export default function EditorDefinitionMode({ opportunityId }) {
  const router = useRouter();
  const { t } = useTranslation("connect");
  const { user } = useContext(UserContext);
  const isNew = isNewOpportunityId(opportunityId);
  const connectRole = useConnectRole();
  const { isAdmin } = connectRole;
  const viewerRoles = rolesForViewer(connectRole);

  const { data: oppData, loading: oppLoading } = useQuery(GET_OPPORTUNITY, {
    variables: { id: opportunityId },
    skip: isNew,
    fetchPolicy: "cache-and-network",
  });
  const opportunity = oppData?.opportunity;

  const { data: editorNetworksData } = useQuery(
    OPPORTUNITY_EDITOR_CLASS_NETWORKS,
  );
  const availableNetworks = useMemo(
    () =>
      collectMemberClassNetworks(editorNetworksData?.authenticatedItem),
    [editorNetworksData],
  );

  const [selectedNetworks, setSelectedNetworks] = useState([]);

  useEffect(() => {
    setSelectedNetworks(
      (opportunity?.classNetworks || []).map((network) => network.id),
    );
  }, [opportunity?.id]);

  const { data: orgData } = useQuery(GET_MY_ORGANIZATION, {
    fetchPolicy: "cache-and-network",
  });
  const myOrgId = orgData?.authenticatedItem?.organizations?.[0]?.id || null;

  const [createOpportunity] = useMutation(CREATE_OPPORTUNITY, {
    refetchQueries: [{ query: MY_OPPORTUNITIES }],
    awaitRefetchQueries: true,
  });
  const [updateOpportunity] = useMutation(UPDATE_OPPORTUNITY, {
    refetchQueries: [
      { query: MY_OPPORTUNITIES },
      { query: GET_OPPORTUNITY, variables: { id: opportunityId } },
    ],
    awaitRefetchQueries: true,
  });

  const [saving, setSaving] = useState(false);
  const [unsubmitOpen, setUnsubmitOpen] = useState(false);
  const proposalFormRef = useRef(null);
  const followUpFormRef = useRef(null);
  const saveIntentRef = useRef({ submitForReview: false });

  const currentStatus = opportunity?.status || "draft";
  const followUpForms = useMemo(
    () =>
      collectFollowUpForms(opportunity?.rounds || [], {
        opportunityStatus: currentStatus,
      }),
    [opportunity?.rounds, currentStatus],
  );
  const resolvedTab = resolveOpportunityEditorTab(router.query?.tab, {
    followUpForms,
  });
  const activeFollowUpForm = useMemo(() => {
    const formId = parseFormTabKey(resolvedTab);
    if (!formId) return null;
    return followUpForms.find((form) => form.id === formId) || null;
  }, [resolvedTab, followUpForms]);
  const isProposalTab = resolvedTab === OPPORTUNITY_EDITOR_TABS.proposal;
  const showFollowUpChips = !isNew && followUpForms.length > 0;
  const canSponsorSubmit =
    !isAdmin &&
    !isNew &&
    (currentStatus === "draft" || currentStatus === "returned");
  const canSponsorUnsubmit =
    !isAdmin && !isNew && isReturnableOpportunityStatus(currentStatus);
  const showSponsorDraftOnlySave = !isAdmin && !isNew && !canSponsorSubmit;

  const handleSubmit = async (result) => {
    const submitForReview = !!saveIntentRef.current.submitForReview;
    saveIntentRef.current.submitForReview = false;

    const baseInput = result?.self || {};
    const classNetworks = buildClassNetworksMutationInput(
      selectedNetworks,
      isNew,
    );

    // Top-bar Save draft / Submit owns status for sponsors. Admins may use
    // the Publishing card status field from DefinitionForm.
    let nextStatus = baseInput.status || currentStatus || "draft";
    if (submitForReview) {
      nextStatus = "pending_review";
    } else if (!isAdmin && !isNew) {
      nextStatus = currentStatus;
    }

    const input = {
      ...baseInput,
      status: nextStatus,
      ...(classNetworks ? { classNetworks } : {}),
      acceptedAt:
        nextStatus === "accepted" && !opportunity?.acceptedAt
          ? new Date().toISOString()
          : opportunity?.acceptedAt || null,
      preSelectedAt:
        nextStatus === "pre_selected" && !opportunity?.preSelectedAt
          ? new Date().toISOString()
          : opportunity?.preSelectedAt || null,
    };

    if (isNew) {
      const createInput = {
        ...input,
        status: input.status || "draft",
        ...(user?.id ? { mentor: { connect: { id: user.id } } } : {}),
        ...(myOrgId ? { organization: { connect: { id: myOrgId } } } : {}),
      };
      const res = await createOpportunity({ variables: { input: createInput } });
      const newId = res?.data?.createOpportunity?.id;
      if (newId) {
        goToListWithFlash(router, OPPORTUNITY_FLASH.CREATED, newId);
      }
      return;
    }

    await updateOpportunity({
      variables: { id: opportunityId, input },
    });
    goToListWithFlash(
      router,
      submitForReview
        ? OPPORTUNITY_FLASH.SUBMITTED
        : OPPORTUNITY_FLASH.SAVED,
      opportunityId,
    );
  };

  const runSave = async ({ submitForReview = false } = {}) => {
    setSaving(true);
    saveIntentRef.current.submitForReview = submitForReview;
    try {
      if (activeFollowUpForm) {
        await followUpFormRef.current?.save?.();
        return;
      }
      await proposalFormRef.current?.save?.();
    } finally {
      setSaving(false);
    }
  };

  const selectEditorTab = (tabKey) => {
    router.replace(
      {
        pathname: router.pathname,
        query: { ...router.query, tab: tabKey },
      },
      undefined,
      { shallow: true },
    );
  };

  const handleUnsubmitSuccess = (nextStatus) => {
    setUnsubmitOpen(false);
    goToListWithFlash(
      router,
      nextStatus === "returned"
        ? OPPORTUNITY_FLASH.UNSUBMITTED_REVISION
        : OPPORTUNITY_FLASH.UNSUBMITTED_DRAFT,
      opportunityId,
    );
  };

  // Must stay above the loading early-return — Rules of Hooks.
  const statusStepperNetworks = useMemo(() => {
    if (opportunity?.classNetworks?.length) {
      return opportunity.classNetworks;
    }
    return selectedNetworks
      .map((id) => availableNetworks.find((network) => network.id === id))
      .filter(Boolean);
  }, [opportunity?.classNetworks, selectedNetworks, availableNetworks]);

  if (!isNew && oppLoading && !opportunity) {
    return (
      <Shell>
        {t("opportunityEditor.loading", {}, {
          default: "Loading opportunity…",
        })}
      </Shell>
    );
  }

  const entityTitle = (opportunity?.title || "").trim();
  const pageTitle = entityTitle
    ? entityTitle
    : isNew
    ? t("opportunityEditor.pageTitleNew", {}, {
        default: "New opportunity",
      })
    : t("opportunityEditor.pageTitleEdit", {}, {
        default: "Edit opportunity",
      });
  const backLabel = t("opportunityEditor.backLink", {}, {
    default: "Back to opportunities",
  });
  const editPrimaryLabel = saving
    ? t("opportunityEditor.saving", {}, { default: "Saving…" })
    : isNew
    ? t("opportunityEditor.create", {}, {
        default: "Create opportunity",
      })
    : t("opportunityEditor.save", {}, { default: "Save changes" });
  const saveDraftLabel = saving
    ? t("opportunityEditor.saving", {}, { default: "Saving…" })
    : t("opportunityEditor.saveDraft", {}, { default: "Save draft" });
  const submitForReviewLabel = saving
    ? t("opportunityEditor.saving", {}, { default: "Saving…" })
    : t("opportunityEditor.submitForReview", {}, {
        default: "Submit for review in class network",
      });
  const unsubmitLabel = t("myOpportunitiesList.unsubmit.button", {}, {
    default: "Unsubmit",
  });
  const opportunityFormLabel = t("opportunityEditor.tabs.proposal", {}, {
    default: "Opportunity form",
  });
  const followUpFallbackLabel = t(
    "opportunityEditor.tabs.followUpFallback",
    {},
    { default: "Follow-up form" },
  );
  const formsAriaLabel = t("opportunityEditor.tabs.additionalFormsAria", {}, {
    default: "Select a form",
  });
  const selectorChips = showFollowUpChips
    ? [
        { key: OPPORTUNITY_EDITOR_TABS.proposal, label: opportunityFormLabel },
        ...followUpForms.map((form) => ({
          key: formTabKey(form.id),
          label: form.title || followUpFallbackLabel,
        })),
      ]
    : [];

  return (
    <Shell>
      <StickyHeader>
        <TopBar>
          <TopBarLeft>
            <BackLink
              type="button"
              onClick={() => router.push({ pathname: LIST_PATH })}
              aria-label={backLabel}
              title={backLabel}
              disabled={saving}
            >
              {BACK_CHEVRON}
            </BackLink>
            <TitleRow>
              <h1 title={pageTitle}>{pageTitle}</h1>
              {!isNew && (
                <OpportunityListStepper
                  status={currentStatus}
                  proposalData={opportunity?.proposalData}
                  rounds={opportunity?.rounds}
                  reviewNotes={opportunity?.reviewNotes}
                  videoFile={opportunity?.videoFile}
                  networks={statusStepperNetworks}
                />
              )}
            </TitleRow>
          </TopBarLeft>
          <Actions>
            {!isNew ? (
              <OpportunityMessagesMenu opportunity={opportunity} user={user} />
            ) : null}
            {canSponsorUnsubmit ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setUnsubmitOpen(true)}
                disabled={saving}
              >
                {unsubmitLabel}
              </Button>
            ) : null}
            {canSponsorSubmit ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => runSave({ submitForReview: false })}
                  disabled={saving}
                >
                  {saveDraftLabel}
                </Button>
                <Button
                  type="button"
                  variant="filled"
                  onClick={() => runSave({ submitForReview: true })}
                  disabled={saving}
                >
                  {submitForReviewLabel}
                </Button>
              </>
            ) : showSponsorDraftOnlySave || isNew || isAdmin ? (
              <Button
                type="button"
                variant="filled"
                onClick={() => runSave({ submitForReview: false })}
                disabled={saving}
              >
                {editPrimaryLabel}
              </Button>
            ) : null}
          </Actions>
        </TopBar>
        {showFollowUpChips ? (
          <ChipSelectorRow role="group" aria-label={formsAriaLabel}>
            {selectorChips.map((chip) => {
              const isSelected = resolvedTab === chip.key;
              return (
                <Chip
                  key={chip.key}
                  label={chip.label}
                  selected={isSelected}
                  pressed={isSelected}
                  onClick={() => selectEditorTab(chip.key)}
                  ariaLabel={chip.label}
                />
              );
            })}
          </ChipSelectorRow>
        ) : null}
      </StickyHeader>

      <IntakePane $hidden={!isProposalTab}>
        <OpportunityClassNetworksField
          availableNetworks={availableNetworks}
          selectedNetworks={selectedNetworks}
          onChange={setSelectedNetworks}
          quiet
        />
        <DefinitionForm
          ref={proposalFormRef}
          definitionKey="opportunity"
          entity={opportunity || null}
          scopeContext={{ organizationId: myOrgId }}
          viewerRoles={viewerRoles}
          locale={router.locale}
          onSubmit={handleSubmit}
          hideSaveButton
          quiet
          saveLabel={editPrimaryLabel}
        />
      </IntakePane>
      {activeFollowUpForm ? (
        <OpportunityFollowUpFormPanel
          ref={followUpFormRef}
          opportunity={opportunity}
          formMeta={activeFollowUpForm}
          hideSaveButton
        />
      ) : null}

      <UnsubmitOpportunityModal
        open={unsubmitOpen}
        onClose={() => setUnsubmitOpen(false)}
        opportunityId={opportunityId}
        status={currentStatus}
        onSuccess={handleUnsubmitSuccess}
      />
    </Shell>
  );
}
