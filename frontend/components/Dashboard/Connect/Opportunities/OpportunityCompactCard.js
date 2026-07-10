import { useRouter } from "next/router";
import styled from "styled-components";

import Chip from "../../../DesignSystem/Chip";

export const OpportunityCompactGrid = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  font-family: "Inter", sans-serif;

  @media (max-width: 1023px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 759px) {
    grid-template-columns: 1fr;
  }
`;

export const OpportunityListSection = styled.section`
  display: grid;
  gap: 16px;
  padding: 24px;
  border: 1px solid #e6e6e6;
  border-radius: 18px;
  background: linear-gradient(180deg, #ffffff 0%, #fbfbfa 100%);
  box-shadow: 0 10px 30px rgba(23, 23, 23, 0.06);
`;

const Card = styled.article`
  display: grid;
  gap: 8px;
  padding: 16px 18px;
  border: 1px solid #ece9e6;
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 4px 14px rgba(23, 23, 23, 0.04);
  transition: border-color 0.15s ease, box-shadow 0.15s ease,
    transform 0.15s ease;

  &:hover {
    border-color: #c8d8df;
    box-shadow: 0 8px 22px rgba(23, 23, 23, 0.08);
    transform: translateY(-1px);
  }
`;

const TitleRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 8px;
`;

const Title = styled.h3`
  margin: 0;
  flex: 1 1 120px;
  font-family: "Inter", sans-serif;
  font-size: 16px;
  font-weight: 700;
  line-height: 22px;
  color: #171717;
`;

const StatusPill = styled.span`
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: 100px;
  background: ${({ $published }) => ($published ? "#e3f4ec" : "#f0f4f6")};
  color: ${({ $published }) => ($published ? "#1d6b3a" : "#5f6871")};
  font-size: 11px;
  font-weight: 600;
  line-height: 16px;
  text-transform: capitalize;
`;

const Meta = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 20px;
  color: #625b71;
`;

const Actions = styled.div.attrs({
  className: "OpportunityCompactCard__Actions",
})`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding-top: 4px;
`;

const DELETE_CHIP_STYLE = {
  color: "#b3261e",
  borderColor: "#e8c4c4",
};

function formatDate(value) {
  if (!value) return null;
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return null;
  }
}

export function buildMyOpportunityMetaLine(opportunity, t) {
  const parts = [];
  const from = formatDate(opportunity.availableFrom);
  const to = formatDate(opportunity.availableTo);

  if (from || to) {
    parts.push(
      t(
        "myOpportunitiesList.rowMeta.dates",
        { from: from || "—", to: to || "—" },
        { default: "{{from}} → {{to}}" },
      ),
    );
  }

  parts.push(
    t(
      "myOpportunitiesList.capacity",
      { count: opportunity.studentCapacity ?? 1 },
      { default: "Capacity {{count}}" },
    ),
  );

  const networkCount = opportunity.classNetworks?.length || 0;
  if (networkCount > 0) {
    parts.push(
      networkCount === 1
        ? t(
            "myOpportunitiesList.networkCount.one",
            { count: networkCount },
            { default: "{{count}} network" },
          )
        : t(
            "myOpportunitiesList.networkCount.many",
            { count: networkCount },
            { default: "{{count}} networks" },
          ),
    );
  }

  return parts.join(" · ");
}

export function buildReviewOpportunityMetaLine(opportunity, t) {
  const parts = [];
  const sponsor =
    [opportunity.mentor?.firstName, opportunity.mentor?.lastName]
      .filter(Boolean)
      .join(" ") ||
    opportunity.mentor?.username ||
    t("myOpportunitiesList.unknownSponsor", {}, { default: "Unknown" });

  parts.push(
    t(
      "myOpportunitiesList.rowMeta.sponsor",
      { name: sponsor },
      { default: "Sponsor: {{name}}" },
    ),
  );

  if (opportunity.organization?.name) {
    parts.push(opportunity.organization.name);
  }

  const submitted = formatDate(opportunity.updatedAt);
  if (submitted) {
    parts.push(
      t(
        "myOpportunitiesList.rowMeta.submitted",
        { date: submitted },
        { default: "Submitted {{date}}" },
      ),
    );
  }

  return parts.join(" · ");
}

export default function OpportunityCompactCard({
  title,
  status,
  statusLabel,
  metaLine,
  onEdit,
  onDelete,
  editLabel,
  deleteLabel,
  reviewHref,
  reviewLabel,
}) {
  const router = useRouter();
  const isPublished = status === "published";

  return (
    <Card>
      <TitleRow>
        <Title>{title}</Title>
        {statusLabel ? (
          <StatusPill $published={isPublished}>{statusLabel}</StatusPill>
        ) : null}
      </TitleRow>
      {metaLine ? <Meta>{metaLine}</Meta> : null}
      {(onEdit || onDelete || reviewHref) && (
        <Actions>
          {onEdit ? (
            <Chip label={editLabel} onClick={onEdit} ariaLabel={editLabel} shape="square" />
          ) : null}
          {reviewHref ? (
            <Chip
              label={reviewLabel}
              onClick={() => router.push(reviewHref)}
              shape="square"
              ariaLabel={reviewLabel}
            />
          ) : null}
          {onDelete ? (
            <Chip
              label={deleteLabel}
              onClick={onDelete}
              shape="square"
              ariaLabel={deleteLabel}
              style={DELETE_CHIP_STYLE}
            />
          ) : null}
        </Actions>
      )}
    </Card>
  );
}
