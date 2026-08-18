import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

import Chip from "../../../DesignSystem/Chip";
import CopyButton from "../../../DesignSystem/CopyButton";
import InfoPopover from "../../../DesignSystem/InfoPopover";

const VERIFICATION_EMAIL = "info@mindhive.science";

const Wrap = styled.span`
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  vertical-align: middle;
`;

const VERIFIED_CHIP_STYLE = {
  borderColor: "var(--MH-Theme-Success, #1d6b3a)",
  background: "#eef8f1",
  backgroundColor: "#eef8f1",
  color: "var(--MH-Theme-Success, #1d6b3a)",
};

const UNVERIFIED_CHIP_STYLE = {
  borderColor: "#a1a1a1",
  background: "#f3f3f3",
  backgroundColor: "#f3f3f3",
  color: "#5f6871",
};

const VerifiedIcon = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden
  >
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
  </svg>
);

/**
 * Shows whether an organization is verified. Unverified state includes a
 * tooltip directing admins to contact MindHive for verification.
 */
export default function OrganizationVerificationStatus({
  verified,
  size = "default",
}) {
  const { t } = useTranslation("connect");
  const compact = size === "compact";

  if (verified) {
    return (
      <Wrap
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <Chip
          label={t("organizationsDetail.verification.verified", {}, {
            default: "Verified",
          })}
          leading={VerifiedIcon}
          shape="pill"
          style={{
            ...VERIFIED_CHIP_STYLE,
            ...(compact
              ? { height: 28, paddingLeft: 10, paddingRight: 10, fontSize: 12 }
              : null),
          }}
        />
      </Wrap>
    );
  }

  const tooltip = t(
    "organizationsDetail.verification.notVerifiedTooltip",
    {},
    {
      default:
        "Contact info@mindhive.science to get your organization verified.",
    },
  );

  return (
    <Wrap
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <InfoPopover
        content={
          <>
            {tooltip}
            <div style={{ marginTop: 8 }}>
              <CopyButton
                value={VERIFICATION_EMAIL}
                style={{ fontWeight: 500 }}
                ariaLabel={t(
                  "organizationsDetail.verification.copyEmailAria",
                  {},
                  { default: "Copy info@mindhive.science to clipboard" },
                )}
              >
                {t("organizationsDetail.verification.copyEmail", {}, {
                  default: "Copy email address",
                })}
              </CopyButton>
            </div>
          </>
        }
        ariaLabel={t("organizationsDetail.verification.notVerified", {}, {
          default: "Not verified",
        })}
      >
        <Chip
          label={t("organizationsDetail.verification.notVerified", {}, {
            default: "Not verified",
          })}
          shape="pill"
          style={{
            ...UNVERIFIED_CHIP_STYLE,
            ...(compact
              ? { height: 28, paddingLeft: 10, paddingRight: 10, fontSize: 12 }
              : null),
            cursor: "pointer",
          }}
        />
      </InfoPopover>
    </Wrap>
  );
}
