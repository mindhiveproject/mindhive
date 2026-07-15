import { useQuery } from "@apollo/client";
import Link from "next/link";
import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";

import { SPONSOR_ONBOARDING_STATE } from "../../Queries/User";

const Card = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  margin-bottom: 24px;
  border-radius: 16px;
  background: linear-gradient(135deg, #f7f9f8 0%, #eef5f9 100%);
  border: 1px solid #d3dae0;

  h2 {
    margin: 0;
    font-family: "Lato", sans-serif;
    font-size: 22px;
    font-weight: 600;
    color: #171717;
  }

  .subtitle {
    margin: 0;
    color: #5f6871;
    font-size: 14px;
    line-height: 1.5;
    max-width: 720px;
  }
`;

const Steps = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const StepGroup = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 12px;
`;

const Step = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px;
  border-radius: 12px;
  background: #ffffff;
  border: 1px solid
    ${({ $status }) =>
      $status === "active"
        ? "#336f8a"
        : $status === "done"
        ? "#b6dec7"
        : "#d3dae0"};
  opacity: ${({ $status }) => ($status === "pending" ? 0.6 : 1)};

  .num {
    flex: none;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: ${({ $compactNumber }) => ($compactNumber ? "12px" : "14px")};
    background: ${({ $status }) =>
      $status === "done"
        ? "#1d6b3a"
        : $status === "active"
        ? "#336f8a"
        : "#d3dae0"};
    color: ${({ $status }) =>
      $status === "pending" ? "#5f6871" : "#ffffff"};
  }

  .body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .title {
    font-weight: 600;
    color: #171717;
    font-size: 15px;
  }

  .description {
    color: #5f6871;
    font-size: 13px;
    line-height: 1.45;
  }

  .action {
    margin-top: 8px;
  }
`;

const CTAButton = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border-radius: 100px;
  border: 1px solid
    ${({ $variant }) => ($variant === "done" ? "#1d6b3a" : "#336f8a")};
  background: ${({ $variant }) =>
    $variant === "done" ? "#ffffff" : "#336f8a"};
  color: ${({ $variant }) => ($variant === "done" ? "#1d6b3a" : "#ffffff")};
  font-family: "Nunito", sans-serif;
  font-weight: 600;
  font-size: 13px;
  text-decoration: none;
  cursor: pointer;

  &:hover {
    background: ${({ $variant }) =>
      $variant === "done" ? "#edf8f1" : "#244f63"};
    color: ${({ $variant }) => ($variant === "done" ? "#1d6b3a" : "#ffffff")};
  }
`;

const DoneBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #1d6b3a;
  font-weight: 600;
  margin-top: 4px;
`;

function getFirstUniqueOrganization(...groups) {
  const seen = new Set();
  for (const group of groups) {
    for (const org of group || []) {
      if (!org?.id || seen.has(org.id)) continue;
      seen.add(org.id);
      return org;
    }
  }
  return null;
}

function StepAction({ href, children, variant = "active" }) {
  return (
    <div className="action">
      <Link href={href} passHref legacyBehavior>
        <CTAButton $variant={variant}>{children}</CTAButton>
      </Link>
    </div>
  );
}

export default function SponsorOnboarding() {
  const { t } = useTranslation("home");
  const { data, loading } = useQuery(SPONSOR_ONBOARDING_STATE, {
    fetchPolicy: "cache-and-network",
  });

  if (loading && !data) return null;

  const me = data?.authenticatedItem;
  const permissionNames = (me?.permissions || []).map((p) => p?.name);
  const isSponsor = permissionNames.includes("SPONSOR");
  if (!isSponsor) return null;

  // Step 1 — "completed" if the user has gone through the profile-type chooser
  // and either created an Organization (Organization path) or filled in
  // first + last name (Individual path).
  const orgRecord = getFirstUniqueOrganization(
    me?.organizations,
    me?.adminOfOrganizations,
    me?.organizationsCreated,
  );
  const adminOrganization = getFirstUniqueOrganization(
    me?.adminOfOrganizations,
    me?.organizationsCreated,
  );
  const orgPathComplete =
    me?.profileType === "organization" &&
    !!(orgRecord?.name || me?.organization || "").trim();
  const individualPathComplete =
    me?.profileType === "individual" &&
    !!(me?.firstName || "").trim() &&
    !!(me?.lastName || "").trim();
  const profileStepDone = orgPathComplete || individualPathComplete;

  // Step 2 — at least one opportunity created.
  const oppStepDone = (me?.opportunitiesCreated || []).length > 0;

  const profileStatus = profileStepDone ? "done" : "active";
  const oppStatus = profileStepDone
    ? oppStepDone
      ? "done"
      : "active"
    : "pending";
  const profileEditHref = profileStepDone
    ? {
        pathname: "/dashboard/profile/edit",
        query: {
          page: "about",
          ...(me?.profileType ? { type: me.profileType } : {}),
        },
      }
    : {
        pathname: "/dashboard/profile/edit",
        query: { page: "type" },
      };

  return (
    <Card>
      <div>
        <h2>
          {t("sponsorOnboarding.title", {}, { default: "Let's get you set up" })}
        </h2>
        <p className="subtitle">
          {t("sponsorOnboarding.subtitle", {}, {
            default:
              "Two quick steps and you're ready to host opportunities for students through MindHive Connect.",
          })}
        </p>
      </div>

      <Steps>
        <StepGroup>
          <Step $status={profileStatus}>
            <span className="num">1</span>
            <div className="body">
              <span className="title">
                {profileStepDone
                  ? t("sponsorOnboarding.profile.editTitle", {}, {
                      default: "Edit your profile",
                    })
                  : t("sponsorOnboarding.profile.completeTitle", {}, {
                      default: "Complete your profile",
                    })}
              </span>
              <span className="description">
                {t("sponsorOnboarding.profile.description", {}, {
                  default:
                    "Choose whether you represent an organization or an individual, then fill in your name, mission, primary domain, and time commitment. Students see this on every opportunity you publish.",
                })}
              </span>
              {profileStepDone && (
                <DoneBadge>
                  {t("sponsorOnboarding.profile.done", {}, {
                    default: "Profile complete",
                  })}
                </DoneBadge>
              )}
              <StepAction
                href={profileEditHref}
                variant={profileStepDone ? "done" : "active"}
              >
                {profileStepDone
                  ? t("sponsorOnboarding.profile.editButton", {}, {
                      default: "Edit profile",
                    })
                  : t("sponsorOnboarding.profile.openButton", {}, {
                      default: "Open profile editor",
                    })}
                {" ->"}
              </StepAction>
            </div>
          </Step>
          {/* {adminOrganization && (
            <Step $status="done" $compactNumber>
              <span className="num">
                {t("sponsorOnboarding.organization.stepLabel", {}, {
                  default: "Org",
                })}
              </span>
              <div className="body">
                <span className="title">
                  {t("sponsorOnboarding.organization.title", {}, {
                    default: "Edit your organization",
                  })}
                </span>
                <span className="description">
                  {t(
                    "sponsorOnboarding.organization.description",
                    { name: adminOrganization.name },
                    {
                      default:
                        "Manage {{name}}'s mission, primary domain, logo, and team details.",
                    },
                  )}
                </span>
                <DoneBadge>
                  {t("sponsorOnboarding.organization.done", {}, {
                    default: "Organization admin",
                  })}
                </DoneBadge>
                <StepAction
                  href={{
                    pathname: "/dashboard/profile/edit",
                    query: { page: "about", type: "organization" },
                  }}
                  variant="done"
                >
                  {t("sponsorOnboarding.organization.editButton", {}, {
                    default: "Edit organization",
                  })}
                  {" ->"}
                </StepAction>
              </div>
            </Step>
          )} */}
        </StepGroup>

        <Step $status={oppStatus}>
          <span className="num">
            2
          </span>
          <div className="body">
            <span className="title">
              {oppStepDone
                ? t("sponsorOnboarding.opportunity.viewTitle", {}, {
                    default: "View your opportunities",
                  })
                : t("sponsorOnboarding.opportunity.createTitle", {}, {
                    default: "Create your first opportunity",
                  })}
            </span>
            <span className="description">
              {t("sponsorOnboarding.opportunity.description", {}, {
                default:
                  "Describe a project students can work on: title, video, time window, what they'll do, what they'll learn. Save it as a draft first if you're still putting it together, and publish when it's ready.",
              })}
            </span>
            {oppStatus === "active" ? (
              <StepAction
                href={{
                  pathname: "/dashboard/connect/opportunities",
                  query: { op: "new" },
                }}
              >
                {t("sponsorOnboarding.opportunity.createButton", {}, {
                  default: "Create opportunity",
                })}
                {" ->"}
              </StepAction>
            ) : oppStatus === "done" ? (
              <>
                <DoneBadge>
                  {t("sponsorOnboarding.opportunity.done", {}, {
                    default: "Opportunity created",
                  })}
                </DoneBadge>
                <StepAction
                  href="/dashboard/connect/opportunities"
                  variant="done"
                >
                  {t("sponsorOnboarding.opportunity.viewButton", {}, {
                    default: "View my opportunities",
                  })}
                  {" ->"}
                </StepAction>
              </>
            ) : (
              <span
                className="description"
                style={{ marginTop: 6, fontStyle: "italic" }}
              >
                {t("sponsorOnboarding.opportunity.locked", {}, {
                  default: "Unlocks once your profile is complete.",
                })}
              </span>
            )}
          </div>
        </Step>
      </Steps>
    </Card>
  );
}
