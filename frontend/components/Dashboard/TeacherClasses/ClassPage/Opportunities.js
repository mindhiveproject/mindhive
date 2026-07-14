import { useCallback, useEffect, useRef, useState } from "react";
import absoluteUrl from "next-absolute-url";
import useTranslation from "next-translate/useTranslation";

import CopyButton from "../../../DesignSystem/CopyButton";
import Chip from "../../../DesignSystem/Chip";
import ClassMatchingRoundSection from "./ClassMatchingRoundSection";
import OpportunityPreviewModal from "./OpportunityPreviewModal";

const GLOBE_ICON = (
  <img
    src="/assets/connect/globe.svg"
    alt=""
    aria-hidden
    width={24}
    height={24}
  />
);

export default function ClassOpportunities({ myclass }) {
  const { t } = useTranslation("classes");
  const { origin } = absoluteUrl();
  const networks = myclass?.networks || [];

  const [selectedNetworkId, setSelectedNetworkId] = useState(null);
  const [previewOpportunityId, setPreviewOpportunityId] = useState(null);
  const [matchingRoundContext, setMatchingRoundContext] = useState(null);
  const navigationGuardRef = useRef(null);

  const handleNetworkSelect = useCallback((networkId) => {
    if (networkId === selectedNetworkId) return;
    const guard = navigationGuardRef.current;
    if (guard && !guard()) return;
    setSelectedNetworkId(networkId);
  }, [selectedNetworkId]);

  const handleRegisterNavigationGuard = useCallback((guard) => {
    navigationGuardRef.current = guard;
  }, []);

  useEffect(() => {
    if (networks.length === 0) {
      setSelectedNetworkId(null);
      return;
    }

    const stillValid = networks.some((network) => network.id === selectedNetworkId);
    if (!selectedNetworkId || !stillValid) {
      setSelectedNetworkId(networks[0].id);
    }
  }, [networks, selectedNetworkId]);

  const selectedNetwork = networks.find(
    (network) => network.id === selectedNetworkId,
  );

  const sponsorSignupAndInviteLink = selectedNetworkId
    ? `${origin}/signup/sponsor?classNetwork=${selectedNetworkId}`
    : "";
  const sponsorNetworkInviteLink = selectedNetworkId
    ? `${origin}/login?classNetwork=${selectedNetworkId}`
    : "";

  return (
    <div className="classTabPage opportunities">
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
        <>
          <section className="classTabSection">
            <div className="classTabSectionHeader">
              <h3>
                {t("opportunities.networkSection.title", {}, {
                  default: "Class network",
                })}
              </h3>
              <p>
                {t("opportunities.networkSection.description", {}, {
                  default:
                    "Choose a class network to manage matching, browse opportunities, and invite sponsors.",
                })}
              </p>
            </div>

            <div
              className="classTabNetworkChipRow"
              role="tablist"
              aria-label={t("opportunities.networkSelectorLabel", {}, {
                default: "Class network",
              })}
            >
              {networks.map((network) => (
                <Chip
                  key={network.id}
                  className="classNetworkChip"
                  label={network.title}
                  shape="square"
                  selected={network.id === selectedNetworkId}
                  onClick={() => handleNetworkSelect(network.id)}
                  leading={GLOBE_ICON}
                  ariaLabel={network.title}
                />
              ))}
            </div>

            {selectedNetwork ? (
              <div className="classTabNetworkInvite">
                <div className="networkInviteText">
                  <p className="networkInviteTitle">
                    {t("opportunities.compactInvite.title", {}, {
                      default: "Invite sponsors",
                    })}
                  </p>
                  <p className="networkInviteDescription">
                    {t("opportunities.compactInvite.description", {}, {
                      default:
                        "Copy a link for new sponsors to sign up and join this network, or for existing sponsors to join the network only.",
                    })}
                  </p>
                </div>
                <div className="networkInviteActions">
                  <CopyButton
                    value={sponsorSignupAndInviteLink}
                    style={{ fontWeight: 500 }}
                    ariaLabel={t("opportunities.compactInvite.signupAndInviteLink", {}, {
                      default: "Signup + invite to network",
                    })}
                  >
                    {t("opportunities.compactInvite.signupAndInviteLink", {}, {
                      default: "Signup + invite to network",
                    })}
                  </CopyButton>
                  <CopyButton
                    value={sponsorNetworkInviteLink}
                    style={{ fontWeight: 500 }}
                    ariaLabel={t("opportunities.compactInvite.inviteToNetworkLink", {}, {
                      default: "Invite to network only",
                    })}
                  >
                    {t("opportunities.compactInvite.inviteToNetworkLink", {}, {
                      default: "Invite to network only",
                    })}
                  </CopyButton>
                </div>
              </div>
            ) : null}
          </section>

          <ClassMatchingRoundSection
            myclass={myclass}
            selectedNetworkId={selectedNetworkId}
            selectedNetwork={selectedNetwork}
            onPreviewOpportunity={setPreviewOpportunityId}
            onRegisterNavigationGuard={handleRegisterNavigationGuard}
            onMatchingRoundContextChange={setMatchingRoundContext}
          />
        </>
      )}

      <OpportunityPreviewModal
        open={!!previewOpportunityId}
        opportunityId={previewOpportunityId}
        onClose={() => setPreviewOpportunityId(null)}
        matchingRoundContext={matchingRoundContext}
      />
    </div>
  );
}
