import { useRouter } from "next/router";
import styled from "styled-components";

import Chip from "../../../DesignSystem/Chip";
import DropdownSelect from "../../../DesignSystem/DropdownSelect";

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

const STATUS_CHIP_STYLE = {
  height: "32px",
  minHeight: "32px",
  padding: "6px 12px",
  borderRadius: "8px",
  fontFamily: "Inter, sans-serif",
  fontSize: "14px",
  fontWeight: 600,
  lineHeight: "20px",
  boxSizing: "border-box",
  textTransform: "capitalize",
};

const OPPORTUNITY_STATUS_CHIP_COLORS = {
  draft: {
    background: "#f0f4f6",
    border: "#c5cdd4",
    color: "#5f6871",
  },
  pending_review: {
    background: "#fdf6e8",
    border: "#e8d4a8",
    color: "#8a6d3b",
  },
  pre_selected: {
    background: "#e8f2f7",
    border: "#b8d4e3",
    color: "#336f8a",
  },
  accepted: {
    background: "#e3f4ec",
    border: "#b8dcc8",
    color: "#1d6b3a",
  },
  published: {
    background: "#e3f4ec",
    border: "#b8dcc8",
    color: "#1d6b3a",
  },
  closed: {
    background: "#f0f0f0",
    border: "#d3d3d3",
    color: "#5f6871",
  },
  archived: {
    background: "#ececec",
    border: "#c8c8c8",
    color: "#625b71",
  },
};

const DEFAULT_STATUS_CHIP_COLORS = {
  background: "#ffffff",
  border: "#a1a1a1",
  color: "#171717",
};

function getStatusChipColors(status) {
  return OPPORTUNITY_STATUS_CHIP_COLORS[status] || DEFAULT_STATUS_CHIP_COLORS;
}

const StatusPill = styled.span`
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  height: 32px;
  min-height: 32px;
  padding: 6px 12px;
  border-radius: 8px;
  box-sizing: border-box;
  font-family: "Inter", sans-serif;
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  text-transform: capitalize;
  background: ${({ $status }) => getStatusChipColors($status).background};
  border: 1px solid ${({ $status }) => getStatusChipColors($status).border};
  color: ${({ $status }) => getStatusChipColors($status).color};
`;

const StatusSelectWrap = styled.div`
  flex-shrink: 0;
  max-width: 100%;

  /* DropdownSelect hardcodes label color; inherit chip trigger color instead */
  button > span:first-child {
    color: inherit;
    font-weight: inherit;
    font-size: inherit;
    line-height: inherit;
    -webkit-line-clamp: 1;
    line-clamp: 1;
    white-space: nowrap;
  }

  button svg {
    color: inherit;
  }
`;

const STATUS_CHEVRON = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ flexShrink: 0, display: "block" }}
    aria-hidden
  >
    <path d="M7 10l5 5 5-5H7z" fill="currentColor" />
  </svg>
);

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

function getStatusTriggerStyle(status) {
  const colors = getStatusChipColors(status);
  return {
    ...STATUS_CHIP_STYLE,
    width: "auto",
    minWidth: 0,
    border: `1px solid ${colors.border}`,
    background: colors.background,
    color: colors.color,
    gap: "8px",
  };
}

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
  statusOptions,
  statusChangeLabel,
  statusUpdating,
  onStatusChange,
  metaLine,
  onEdit,
  onDelete,
  editLabel,
  deleteLabel,
  reviewHref,
  reviewLabel,
}) {
  const router = useRouter();
  const isStatusEditable =
    typeof onStatusChange === "function" &&
    Array.isArray(statusOptions) &&
    statusOptions.length > 0;

  return (
    <Card>
      <TitleRow>
        <Title>{title}</Title>
        {isStatusEditable ? (
          <StatusSelectWrap
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <DropdownSelect
              value={status}
              options={statusOptions}
              onChange={onStatusChange}
              fitContent
              icon={STATUS_CHEVRON}
              disabled={!!statusUpdating}
              ariaLabel={statusChangeLabel}
              triggerStyle={getStatusTriggerStyle(status)}
            />
          </StatusSelectWrap>
        ) : statusLabel ? (
          <StatusPill $status={status}>{statusLabel}</StatusPill>
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
