import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";

import Button from "../../DesignSystem/Button";
import Chip from "../../DesignSystem/Chip";
import { ArrowOutwardIcon } from "../../DesignSystem/Icons";
import { getProjectCategoryDisplay } from "../../../lib/opportunityCategory";
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

function mentorDisplayName(mentor) {
  if (!mentor) return null;
  const full = [mentor.firstName, mentor.lastName].filter(Boolean).join(" ");
  return full || mentor.username || null;
}

/**
 * Connect-style opportunity card for the student class Opportunities tab.
 * Opens a preview via onOpen rather than navigating to a Connect URL.
 */
export default function OpportunityConnectCard({
  opportunity,
  onOpen,
  user = null,
}) {
  const { t } = useTranslation("connect");

  if (!opportunity?.id) {
    return null;
  }

  const title = opportunity.title || "";
  const orgName = opportunity.organization?.name?.trim() || null;
  const orgLogoUrl = opportunity.organization?.logo?.url || null;
  const sponsor = mentorDisplayName(opportunity.mentor);
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
        label={orgName}
        title={orgName}
        style={{ maxWidth: "100%", height: "auto", minHeight: 32 }}
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
        label={categoryLabel}
        title={categoryLabel}
        style={{ maxWidth: "100%", height: "auto", minHeight: 32 }}
      />,
    );
  }

  return (
    <ConnectCard
      typeLabel={opportunityTypeLabel}
      onActivate={handleOpen}
      ariaLabel={viewOpportunityLabel}
      avatar={{
        src: orgLogoUrl,
        fallbackLabel: (orgName || title || "?").charAt(0).toUpperCase(),
      }}
      title={title}
      subtitle={sponsor}
      chips={chips.length > 0 ? chips : null}
      description={description}
      actions={
        <>
          <ManageFavoriteOpportunity
            user={user}
            opportunityId={opportunity.id}
          />
          <Button
            variant="outline"
            leadingIcon={<ArrowOutwardIcon />}
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
