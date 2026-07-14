import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

const Banner = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 20px;
  border-radius: 12px;
  background: linear-gradient(135deg, #eef5f9 0%, #e3f4ec 100%);
  border: 1px solid #b6dec7;
  color: #1d6b3a;
  margin-bottom: 16px;

  .body {
    flex: 1;
    min-width: 0;
  }

  strong {
    display: block;
    font-size: 15px;
    margin-bottom: 4px;
    color: #1d6b3a;
  }

  span {
    font-size: 13px;
    color: #1d6b3a;
    line-height: 1.4;
  }
`;

const ErrorBanner = styled(Banner)`
  background: #fef2f2;
  border-color: #fecaca;
  color: #991b1b;

  strong,
  span {
    color: #991b1b;
  }
`;

const GLOBE_ICON = (
  <img
    src="/assets/connect/globe.svg"
    alt=""
    aria-hidden
    width={24}
    height={24}
    style={{ marginTop: 2 }}
  />
);

export function ClassNetworkInviteBanner({ network }) {
  const { t } = useTranslation("common");

  if (!network?.id) return null;

  return (
    <Banner>
      {GLOBE_ICON}
      <div className="body">
        <strong>
          {t(
            "auth.classNetworkInvite.bannerTitle",
            { networkTitle: network.title },
            { default: "You're joining {{networkTitle}}" },
          )}
        </strong>
        <span>
          {network.description ||
            t("auth.classNetworkInvite.bannerDescription", {}, {
              default:
                "Log in to join this class network and connect with teachers and students.",
            })}
        </span>
      </div>
    </Banner>
  );
}

export function ClassNetworkInviteErrorBanner({ message }) {
  if (!message) return null;

  return (
    <ErrorBanner>
      {GLOBE_ICON}
      <div className="body">
        <strong>{message}</strong>
      </div>
    </ErrorBanner>
  );
}
