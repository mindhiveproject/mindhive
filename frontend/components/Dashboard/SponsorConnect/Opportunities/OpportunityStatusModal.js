import { useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

import Button from "../../../DesignSystem/Button";
import Modal from "../../../DesignSystem/Modal";
import { GET_OPPORTUNITY } from "../../../Queries/Opportunity";
import OpportunityWorkflowStepper from "./OpportunityWorkflowStepper";

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const StatusText = styled.p`
  margin: 0;
  font-family: "Inter", sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: var(--MH-Theme-Neutrals-Dark, #5f6871);
`;

export default function OpportunityStatusModal({
  open,
  onClose,
  opportunityId,
}) {
  const { t } = useTranslation("connect");

  const { data, loading, error } = useQuery(GET_OPPORTUNITY, {
    variables: { id: opportunityId },
    skip: !open || !opportunityId,
    fetchPolicy: "cache-and-network",
  });

  const opportunity = data?.opportunity;

  const title = opportunity?.title
    ? t(
        "myOpportunitiesList.modals.statusTitleNamed",
        { title: opportunity.title },
        { default: "Status · {{title}}" },
      )
    : t("myOpportunitiesList.modals.statusTitle", {}, {
        default: "Status",
      });

  const scopeComplete = Boolean((opportunity?.scopeDescription || "").trim());
  const status = opportunity?.status || "draft";

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="large"
      title={title}
      actions={
        <Button type="button" variant="outline" onClick={onClose}>
          {t("myOpportunitiesList.modals.close", {}, { default: "Close" })}
        </Button>
      }
    >
      {loading && !opportunity ? (
        <StatusText>
          {t("opportunityEditor.loading", {}, {
            default: "Loading opportunity…",
          })}
        </StatusText>
      ) : null}
      {error ? (
        <StatusText>
          {t("myOpportunitiesList.modals.loadError", {}, {
            default: "Could not load this opportunity. Please try again.",
          })}
        </StatusText>
      ) : null}
      {opportunity ? (
        <Stack>
          <OpportunityWorkflowStepper
            status={status}
            scopeComplete={scopeComplete}
            viewerRole="sponsor"
          />
        </Stack>
      ) : null}
    </Modal>
  );
}
