import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@apollo/client";
import absoluteUrl from "next-absolute-url";
import useTranslation from "next-translate/useTranslation";

import CopyButton from "../../../DesignSystem/CopyButton";
import Chip from "../../../DesignSystem/Chip";
import { NETWORK_OPPORTUNITIES_FOR_ROUND } from "../../../Queries/ConnectRound";
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

const HIDDEN_OPPORTUNITY_STATUSES = new Set(["draft", "closed", "archived"]);

const STATUS_KEYS = {
  draft: "draft",
  pending_review: "pendingReview",
  pre_selected: "preSelected",
  accepted: "accepted",
  published: "published",
  closed: "closed",
  archived: "archived",
};

function displayName(profile) {
  if (!profile) return null;
  return (
    `${profile.firstName || ""} ${profile.lastName || ""}`.trim() ||
    profile.username
  );
}

function formatDate(value) {
  if (!value) return null;
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return null;
  }
}

export default function ClassOpportunities({ myclass }) {
  const { t } = useTranslation("classes");
  const { origin } = absoluteUrl();
  const networks = myclass?.networks || [];

  const [selectedNetworkId, setSelectedNetworkId] = useState(null);
  const [previewOpportunityId, setPreviewOpportunityId] = useState(null);
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

  const { data: opportunitiesData, loading: loadingOpportunities } = useQuery(
    NETWORK_OPPORTUNITIES_FOR_ROUND,
    {
      variables: { classNetworkId: selectedNetworkId },
      skip: !selectedNetworkId,
      fetchPolicy: "cache-and-network",
    },
  );

  const opportunities = useMemo(() => {
    const list = (opportunitiesData?.opportunities || []).filter(
      (opportunity) => !HIDDEN_OPPORTUNITY_STATUSES.has(opportunity.status),
    );
    return [...list].sort((a, b) =>
      (a.title || "").localeCompare(b.title || "", undefined, {
        sensitivity: "base",
      }),
    );
  }, [opportunitiesData]);

  const statusLabel = (status) => {
    const key = STATUS_KEYS[status];
    if (!key) return status;
    return t(`opportunities.status.${key}`, {}, { default: status });
  };

  const sponsorSignupLink = selectedNetworkId
    ? `${origin}/signup/sponsor?classNetwork=${selectedNetworkId}`
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
                        "Copy the link to share with sponsors so they can join the selected class network.",
                    })}
                  </p>
                </div>
                <div className="networkInviteActions">
                  <CopyButton value={sponsorSignupLink} style={{ fontWeight: 500 }}>
                    {t("opportunities.copyLink", {}, { default: "Copy link" })}
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
          />

          <section className="classTabSection">
            <div className="classTabSectionHeader">
              <h3>
                {t("opportunities.networkOpportunitiesTitle", {}, {
                  default: "Network opportunities",
                })}
              </h3>
              <p>
                {t("opportunities.networkOpportunitiesDescription", {}, {
                  default:
                    "Opportunities are published to class networks. A matching round draws from opportunities in the selected network. Click one to preview its content.",
                })}
              </p>
            </div>

            {!selectedNetworkId ? (
              <div className="classTabEmpty">
                <p>
                  {t("opportunities.selectNetworkFirst", {}, {
                    default: "Select a class network above to continue.",
                  })}
                </p>
              </div>
            ) : loadingOpportunities && opportunities.length === 0 ? (
              <div className="classTabEmpty">
                <p>
                  {t("opportunities.loadingOpportunities", {}, {
                    default: "Loading opportunities…",
                  })}
                </p>
              </div>
            ) : opportunities.length === 0 ? (
              <div className="classTabEmpty">
                <p>
                  {t("opportunities.noOpportunities", {}, {
                    default:
                      "No opportunities have been added to this class network yet. Mentors can publish opportunities and select this network as a destination.",
                  })}
                </p>
              </div>
            ) : (
              <div className="classTabOpportunityList">
                {opportunities.map((opportunity) => {
                  const mentorName = displayName(opportunity.mentor);
                  const from = formatDate(opportunity.availableFrom);
                  const to = formatDate(opportunity.availableTo);
                  const isPublished = opportunity.status === "published";

                  return (
                    <button
                      key={opportunity.id}
                      type="button"
                      className="classTabOpportunityRow"
                      onClick={() => setPreviewOpportunityId(opportunity.id)}
                    >
                      <div className="rowTitle">
                        <span>{opportunity.title}</span>
                        {opportunity.status ? (
                          <span
                            className={`rowStatus${
                              isPublished ? " rowStatusPublished" : ""
                            }`}
                          >
                            {statusLabel(opportunity.status)}
                          </span>
                        ) : null}
                      </div>
                      {opportunity.shortDescription ? (
                        <p className="rowDescription">
                          {opportunity.shortDescription}
                        </p>
                      ) : null}
                      <p className="rowMeta">
                        {mentorName
                          ? t(
                              "opportunities.rowMeta.byMentor",
                              { name: mentorName },
                              { default: "By {{name}}" },
                            )
                          : null}
                        {mentorName ? " · " : ""}
                        {t(
                          "opportunities.rowMeta.capacity",
                          { count: opportunity.studentCapacity ?? 1 },
                          { default: "Capacity {{count}}" },
                        )}
                        {opportunity.teamSize > 1
                          ? ` · ${t(
                              "opportunities.rowMeta.teamOf",
                              { size: opportunity.teamSize },
                              { default: "Team of {{size}}" },
                            )}`
                          : ""}
                        {(from || to) && ` · ${from || "—"} → ${to || "—"}`}
                        {opportunity.timeCommitment
                          ? ` · ${opportunity.timeCommitment}`
                          : ""}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}

      <OpportunityPreviewModal
        open={!!previewOpportunityId}
        opportunityId={previewOpportunityId}
        onClose={() => setPreviewOpportunityId(null)}
      />
    </div>
  );
}
