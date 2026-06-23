"use client";

import { useMutation } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import DesignSystemButton from "../DesignSystem/Button";
import { GENERATE_AI_FEEDBACK_HELP } from "../Mutations/Review";

const AI_ICON = (
  <img
    src="/assets/helpcenter/aichat.svg"
    alt=""
    width={24}
    height={24}
    aria-hidden
  />
);

const panelStyles = {
  border: "1px solid var(--MH-Theme-Primary-Light, #DEF8FB)",
  background: "var(--MH-Theme-Neutrals-Light-Green, #F6F9F8)",
  borderRadius: "16px",
  padding: "16px",
  marginTop: "12px",
  display: "grid",
  gap: "12px",
};

const resultStyles = {
  background: "var(--MH-Theme-Neutrals-White, #FFFFFF)",
  border: "1px solid var(--MH-Theme-Neutrals-Light, #E6E6E6)",
  borderRadius: "12px",
  padding: "12px",
  whiteSpace: "pre-wrap",
};

export default function AiFeedbackPanel({
  proposalId,
  questionNumber,
  questionName,
  currentTextContent,
}) {
  const { t } = useTranslation("builder");
  const [generateHelp, { data, loading, error }] = useMutation(
    GENERATE_AI_FEEDBACK_HELP
  );

  const result = data?.generateAiFeedbackHelp?.result;
  const threadId = data?.generateAiFeedbackHelp?.threadId;
  const status = data?.generateAiFeedbackHelp?.status;

  const handleGenerate = async () => {
    await generateHelp({
      variables: {
        input: {
          proposalId,
          questionNumber,
          questionName,
          currentTextContent: currentTextContent || "",
        },
      },
    });
  };

  return (
    <section style={panelStyles} aria-label={t("aiFeedback.panelLabel", {}, { default: "AI feedback helper" })}>
      <div>
        <strong>
          {t("aiFeedback.title", {}, { default: "AI feedback helper" })}
        </strong>
        <p style={{ margin: "4px 0 0" }}>
          {t(
            "aiFeedback.description",
            {},
            {
              default:
                "Generate a short coaching prompt to help shape this feedback.",
            }
          )}
        </p>
      </div>

      <DesignSystemButton
        variant="outline"
        type="button"
        onClick={handleGenerate}
        disabled={loading || !proposalId || !questionNumber}
        leadingIcon={AI_ICON}
        aria-label={t("aiFeedback.generateAria", {}, { default: "Generate AI feedback help" })}
        style={{ background: "#336F8A", color: "#F3F3F3" }}
      >
        {loading
          ? t("aiFeedback.loading", {}, { default: "Generating..." })
          : t("aiFeedback.generate", {}, { default: "Generate feedback help" })}
      </DesignSystemButton>

      {error && (
        <div role="alert" style={{ color: "#9F1D20" }}>
          <strong>
            {t("aiFeedback.errorTitle", {}, { default: "Could not generate help" })}
          </strong>
          <div>{error.message}</div>
        </div>
      )}

      {result?.textDisplay && (
        <div style={resultStyles}>
          <strong>
            {t("aiFeedback.resultTitle", {}, { default: "Suggested guidance" })}
          </strong>
          <p style={{ marginBottom: 0 }}>{result.textDisplay}</p>
          {!!result.buttonsArray?.length && (
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {result.buttonsArray.map((button) => (
                <span
                  key={`${button.text}-${button.action || "action"}`}
                  style={{
                    border: "1px solid #A1A1A1",
                    borderRadius: "999px",
                    padding: "4px 10px",
                    fontSize: "13px",
                  }}
                >
                  {button.text}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {threadId && (
        <small>
          {t(
            "aiFeedback.threadStatus",
            { threadId, status },
            { default: "Thread {{threadId}}: {{status}}" }
          )}
        </small>
      )}
    </section>
  );
}
