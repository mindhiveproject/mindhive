"use client";

import useTranslation from "next-translate/useTranslation";

import LoadingIcon from "./LoadingIcon";

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
          width: 32,
          height: 32,
          flexShrink: 0,
        }}
      >
        <LoadingIcon size={32} />
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          fontStyle: "normal",
          whiteSpace: hasCustomMessage ? "normal" : "nowrap",
          textAlign: "center",
          maxWidth: hasCustomMessage ? 420 : undefined,
        }}
      >
        <p
          className="MH-Type-Title-Base"
          style={{
            margin: 0,
            color: "#000000",
          }}
        >
          {title}
        </p>
        <p
          className="MH-Type-Body-Base"
          style={{
            margin: 0,
            color: "#000000",
            opacity: 0.95,
          }}
        >
          {body}
        </p>
      </div>
    </div>
  );
}
