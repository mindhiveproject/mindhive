import { useQuery } from "@apollo/client";
import Link from "next/link";
import styled from "styled-components";
import { Icon } from "semantic-ui-react";

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
    font-size: 14px;
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
  background: #336f8a;
  color: #ffffff;
  font-family: "Nunito", sans-serif;
  font-weight: 600;
  font-size: 13px;
  text-decoration: none;
  cursor: pointer;

  &:hover {
    background: #244f63;
    color: #ffffff;
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

export default function SponsorOnboarding() {
  const { data, loading } = useQuery(SPONSOR_ONBOARDING_STATE, {
    fetchPolicy: "cache-and-network",
  });

  if (loading && !data) return null;

  const me = data?.authenticatedItem;
  const permissionNames = (me?.permissions || []).map((p) => p?.name);
  const isSponsor = permissionNames.includes("SPONSOR");
  if (!isSponsor) return null;

  // Step 1 — "completed" if the user has gone through the profile-type chooser
  // and saved either an organization name (Organization path) or first/last
  // name (Individual path).
  const orgPathComplete =
    me?.profileType === "organization" &&
    !!(me?.organization || "").trim();
  const individualPathComplete =
    me?.profileType === "individual" &&
    !!(me?.firstName || "").trim() &&
    !!(me?.lastName || "").trim();
  const profileStepDone = orgPathComplete || individualPathComplete;

  // Step 2 — at least one opportunity created.
  const oppStepDone = (me?.opportunitiesCreated || []).length > 0;

  // Hide the card once both steps are complete.
  if (profileStepDone && oppStepDone) return null;

  const profileStatus = profileStepDone ? "done" : "active";
  const oppStatus = profileStepDone
    ? oppStepDone
      ? "done"
      : "active"
    : "pending";

  return (
    <Card>
      <div>
        <h2>Welcome — let&apos;s get you set up</h2>
        <p className="subtitle">
          Two quick steps and you&apos;re ready to host opportunities for
          students through MindHive Connect.
        </p>
      </div>

      <Steps>
        <Step $status={profileStatus}>
          <span className="num">
            {profileStatus === "done" ? <Icon name="check" style={{ margin: 0 }} /> : "1"}
          </span>
          <div className="body">
            <span className="title">Complete your profile</span>
            <span className="description">
              Choose whether you represent an organization or an individual,
              then fill in your name, mission, primary domain, and time
              commitment. Students see this on every opportunity you publish.
            </span>
            {profileStatus === "active" ? (
              <div className="action">
                <Link
                  href={{
                    pathname: "/dashboard/profile/edit",
                    query: { page: "type" },
                  }}
                  passHref
                  legacyBehavior
                >
                  <CTAButton>
                    Open profile editor <Icon name="arrow right" style={{ margin: 0 }} />
                  </CTAButton>
                </Link>
              </div>
            ) : (
              <DoneBadge>
                <Icon name="check circle" /> Profile complete
              </DoneBadge>
            )}
          </div>
        </Step>

        <Step $status={oppStatus}>
          <span className="num">
            {oppStatus === "done" ? <Icon name="check" style={{ margin: 0 }} /> : "2"}
          </span>
          <div className="body">
            <span className="title">Create your first opportunity</span>
            <span className="description">
              Describe a project students can work on: title, video, time
              window, what they&apos;ll do, what they&apos;ll learn. Save it as
              a draft first if you&apos;re still putting it together — publish
              when it&apos;s ready.
            </span>
            {oppStatus === "active" ? (
              <div className="action">
                <Link
                  href={{
                    pathname: "/dashboard/connect/opportunities",
                    query: { op: "new" },
                  }}
                  passHref
                  legacyBehavior
                >
                  <CTAButton>
                    Create opportunity <Icon name="arrow right" style={{ margin: 0 }} />
                  </CTAButton>
                </Link>
              </div>
            ) : oppStatus === "done" ? (
              <DoneBadge>
                <Icon name="check circle" /> Opportunity created
              </DoneBadge>
            ) : (
              <span
                className="description"
                style={{ marginTop: 6, fontStyle: "italic" }}
              >
                Unlocks once your profile is complete.
              </span>
            )}
          </div>
        </Step>
      </Steps>
    </Card>
  );
}
