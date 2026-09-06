import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";

import Button from "../../../DesignSystem/Button";
import Modal from "../../../DesignSystem/Modal";
import { CREATE_OPPORTUNITY } from "../../../Mutations/Opportunity";
import { GET_OPPORTUNITY, MY_OPPORTUNITIES } from "../../../Queries/Opportunity";
import { GET_MY_ORGANIZATION } from "../../../Queries/Organization";
import { buildOpportunityCopyCreateInput } from "../../../../lib/copyOpportunity";
import { collectFollowUpForms } from "../../../../lib/opportunityEditorTabs";
import {
  OPPORTUNITY_FLASH,
  listFlashQuery,
} from "../../../../lib/opportunityFlash";

const LIST_PATH = "/dashboard/sponsor-connect/opportunities";

export default function CopyOpportunityModal({
  open,
  onClose,
  opportunityId,
  userId = null,
}) {
  const router = useRouter();
  const { t } = useTranslation("connect");
  const [error, setError] = useState(null);
  const [working, setWorking] = useState(false);

  const { data: oppData, loading: oppLoading } = useQuery(GET_OPPORTUNITY, {
    variables: { id: opportunityId },
    skip: !open || !opportunityId,
    fetchPolicy: "network-only",
  });
  const { data: orgData } = useQuery(GET_MY_ORGANIZATION, {
    skip: !open,
    fetchPolicy: "cache-first",
  });

  const [createOpportunity] = useMutation(CREATE_OPPORTUNITY, {
    refetchQueries: [{ query: MY_OPPORTUNITIES }],
    awaitRefetchQueries: true,
  });

  const opportunity = oppData?.opportunity;
  const myOrgId = orgData?.authenticatedItem?.organizations?.[0]?.id || null;

  const handleClose = () => {
    if (working) return;
    setError(null);
    onClose?.();
  };

  const handleConfirm = async () => {
    if (!opportunity?.id || working) return;
    setError(null);
    setWorking(true);
    try {
      const followUpForms = collectFollowUpForms(opportunity.rounds || [], {
        opportunityStatus: opportunity.status,
      });
      const excludeFormDefinitionIds = followUpForms.map((form) => form.id);
      const titleSuffix = t(
        "myOpportunitiesList.copyOpportunity.titleSuffix",
        {},
        { default: " (Copy)" },
      );
      const input = await buildOpportunityCopyCreateInput(opportunity, {
        userId,
        myOrgId,
        excludeFormDefinitionIds,
        titleSuffix,
      });
      const res = await createOpportunity({ variables: { input } });
      const newId = res?.data?.createOpportunity?.id;
      onClose?.();
      if (newId) {
        router.push({
          pathname: LIST_PATH,
          query: listFlashQuery(OPPORTUNITY_FLASH.COPIED, newId),
        });
      }
    } catch (e) {
      setError(
        e?.message ||
          t("myOpportunitiesList.copyOpportunity.error", {}, {
            default: "Could not copy this opportunity. Please try again.",
          }),
      );
    } finally {
      setWorking(false);
    }
  };

  const disclaimer = t("myOpportunitiesList.copyOpportunity.disclaimer", {}, {
    default:
      "Only the initial opportunity form and intro video are copied. Follow-up questionnaire answers and round-specific data are not included.",
  });

  return (
    <Modal
      open={open}
      onClose={working ? undefined : handleClose}
      title={t("myOpportunitiesList.copyOpportunity.title", {}, {
        default: "Copy opportunity?",
      })}
      maxWidth={480}
      actions={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={working}
          >
            {t("myOpportunitiesList.copyOpportunity.cancel", {}, {
              default: "Cancel",
            })}
          </Button>
          <Button
            type="button"
            variant="filled"
            onClick={handleConfirm}
            disabled={working || oppLoading || !opportunity}
          >
            {working
              ? t("myOpportunitiesList.copyOpportunity.working", {}, {
                  default: "Copying…",
                })
              : t("myOpportunitiesList.copyOpportunity.confirm", {}, {
                  default: "Copy opportunity",
                })}
          </Button>
        </>
      }
    >
      <p style={{ margin: 0 }}>{disclaimer}</p>
      {error ? (
        <p
          role="alert"
          className="MH-Type-Body-Base"
          style={{
            margin: "12px 0 0",
            color: "var(--MH-Theme-Error-Dark, #b3261e)",
          }}
        >
          {error}
        </p>
      ) : null}
    </Modal>
  );
}
