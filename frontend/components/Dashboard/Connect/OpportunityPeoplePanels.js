import styled from "styled-components";

import ConnectProfileCard from "./ConnectProfileCard";
import OrganizationConnectCard from "./Organizations/OrganizationConnectCard";
import ReviewField from "../../Forms/DefinitionForm/ReviewField";
import {
  getOpportunityMentors,
  getOpportunitySponsors,
  isMentorTbd,
} from "../../../lib/opportunityPeople";

const PeopleColumns = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  align-items: start;

  @media (max-width: 900px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const PeoplePanel = styled.section`
  display: grid;
  justify-items: center;
  gap: 12px;
  min-width: 0;
  padding: 16px;
  border-radius: 12px;
  background: var(--MH-Theme-Primary-Lighter, #f4f8f7);
  box-sizing: border-box;

  h4 {
    margin: 0;
    font: var(--MH-Type-Title-Base);
    letter-spacing: 0;
    color: var(--MH-Theme-Neutrals-Black, #171717);
    text-align: center;
  }

  > *:not(h4) {
    width: 100%;
    min-width: 0;
  }
`;

const MentorTbdMessage = styled.p`
  margin: 0;
  width: 100%;
  padding: 16px;
  border-radius: 10px;
  text-align: center;
  font: var(--MH-Type-Body-Base);
  letter-spacing: 0;
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  background: var(--MH-Theme-Neutrals-Lighter, #f3f3f3);
  border: 1px dashed var(--MH-Theme-Neutrals-Medium, #a1a1a1);
  box-sizing: border-box;
`;

const OrganizationWrap = styled.div`
  display: grid;
  gap: 16px;
`;

/**
 * Sponsor / mentor / organization panels for opportunity previews.
 * `t` should use the classes namespace (opportunities.preview.* keys).
 */
export default function OpportunityPeoplePanels({
  opportunity,
  user,
  t,
  mentorNotesLabelKey = "opportunities.preview.mentorNotes",
}) {
  if (!opportunity) return null;

  const sponsors = getOpportunitySponsors(opportunity);
  const mentors = getOpportunityMentors(opportunity);
  const mentorPending = isMentorTbd(opportunity);
  const hasOrganization = !!opportunity.organization;
  const hasPeople =
    sponsors.length > 0 || mentors.length > 0 || mentorPending || hasOrganization;

  if (!hasPeople) {
    return (
      <p style={{ margin: 0, font: "var(--MH-Type-Body-Base)", color: "#6a6a6a" }}>
        {t("opportunities.preview.peopleEmpty", {}, {
          default: "No organization or people details are available yet.",
        })}
      </p>
    );
  }

  return (
    <OrganizationWrap>
      <PeopleColumns>
        <PeoplePanel>
          <h4>
            {t(
              sponsors.length === 1
                ? "opportunities.preview.sponsor"
                : "opportunities.preview.sponsors",
              {},
              {
                default:
                  sponsors.length === 1 ? "Sponsor" : "Sponsors",
              },
            )}
          </h4>
          {sponsors.length > 0 ? (
            sponsors.map((profile) => (
              <ConnectProfileCard
                key={profile.id}
                user={user}
                profile={profile}
              />
            ))
          ) : (
            <MentorTbdMessage>
              {t("opportunities.preview.sponsorPending", {}, {
                default: "Sponsor details pending",
              })}
            </MentorTbdMessage>
          )}
        </PeoplePanel>

        <PeoplePanel>
          <h4>
            {t(
              mentors.length === 1
                ? "opportunities.preview.mentor"
                : "opportunities.preview.mentors",
              {},
              {
                default: mentors.length === 1 ? "Mentor" : "Mentors",
              },
            )}
          </h4>
          {mentors.length > 0 ? (
            mentors.map((profile) => (
              <ConnectProfileCard
                key={profile.id}
                user={user}
                profile={profile}
              />
            ))
          ) : (
            <>
              <MentorTbdMessage>
                {t("opportunities.preview.mentorTbd", {}, {
                  default: "Mentor to be assigned",
                })}
              </MentorTbdMessage>
              {opportunity.mentorNotes ? (
                <ReviewField
                  label={t(mentorNotesLabelKey, {}, { default: "Mentor notes" })}
                  value={opportunity.mentorNotes}
                />
              ) : null}
            </>
          )}
        </PeoplePanel>
      </PeopleColumns>

      {hasOrganization ? (
        <PeoplePanel>
          <h4>
            {t("opportunities.preview.organization", {}, {
              default: "Organization",
            })}
          </h4>
          <OrganizationConnectCard org={opportunity.organization} />
          {opportunity.organization.mission ||
          opportunity.organization.department ||
          opportunity.organization.website ? (
            <div
              style={{
                display: "grid",
                gap: 12,
                width: "100%",
                minWidth: 0,
              }}
            >
              {opportunity.organization.mission ? (
                <ReviewField
                  label={t(
                    "opportunities.studentView.preview.orgMission",
                    {},
                    { default: "Mission" },
                  )}
                  value={opportunity.organization.mission}
                />
              ) : null}
              {opportunity.organization.department ? (
                <ReviewField
                  label={t(
                    "opportunities.studentView.preview.orgDepartment",
                    {},
                    { default: "Department" },
                  )}
                  value={opportunity.organization.department}
                />
              ) : null}
              {opportunity.organization.website ? (
                <ReviewField
                  label={t(
                    "opportunities.studentView.preview.orgWebsite",
                    {},
                    { default: "Website" },
                  )}
                  value={opportunity.organization.website}
                />
              ) : null}
            </div>
          ) : null}
        </PeoplePanel>
      ) : null}
    </OrganizationWrap>
  );
}

export { PeopleColumns, PeoplePanel };
