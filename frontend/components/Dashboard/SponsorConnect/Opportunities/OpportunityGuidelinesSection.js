import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

import Chip from "../../../DesignSystem/Chip";

export const GUIDELINE_DOCUMENTS = [
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
  gap: 12px;
`;

const Title = styled.h2`
  margin: 0;
  font-family: "Lato", sans-serif;
  font-size: 18px;
  color: var(--MH-Theme-Neutrals-Black, #171717);
`;

const Description = styled.p`
  margin: 0;
  font-family: "Inter", sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: var(--MH-Theme-Neutrals-Black, #171717);
`;

const LinkChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  a {
    display: inline-flex;
    text-decoration: none;
    color: inherit;
  }
`;

const CheckRow = styled.label`
  display: inline-flex;
  gap: 8px;
  align-items: flex-start;
  font-family: "Inter", sans-serif;
  font-size: 14px;
  color: var(--MH-Theme-Neutrals-Black, #171717);
  cursor: ${(p) => (p.$editable ? "pointer" : "default")};
`;

const Hint = styled.span`
  display: block;
  margin-left: 26px;
  font-family: "Inter", sans-serif;
  font-size: 12px;
  line-height: 1.4;
  color: var(--MH-Theme-Neutrals-Dark, #5f6871);
`;

/**
 * Proposal-guidelines block for the opportunity intake form.
 * Documents stay available; acknowledgment + appointment are editable
 * only while creating (`editable`), then read-only with recorded values.
 */
export default function OpportunityGuidelinesSection({
  editable = false,
  guidelinesAcknowledged = false,
  requestsAppointment = false,
  guidelinesAcknowledgedAt = null,
  onGuidelinesAcknowledgedChange,
  onRequestsAppointmentChange,
  titleAs = "h2",
}) {
  const { t } = useTranslation("connect");

  const acknowledgedAtLabel = guidelinesAcknowledgedAt
    ? t(
        "opportunityEditor.guidelinesAcknowledgedAt",
        {
          date: new Date(guidelinesAcknowledgedAt).toLocaleString(),
        },
        { default: "Acknowledged {{date}}" },
      )
    : guidelinesAcknowledged
    ? t("opportunityEditor.guidelinesAcknowledgedNoDate", {}, {
        default: "Acknowledged",
      })
    : t("opportunityEditor.guidelinesNotAcknowledged", {}, {
        default: "Not acknowledged at creation",
      });

  const appointmentLabel = requestsAppointment
    ? t("opportunityEditor.guidelinesAppointmentYes", {}, {
        default: "Appointment requested",
      })
    : t("opportunityEditor.guidelinesAppointmentNo", {}, {
        default: "No appointment requested",
      });

  return (
    <Stack>
      <Title as={titleAs}>
        {t("opportunityEditor.guidelinesTitle", {}, {
          default: "Understanding of Proposal Guidelines",
        })}
      </Title>
      <Description>
        {t("opportunityEditor.guidelinesDescription", {}, {
          default:
            "I have read and understood the Capstone proposal guidelines in full, including all of the Capstone Sponsor FAQs and Mutual Expectations agreement and agree to abide by them.",
        })}
      </Description>
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

      {editable ? (
        <>
          <CheckRow $editable>
            <input
              type="checkbox"
              name="guidelinesAcknowledged"
              checked={!!guidelinesAcknowledged}
              onChange={(e) =>
                onGuidelinesAcknowledgedChange?.(e.target.checked)
              }
              style={{ marginTop: 3 }}
            />
            <span>
              <strong>
                {t("opportunityEditor.guidelinesAgree", {}, {
                  default: "I agree with this statement.",
                })}
              </strong>
            </span>
          </CheckRow>
          <CheckRow $editable>
            <input
              type="checkbox"
              name="requestsAppointment"
              checked={!!requestsAppointment}
              onChange={(e) =>
                onRequestsAppointmentChange?.(e.target.checked)
              }
              style={{ marginTop: 3 }}
            />
            <span>
              {t("opportunityEditor.guidelinesRequestAppointment", {}, {
                default: "I request an appointment to discuss further.",
              })}
            </span>
          </CheckRow>
        </>
      ) : (
        <>
          <CheckRow $editable={false}>
            <input
              type="checkbox"
              checked={!!guidelinesAcknowledged}
              disabled
              readOnly
              style={{ marginTop: 3 }}
              aria-label={t("opportunityEditor.guidelinesAgree", {}, {
                default: "I agree with this statement.",
              })}
            />
            <span>
              <strong>
                {t("opportunityEditor.guidelinesAgree", {}, {
                  default: "I agree with this statement.",
                })}
              </strong>
            </span>
          </CheckRow>
          <Hint>{acknowledgedAtLabel}</Hint>
          <CheckRow $editable={false}>
            <input
              type="checkbox"
              checked={!!requestsAppointment}
              disabled
              readOnly
              style={{ marginTop: 3 }}
              aria-label={t(
                "opportunityEditor.guidelinesRequestAppointment",
                {},
                { default: "I request an appointment to discuss further." },
              )}
            />
            <span>
              {t("opportunityEditor.guidelinesRequestAppointment", {}, {
                default: "I request an appointment to discuss further.",
              })}
            </span>
          </CheckRow>
          <Hint>{appointmentLabel}</Hint>
        </>
      )}
    </Stack>
  );
}
