import { useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import Link from "next/link";
import styled from "styled-components";
import { Icon, Label } from "semantic-ui-react";
import useTranslation from "next-translate/useTranslation";

import { EXPLORE_ORGANIZATION_DETAIL } from "../../../Queries/Organization";

const Shell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 32px clamp(16px, 6vw, 64px);
  background-color: #f7f9f8;
  min-height: 100vh;
  border-radius: 32px 0 0 32px;
`;

const BackLink = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: #336f8a;
  font-family: "Nunito", sans-serif;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  padding: 0;
  width: max-content;

  &:focus-visible {
    outline: 2px solid #336f8a;
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
    color: #336f8a;
    font-style: italic;
  }

  .meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    font-size: 13px;
    color: #5f6871;

    span {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    a {
      color: #336f8a;
      text-decoration: none;

      &:focus-visible {
        outline: 2px solid #336f8a;
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

const Members = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;

  .member {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    width: 110px;
    text-align: center;
  }

  .avatar {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: #eef1f2;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .placeholder {
      color: #5f6871;
      font-weight: 700;
      font-size: 22px;
    }
  }

  .name {
    color: #171717;
    font-weight: 600;
    font-size: 13px;
    line-height: 1.2;
  }

  .tag {
    color: #5f6871;
    font-size: 11px;
  }

  a {
    text-decoration: none;
    color: inherit;

    &:focus-visible {
      outline: 2px solid #336f8a;
      outline-offset: 2px;
      border-radius: 8px;
    }
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
    border-color: #336f8a;
  }

  &:focus-visible {
    outline: 2px solid #336f8a;
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
    color: #888;
    font-size: 11px;
    display: flex;
    gap: 8px;
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

function formatDate(value) {
  if (!value) return null;
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return null;
  }
}

export default function OrganizationDetail({ organizationId }) {
  const router = useRouter();
  const { t } = useTranslation("connect");
  const { data, loading } = useQuery(EXPLORE_ORGANIZATION_DETAIL, {
    variables: { id: organizationId },
    fetchPolicy: "cache-and-network",
  });
  const org = data?.organization;

  const domainLabel = (domain) => {
    const key = DOMAIN_KEYS[domain];
    if (!key) return domain;
    return t(`organizationsList.domains.${key}`, {}, { default: domain });
  };

  const displayName = (profile) => {
    if (!profile) {
      return t("organizationsDetail.unknownMember", {}, { default: "Unknown" });
    }
    return (
      `${profile.firstName || ""} ${profile.lastName || ""}`.trim() ||
      profile.username ||
      t("organizationsDetail.unknownMember", {}, { default: "Unknown" })
    );
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

  const opensInNewTab = t("a11y.opensInNewTab", {}, {
    default: "(opens in new tab)",
  });

  return (
    <Shell>
      <BackLink type="button" onClick={() => router.back()}>
        <DecorativeIcon name="arrow left" />
        {t("organizationsDetail.back", {}, { default: "Back" })}
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

      {org.mission && (
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
      )}

      {org.members?.length > 0 && (
        <Card>
          <h2>
            {t("organizationsDetail.members", {}, { default: "Members" })}
          </h2>
          <p className="helper">
            {t("organizationsDetail.membersHelper", { name: org.name }, {
              default:
                "People at {{name}} who manage this organization on MindHive.",
            })}
          </p>
          <Members>
            {org.members.map((member) => {
              const avatar =
                member.image?.keystoneImage?.url ||
                member.image?.image?.publicUrlTransformed ||
                null;
              const name = displayName(member);
              const inner = (
                <div className="member">
                  <div className="avatar">
                    {avatar ? (
                      <img src={avatar} alt="" />
                    ) : (
                      <span className="placeholder" aria-hidden>
                        {name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="name">{name}</span>
                  {member.tagline && (
                    <span className="tag">{member.tagline}</span>
                  )}
                </div>
              );
              if (member.publicReadableId) {
                return (
                  <Link
                    key={member.id}
                    href={{
                      pathname: "/dashboard/connect/with",
                      query: { id: member.publicReadableId },
                    }}
                    passHref
                    legacyBehavior
                  >
                    <a
                      aria-label={t("profileCard.viewProfile", { name }, {
                        default: "View profile of {{name}}",
                      })}
                    >
                      {inner}
                    </a>
                  </Link>
                );
              }
              return <div key={member.id}>{inner}</div>;
            })}
          </Members>
        </Card>
      )}

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
              const from = formatDate(opp.availableFrom);
              const to = formatDate(opp.availableTo);
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
                            {t("organizationsDetail.teamOf", {
                              size: opp.teamSize,
                            }, {
                              default: "Team of {{size}}",
                            })}
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
