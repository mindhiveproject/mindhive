import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";

import Button from "../../DesignSystem/Button";
import Chip from "../../DesignSystem/Chip";
import { getProjectCategoryDisplay } from "../../../lib/opportunityCategory";
import {
  displayProfileName,
  getOpportunityMentors,
  getPrimarySponsor,
} from "../../../lib/opportunityPeople";
import ConnectCard from "./ConnectCard";
import ManageFavoriteOpportunity from "./ManageFavoriteOpportunity";

const ChipLeading = styled.img`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
  display: block;
  flex-shrink: 0;
`;

/**
 * Connect-style opportunity card for the student class Opportunities tab.
 * Opens a preview via onOpen rather than navigating to a Connect URL.
 */
export default function OpportunityConnectCard({
  opportunity,
  onOpen,
  user = null,
  roundId = null,
  hasDraftRanking = false,
  favoriteRefetchQueries = [],
}) {
  const { t } = useTranslation("connect");

  if (!opportunity?.id) {
    return null;
  }

  const title = opportunity.title || "";
  const orgName = opportunity.organization?.name?.trim() || null;
  const orgLogoUrl = opportunity.organization?.logo?.url || null;
  const sponsorName = displayProfileName(getPrimarySponsor(opportunity));
  const mentorNames = getOpportunityMentors(opportunity)
    .map((profile) => displayProfileName(profile))
    .filter(Boolean);
  const mentorLabel = mentorNames.length
    ? mentorNames.join(", ")
    : t("opportunityCard.mentorTbd", {}, { default: "Mentor TBD" });
  const subtitle = [
    sponsorName
      ? t("opportunityCard.sponsorLine", { name: sponsorName }, {
          default: "Sponsor: {{name}}",
        })
      : null,
    t("opportunityCard.mentorLine", { name: mentorLabel }, {
      default: "Mentor: {{name}}",
    }),
  ]
    .filter(Boolean)
    .join(" · ");
  const description = opportunity.shortDescription?.trim() || null;
  const categoryLabel = getProjectCategoryDisplay(
    opportunity.projectCategory,
    opportunity.projectCategoryOther,
    t,
  );

  const opportunityTypeLabel = t(
    "opportunityCard.opportunityButton",
    {},
    { default: "Opportunity" },
  );

  const viewOpportunityLabel = t(
    "opportunityCard.viewOpportunity",
    { title },
    { default: "View opportunity: {{title}}" },
  );

  const handleOpen = () => {
    if (typeof onOpen === "function") {
      onOpen(opportunity.id);
    }
  };

  const chips = [];
  if (orgName) {
    chips.push(
      <Chip
        key="organization"
        variant="static"
        tone="neutral"
        avatar
        label={orgName}
        leading={
          <ChipLeading
            src={orgLogoUrl || "/assets/connect/building.svg"}
            alt=""
          />
        }
      />,
    );
  }
  if (categoryLabel) {
    chips.push(
      <Chip
        key="projectCategory"
        variant="static"
        tone="neutral"
        label={categoryLabel}
      />,
    );
  }

  return (
    <ConnectCard
      typeLabel={opportunityTypeLabel}
      avatar={{
        src: orgLogoUrl,
        fallbackLabel: (orgName || title || "?").charAt(0).toUpperCase(),
      }}
      title={title}
      subtitle={subtitle}
      chips={chips.length > 0 ? chips : null}
      description={description}
      actions={
        <>
          <ManageFavoriteOpportunity
            user={user}
            opportunityId={opportunity.id}
            roundId={roundId}
            hasDraftRanking={hasDraftRanking}
            refetchQueries={favoriteRefetchQueries}
          />
          <Button
            variant="filled"
            aria-label={viewOpportunityLabel}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleOpen();
            }}
          >
            {opportunityTypeLabel}
          </Button>
        </>
      }
    />
  );
}
