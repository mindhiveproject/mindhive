import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { Icon } from "semantic-ui-react";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

import Button from "../../../DesignSystem/Button";
import Chip from "../../../DesignSystem/Chip";
import Modal from "../../../DesignSystem/Modal";
import {
  GET_OPPORTUNITY,
  MY_OPPORTUNITIES,
} from "../../../Queries/Opportunity";
import { UPDATE_OPPORTUNITY } from "../../../Mutations/Opportunity";
import OpportunityWorkflowStepper from "./OpportunityWorkflowStepper";

const GUIDELINE_DOCUMENTS = [
  {
    value: "faqs",
    url: "https://engineering.nyu.edu/research-innovation/centers/cusp/research/capstone-projects",
    labelKey: "opportunityEditor.guidelinesFaqsChip",
    defaultLabel: "Capstone Sponsor FAQs",
  },
  {
    value: "mutual-expectations",
    url: "https://engineering.nyu.edu/research-innovation/centers/cusp/research/capstone-projects/cusp-capstone-mutual-expectations",
    labelKey: "opportunityEditor.guidelinesMutualExpectationsChip",
    defaultLabel: "Mutual Expectations agreement",
  },
];

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

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;

  .label-text {
    font-family: "Inter", sans-serif;
    font-size: 13px;
    font-weight: 600;
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }

  .hint {
    font-size: 12px;
    color: var(--MH-Theme-Neutrals-Dark, #5f6871);
  }
`;

const LinkChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;

  a {
    display: inline-flex;
    text-decoration: none;
    color: inherit;
  }
`;

const Warning = styled.div`
  padding: 10px 14px;
  border-radius: 10px;
  background: #fdf1f1;
  border: 1px solid #f1c8c8;
  color: #b3261e;
  font-size: 13px;
`;

export default function OpportunityStatusModal({
  open,
  onClose,
  opportunityId,
}) {
  const { t } = useTranslation("connect");
  const [guidelinesAcknowledged, setGuidelinesAcknowledged] = useState(false);
  const [requestsAppointment, setRequestsAppointment] = useState(false);
  const [dirty, setDirty] = useState(false);

  const { data, loading, error } = useQuery(GET_OPPORTUNITY, {
    variables: { id: opportunityId },
    skip: !open || !opportunityId,
    fetchPolicy: "cache-and-network",
  });

  const opportunity = data?.opportunity;

  useEffect(() => {
    if (!open || !opportunity) return;
    setGuidelinesAcknowledged(!!opportunity.guidelinesAcknowledged);
    setRequestsAppointment(!!opportunity.requestsAppointment);
    setDirty(false);
  }, [
    open,
    opportunity?.id,
    opportunity?.guidelinesAcknowledged,
    opportunity?.requestsAppointment,
  ]);

  const [updateOpportunity, { loading: saving }] = useMutation(
    UPDATE_OPPORTUNITY,
    {
      refetchQueries: [
        { query: MY_OPPORTUNITIES },
        ...(opportunityId
          ? [{ query: GET_OPPORTUNITY, variables: { id: opportunityId } }]
          : []),
      ],
      awaitRefetchQueries: true,
    },
  );

  const handleSave = async () => {
    if (!opportunityId) return;
    await updateOpportunity({
      variables: {
        id: opportunityId,
        input: {
          guidelinesAcknowledged,
          guidelinesAcknowledgedAt:
            guidelinesAcknowledged && !opportunity?.guidelinesAcknowledgedAt
              ? new Date().toISOString()
              : opportunity?.guidelinesAcknowledgedAt || null,
          requestsAppointment,
        },
      },
    });
    setDirty(false);
  };

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
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            {t("myOpportunitiesList.modals.close", {}, { default: "Close" })}
          </Button>
          <Button
            type="button"
            variant="filled"
            onClick={handleSave}
            disabled={!dirty || saving || !opportunity}
          >
            {saving
              ? t("opportunityEditor.saving", {}, { default: "Saving…" })
              : t("opportunityEditor.save", {}, { default: "Save changes" })}
          </Button>
        </>
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

          <Field>
            <span className="label-text">
              {t("opportunityEditor.guidelinesTitle", {}, {
                default: "Understanding of Proposal Guidelines",
              })}
            </span>
            <span
              style={{
                fontSize: 14,
                color: "#171717",
                lineHeight: 1.5,
              }}
            >
              {t("opportunityEditor.guidelinesDescription", {}, {
                default:
                  "I have read and understood the Capstone proposal guidelines in full, including all of the Capstone Sponsor FAQs and Mutual Expectations agreement and agree to abide by them.",
              })}
            </span>
            <LinkChipRow>
              {GUIDELINE_DOCUMENTS.map((doc) => (
                <a
                  key={doc.value}
                  href={doc.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Chip
                    shape="square"
                    label={t(doc.labelKey, {}, { default: doc.defaultLabel })}
                    leading={
                      <img
                        src="/assets/icons/document.svg"
                        alt=""
                        aria-hidden
                        width={24}
                        height={24}
                      />
                    }
                  />
                </a>
              ))}
            </LinkChipRow>
            <label
              style={{
                display: "inline-flex",
                gap: 8,
                alignItems: "flex-start",
                cursor: "pointer",
                fontSize: 14,
                color: "#171717",
              }}
            >
              <input
                type="checkbox"
                checked={guidelinesAcknowledged}
                onChange={(e) => {
                  setGuidelinesAcknowledged(e.target.checked);
                  setDirty(true);
                }}
                style={{ marginTop: 3 }}
              />
              <span>
                <strong>
                  {t("opportunityEditor.guidelinesAgree", {}, {
                    default: "I agree with this statement.",
                  })}
                </strong>
              </span>
            </label>
            {opportunity.guidelinesAcknowledgedAt ? (
              <span className="hint" style={{ marginLeft: 26 }}>
                {t(
                  "opportunityEditor.guidelinesAcknowledgedAt",
                  {
                    date: new Date(
                      opportunity.guidelinesAcknowledgedAt,
                    ).toLocaleString(),
                  },
                  { default: "Acknowledged {{date}}" },
                )}
              </span>
            ) : null}
          </Field>

          <Field>
            <label
              style={{
                display: "inline-flex",
                gap: 8,
                alignItems: "flex-start",
                cursor: "pointer",
                fontSize: 14,
                color: "#171717",
              }}
            >
              <input
                type="checkbox"
                checked={requestsAppointment}
                onChange={(e) => {
                  setRequestsAppointment(e.target.checked);
                  setDirty(true);
                }}
                style={{ marginTop: 3 }}
              />
              <span>
                {t("opportunityEditor.guidelinesRequestAppointment", {}, {
                  default: "I request an appointment to discuss further.",
                })}
              </span>
            </label>
          </Field>

          {status !== "draft" && !guidelinesAcknowledged ? (
            <Warning>
              <Icon name="warning circle" />{" "}
              {t("opportunityEditor.guidelinesWarning", {}, {
                default:
                  "Tick the guidelines checkbox before submitting this opportunity.",
              })}
            </Warning>
          ) : null}
        </Stack>
      ) : null}
    </Modal>
  );
}
