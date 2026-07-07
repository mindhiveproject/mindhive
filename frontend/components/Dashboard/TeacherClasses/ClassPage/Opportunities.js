import absoluteUrl from "next-absolute-url";
import useTranslation from "next-translate/useTranslation";

import CopyButton from "../../../DesignSystem/CopyButton";
import Chip from "../../../DesignSystem/Chip";

export default function ClassOpportunities({ myclass }) {
  const { t } = useTranslation("classes");
  const { origin } = absoluteUrl();
  const networks = myclass?.networks || [];

  return (
    <div className="classTabPage opportunities">
      <section className="classTabSection">
        <div className="classTabSectionHeader">
          <h3>
            {t("opportunities.sponsorSignupTitle", {}, {
              default: "Invite sponsors",
            })}
          </h3>
          <p>
            {t("opportunities.sponsorSignupDescription", {}, {
              default:
                "Share the link below with sponsors so they can sign up and join your class network on MindHive Connect.",
            })}
          </p>
        </div>

        {networks.length === 0 ? (
          <div className="classTabEmpty">
            <p>
              {t("opportunities.noNetworks", {}, {
                default:
                  "This class is not linked to any class networks yet. A network admin can add this class to a network.",
              })}
            </p>
          </div>
        ) : (
          <div className="classTabInformationBlock">
            {networks.map((network) => {
              const sponsorSignupLink = `${origin}/signup/sponsor?classNetwork=${network.id}`;

              return (
                <div className="block" key={network.id}>
                  <div className="classTabInviteBlock">
                    <Chip
                      className="classNetworkChip"
                      label={network.title}
                      shape="square"
                      style={{ width: "fit-content" }}
                    />
                    {network.description ? (
                      <p className="classTabInfoText">{network.description}</p>
                    ) : null}
                    <p className="classTabInviteLabel">
                      {t("opportunities.sponsorLinkLabel", {}, {
                        default: "Sponsor signup link",
                      })}
                    </p>
                    <div className="classTabCopyArea">
                      <div className="classTabInviteLink">
                        {origin}/signup/sponsor?classNetwork={network.id}
                      </div>
                      <CopyButton
                        value={sponsorSignupLink}
                        style={{ fontWeight: 500 }}
                      >
                        {t("opportunities.copyLink", {}, { default: "Copy" })}
                      </CopyButton>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
