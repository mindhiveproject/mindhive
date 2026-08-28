import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";

import Button from "../../DesignSystem/Button";
import { getProjectCategoryDisplay } from "../../../lib/opportunityCategory";
import ConnectCard from "./ConnectCard";
import ManageFavoriteOpportunity from "./ManageFavoriteOpportunity";
import TruncatingChip from "./TruncatingChip";

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
      <TruncatingChip
        key="organization"
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
      <TruncatingChip
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
