// Definition-driven Opportunity editor — DefinitionForm is the only intake UI.
// Teacher network review uses NetworkReview (?review=1). Round-assigned review
// uses /dashboard/connect/review. Custom ConnectQuestion CRUD is not ported.
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

import { UserContext } from "../../../Global/Authorized";
import DefinitionForm from "../../../Forms/DefinitionForm";
import Button from "../../../DesignSystem/Button";
import MessageCard from "../../../DesignSystem/MessageCard";
import OpportunityClassNetworksField from "./OpportunityClassNetworksField";
import OpportunityListStepper from "../../SponsorConnect/Opportunities/OpportunityListStepper";
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
import useConnectRole from "../useConnectRole";
import {
  buildClassNetworksMutationInput,
  collectMemberClassNetworks,
  isNewOpportunityId,
} from "../../../../lib/opportunityClassNetworks";
import {
  OPPORTUNITY_FLASH,
  useOpportunityFlashQuery,
} from "../../../../lib/opportunityFlash";

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

const Shell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 32px clamp(16px, 6vw, 64px);
  padding-top: 0px;
  background-color: #f7f9f8;
  min-height: 100vh;
  border-radius: 32px 0 0 32px;
  scroll-padding-top: 126px;
`;

const TopBar = styled.header.attrs({ className: "Editor__TopBar" })`
  position: sticky;
  top: 70px;
  z-index: 5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 16px;
  margin: -8px calc(-1 * clamp(16px, 6vw, 64px)) 8px;
  padding: 10px clamp(16px, 6vw, 64px);
  background: rgba(247, 249, 248, 0.92);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(211, 218, 224, 0.85);
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
    font-family: "Inter", sans-serif;
    font-size: clamp(20px, 2.8vw, 26px);
    font-weight: 600;
    color: #171717;
    line-height: 1.25;
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

const LIST_PATH = "/dashboard/connect/opportunities";

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

  const [localFlash, setLocalFlash] = useState(null);
  const { flashMessage: queryFlash, clearFlash: clearQueryFlash } =
    useOpportunityFlashQuery(t);
  const flashMessage = localFlash || queryFlash;
  const clearFlash = () => {
    setLocalFlash(null);
    clearQueryFlash();
  };
  const [saving, setSaving] = useState(false);
  const proposalFormRef = useRef(null);
  const saveIntentRef = useRef({ submitForReview: false });

  const currentStatus = opportunity?.status || "draft";
  const canSponsorSubmit =
    !isAdmin &&
    !isNew &&
    (currentStatus === "draft" || currentStatus === "returned");

  const handleSubmit = async (result) => {
    const submitForReview = !!saveIntentRef.current.submitForReview;
    saveIntentRef.current.submitForReview = false;

    const baseInput = result?.self || {};
    const classNetworks = buildClassNetworksMutationInput(
      selectedNetworks,
      isNew,
    );

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

    setLocalFlash(null);
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
        router.replace(
          {
            pathname: LIST_PATH,
            query: { op: newId, flash: OPPORTUNITY_FLASH.CREATED },
          },
          undefined,
          { shallow: false },
        );
      }
    } else {
      await updateOpportunity({
        variables: { id: opportunityId, input },
      });
      if (submitForReview) {
        router.push({
          pathname: LIST_PATH,
          query: { flash: OPPORTUNITY_FLASH.SUBMITTED },
        });
        return;
      }
      setLocalFlash(
        t("opportunityEditor.savedFlash", {}, { default: "Saved." }),
      );
    }
  };

  const runSave = async ({ submitForReview = false } = {}) => {
    setSaving(true);
    setLocalFlash(null);
    clearQueryFlash();
    saveIntentRef.current.submitForReview = submitForReview;
    try {
      await proposalFormRef.current?.save?.();
    } finally {
      setSaving(false);
    }
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

  return (
    <Shell>
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
          ) : (
            <Button
              type="button"
              variant="filled"
              onClick={() => runSave({ submitForReview: false })}
              disabled={saving}
            >
              {editPrimaryLabel}
            </Button>
          )}
        </Actions>
      </TopBar>
      {flashMessage ? (
        <MessageCard
          variant="success"
          message={flashMessage}
          onClose={clearFlash}
          closeAriaLabel={t("opportunityEditor.flashDismiss", {}, {
            default: "Dismiss",
          })}
        />
      ) : null}
      <OpportunityClassNetworksField
        availableNetworks={availableNetworks}
        selectedNetworks={selectedNetworks}
        onChange={setSelectedNetworks}
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
        saveLabel={editPrimaryLabel}
      />
    </Shell>
  );
}
