"use client";

import useTranslation from "next-translate/useTranslation";
import { Loader } from "semantic-ui-react";

/**
 * @param {{ h1?: string, p?: string }} [message] — Optional copy; keys match heading + paragraph.
 * When set, `h1` / `p` fall back to builder defaults if omitted.
 */
export default function JustOneSecondNotice({
  variant = "codeRunning",
  className,
  message,
}) {
  const { t } = useTranslation("builder");

  const defaultTitle = t("codeExecution.justOneSecondTitle", "Just one second");

  const codeRunningMessage = t(
    "codeExecution.codeRunningMessage",
    "The code is running."
  );

  const librariesLoadingMessage = t(
    "codeExecution.librariesLoadingMessage",
    "The data analysis libraries are loading."
  );

  const defaultBody =
    variant === "librariesLoading" ? librariesLoadingMessage : codeRunningMessage;

  const hasCustomMessage =
    message &&
    typeof message === "object" &&
    (message.h1 != null || message.p != null);

  const title = hasCustomMessage ? message.h1 ?? defaultTitle : defaultTitle;

  const body = hasCustomMessage ? message.p ?? defaultBody : defaultBody;

  return (
    <div
      className={className}
      style={{
        border: "1px solid #A1A1A1",
        borderRadius: 8,
        padding: 16,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        overflow: "clip",
        position: "relative",
        width: "fit-content",
        // Ensure the notice stays centered inside both flex and grid parents.
        margin: "16px",
        alignSelf: "center",
        justifySelf: "center",
      }}
      aria-live="polite"
    >
      <div
        style={{
          position: "relative",
          width: 40,
          height: 40,
          flexShrink: 0,
        }}
      >
        <Loader active inline="centered" />
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          lineHeight: "24px",
          fontStyle: "normal",
          whiteSpace: hasCustomMessage ? "normal" : "nowrap",
          textAlign: "center",
          maxWidth: hasCustomMessage ? 420 : undefined,
        }}
      >
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 600,
            fontSize: 16,
            margin: 0,
            color: "#000000",
          }}
        >
          {title}
        </p>
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 400,
            fontSize: 16,
            margin: 0,
            color: "#000000",
            opacity: 0.95,
          }}
        >
          {body}
        </p>
      </div>

      <style jsx>{`
        @keyframes mh-justOneSecond-pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.85;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

