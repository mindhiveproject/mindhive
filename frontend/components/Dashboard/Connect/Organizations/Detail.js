import { useState } from "react";
import { useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import Link from "next/link";
import styled from "styled-components";
import { Icon, Label } from "semantic-ui-react";
import useTranslation from "next-translate/useTranslation";

import DesignSystemButton from "../../../DesignSystem/Button";
import { EXPLORE_ORGANIZATION_DETAIL } from "../../../Queries/Organization";
import OrganizationAdminPanels from "./OrganizationAdminPanels";
import OrganizationProfileEditor from "./OrganizationProfileEditor";
import { formatDateLabel, isOrganizationAdmin } from "./utils";

const Shell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 32px clamp(16px, 6vw, 64px);
  padding-top: 0px;
  background-color: #f7f9f8;
  min-height: 100vh;
  border-radius: 32px 0 0 32px;
`;

const BACK_CHEVRON = (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <path
      d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12l4.58-4.59z"
      fill="currentColor"
    />
  </svg>
);

const BackLink = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  padding: 0;
  background: none;
  border: none;
  border-radius: 8px;
  color: var(--MH-Theme-Primary-Dark, #336f8a);
  cursor: pointer;

  &:hover:not(:disabled) {
    background: rgba(51, 111, 138, 0.08);
  }

  &:focus-visible {
    outline: 2px solid var(--MH-Theme-Primary-Dark, #336f8a);
    outline-offset: 2px;
  }
`;

const Hero = styled.div`
  display: flex;
  gap: 24px;
  align-items: center;
  padding: 28px;
  border-radius: 16px;
  background: linear-gradient(135deg, #f7f9f8 0%, #eef5f9 100%);
  border: 1px solid #d3dae0;
  flex-wrap: wrap;

  .logo {
    width: 96px;
    height: 96px;
    border-radius: 16px;
    background: #ffffff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    flex: none;
    border: 1px solid #d3dae0;
  }

  .logo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .placeholder {
    color: #5f6871;
    font-weight: 700;
    font-size: 40px;
  }

  .info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  h1 {
    margin: 0;
    font-family: "Lato", sans-serif;
    font-size: clamp(28px, 4vw, 38px);
    color: #171717;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .tagline {
    color: var(--MH-Theme-Primary-Dark, #336f8a);
    font-style: italic;
  }

  .meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    font-family: "Inter", sans-serif;
    font-size: 16px;
    font-weight: 500;
    line-height: 16px;
    color: #5f6871;

    span {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      line-height: 16px;
    }

    i.icon {
      margin: 0 !important;
      padding: 0 !important;
      line-height: 1 !important;
      font-size: 12px !important;
      height: 12px !important;
      width: 12px !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      flex-shrink: 0;
    }

    a {
      color: var(--MH-Theme-Primary-Dark, #336f8a);
      text-decoration: none;
      line-height: 16px;

      &:focus-visible {
        outline: 2px solid var(--MH-Theme-Primary-Dark, #336f8a);
        outline-offset: 2px;
      }
    }
  }
`;

const Card = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0px 4px 24px rgba(0, 0, 0, 0.05);

  h2 {
    margin: 0;
    font-family: "Lato", sans-serif;
    font-size: 18px;
    color: #171717;
  }

  .helper {
    color: #5f6871;
    font-size: 14px;
  }
`;

const InterestChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  .chip {
    display: inline-flex;
    align-items: center;
    padding: 6px 12px;
    border-radius: 100px;
    background: #eef5f9;
    color: var(--MH-Theme-Primary-Dark, #336f8a);
    font-family: "Inter", sans-serif;
    font-size: 13px;
    font-weight: 500;
    line-height: 18px;
  }
`;

const OpportunityGrid = styled.div`
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
`;

const OppCard = styled.a`
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #d3dae0;
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  cursor: pointer;

  &:hover {
    border-color: var(--MH-Theme-Primary-Dark, #336f8a);
  }

  &:focus-visible {
    outline: 2px solid var(--MH-Theme-Primary-Dark, #336f8a);
    outline-offset: 2px;
  }

  .cover {
    height: 100px;
    background: ${({ $src }) =>
      $src ? `url(${$src}) center/cover no-repeat #eef1f2` : "#eef1f2"};
  }

  .body {
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .title {
    font-weight: 600;
    color: #171717;
    font-size: 14px;
  }

  .desc {
    color: #5f6871;
    font-size: 12px;
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .meta {
    margin-top: auto;
    padding-top: 6px;
    border-top: 1px solid #eef1f2;
    color: #5f6871;
    font-family: "Inter", sans-serif;
    font-size: 16px;
    font-weight: 500;
    line-height: 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
`;

const DOMAIN_KEYS = {
  academic: "academic",
  government: "government",
  industry: "industry",
  nonprofit: "nonprofit",
  other: "other",
};

function DecorativeIcon({ name }) {
  return <Icon name={name} aria-hidden />;
}

export default function OrganizationDetail({ organizationId, user }) {
  const router = useRouter();
  const { t } = useTranslation("connect");
  const [editingProfile, setEditingProfile] = useState(false);

  const { data, loading } = useQuery(EXPLORE_ORGANIZATION_DETAIL, {
    variables: { id: organizationId },
    fetchPolicy: "cache-and-network",
  });
  const org = data?.organization;
  const canManage = isOrganizationAdmin(user, org, organizationId);

  const domainLabel = (domain) => {
    const key = DOMAIN_KEYS[domain];
    if (!key) return domain;
    return t(`organizationsList.domains.${key}`, {}, { default: domain });
  };

  if (loading && !org) {
    return (
      <Shell>
        <p>
          {t("organizationsDetail.loading", {}, {
            default: "Loading organization…",
          })}
        </p>
      </Shell>
    );
  }
  if (!org) {
    return (
      <Shell>
        <p>
          {t("organizationsDetail.notFound", {}, {
            default: "Organization not found.",
          })}
        </p>
      </Shell>
    );
  }

  const backLabel = t("organizationsDetail.back", {}, { default: "Back" });
  const opensInNewTab = t("a11y.opensInNewTab", {}, {
    default: "(opens in new tab)",
  });

  return (
    <Shell>
      <BackLink
        type="button"
        onClick={() => router.back()}
        aria-label={backLabel}
        title={backLabel}
      >
        {BACK_CHEVRON}
      </BackLink>

      <Hero>
        <div className="logo">
          {org.logo?.url ? (
            <img src={org.logo.url} alt="" />
          ) : (
            <span className="placeholder" aria-hidden>
              {(org.name || "?").charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="info">
          <h1>
            {org.name}
            {org.verified && (
              <Label color="green" size="tiny">
                <DecorativeIcon name="check circle" />
                {t("a11y.verified", {}, { default: "Verified" })}
              </Label>
            )}
          </h1>
          {org.tagline && <span className="tagline">{org.tagline}</span>}
          <div className="meta">
            {org.department && (
              <span>
                <DecorativeIcon name="building" /> {org.department}
              </span>
            )}
            {org.location && (
              <span>
                <DecorativeIcon name="map marker alternate" /> {org.location}
              </span>
            )}
            {org.primaryDomain && (
              <span>
                <DecorativeIcon name="tag" /> {domainLabel(org.primaryDomain)}
              </span>
            )}
            {org.website && (
              <span>
                <DecorativeIcon name="globe" />
                <a
                  href={org.website}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${t("organizationsDetail.website", {}, {
                    default: "Website",
                  })} ${opensInNewTab}`}
                >
                  {t("organizationsDetail.website", {}, { default: "Website" })}
                </a>
              </span>
            )}
          </div>
        </div>
      </Hero>

      {canManage && !editingProfile && (
        <div>
          <DesignSystemButton
            variant="tonal"
            type="button"
            onClick={() => setEditingProfile(true)}
          >
            {t("organizationsDetail.editOrganizationDetails", {}, {
              default: "Edit organization details",
            })}
          </DesignSystemButton>
        </div>
      )}

      {canManage && editingProfile ? (
        <OrganizationProfileEditor
          organization={org}
          organizationId={org.id}
          onCancel={() => setEditingProfile(false)}
          onSaved={() => setEditingProfile(false)}
        />
      ) : (
        <>
          {org.mission ? (
            <Card>
              <h2>
                {t("organizationsDetail.about", {}, { default: "About" })}
              </h2>
              <p
                style={{
                  margin: 0,
                  color: "#5f6871",
                  fontSize: 14,
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                }}
              >
                {org.mission}
              </p>
            </Card>
          ) : null}
          {org.interests?.length > 0 ? (
            <Card>
              <h2>
                {t("organizationsDetail.interests", {}, {
                  default: "Interests",
                })}
              </h2>
              <InterestChips>
                {org.interests.map((tag) => (
                  <span key={tag.id} className="chip">
                    {tag.title}
                  </span>
                ))}
              </InterestChips>
            </Card>
          ) : null}
        </>
      )}

      <OrganizationAdminPanels
        organization={org}
        organizationId={organizationId}
        canManage={canManage}
        user={user}
      />

      <Card>
        <h2>
          {t("organizationsDetail.opportunities", {}, {
            default: "Opportunities",
          })}
        </h2>
        {org.opportunities?.length > 0 ? (
          <OpportunityGrid>
            {org.opportunities.map((opp) => {
              const coverSrc =
                opp.coverImage?.url || opp.coverImageUrl || null;
              const from = formatDateLabel(opp.availableFrom);
              const to = formatDateLabel(opp.availableTo);
              return (
                <Link
                  key={opp.id}
                  href={{
                    pathname: "/dashboard/connect/explore",
                    query: { op: opp.id },
                  }}
                  passHref
                  legacyBehavior
                >
                  <OppCard $src={coverSrc}>
                    <div
                      className="cover"
                      role={coverSrc ? "img" : undefined}
                      aria-label={coverSrc ? opp.title : undefined}
                    />
                    <div className="body">
                      <div className="title">{opp.title}</div>
                      {opp.shortDescription && (
                        <div className="desc">{opp.shortDescription}</div>
                      )}
                      <div className="meta">
                        {opp.teamSize > 1 ? (
                          <span>
                            {t(
                              "organizationsDetail.teamOf",
                              { size: opp.teamSize },
                              { default: "Team of {{size}}" }
                            )}
                          </span>
                        ) : (
                          <span>
                            {t("organizationsDetail.solo", {}, {
                              default: "Solo",
                            })}
                          </span>
                        )}
                        {(from || to) && (
                          <span>
                            {from || "—"} → {to || "—"}
                          </span>
                        )}
                        {opp.publicRatingCount > 0 && (
                          <span>
                            <span style={{ color: "#f5b800" }} aria-hidden>
                              ★
                            </span>
                            {opp.publicRatingAverage?.toFixed(1)} (
                            {opp.publicRatingCount})
                          </span>
                        )}
                      </div>
                    </div>
                  </OppCard>
                </Link>
              );
            })}
          </OpportunityGrid>
        ) : (
          <p className="helper">
            {t("organizationsDetail.noOpportunities", { name: org.name }, {
              default: "{{name}} hasn't published any opportunities yet.",
            })}
          </p>
        )}
      </Card>
    </Shell>
  );
}
