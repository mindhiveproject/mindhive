import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import Link from "next/link";
import { useRouter } from "next/router";
import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";

import { MY_OPPORTUNITIES } from "../../../Queries/Opportunity";
import { DELETE_OPPORTUNITY, UPDATE_OPPORTUNITY } from "../../../Mutations/Opportunity";
import Button from "../../../DesignSystem/Button";
import DropdownSelect from "../../../DesignSystem/DropdownSelect";
import FilterBar from "../FilterBar";
import { deriveRoles } from "../useConnectRole";
import OpportunityCompactCard, {
  buildMyOpportunityMetaLine,
  OpportunityCompactGrid,
} from "./OpportunityCompactCard";

const Shell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding: 32px clamp(16px, 6vw, 64px);
  padding-top: 0px;
  background-color: #f7f9f8;
  min-height: 100vh;
  border-radius: 32px 0 0 32px;
`;

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;

  h1 {
    margin: 0;
    font-family: "Lato", sans-serif;
    font-size: clamp(28px, 4vw, 40px);
    font-weight: 600;
    color: #171717;
  }
`;

const Empty = styled.div`
  padding: 48px 24px;
  text-align: center;
  background: #ffffff;
  border-radius: 16px;
  color: #5f6871;
  font-family: "Inter", sans-serif;
`;

const STATUS_KEYS = {
  draft: "draft",
  pending_review: "pendingReview",
  returned: "returned",
  pre_selected: "preSelected",
  accepted: "accepted",
  published: "published",
  closed: "closed",
  archived: "archived",
};

const STATUS_DEFAULTS = {
  draft: "Draft",
  pending_review: "Submitted",
  returned: "Returned",
  pre_selected: "Pre-selected",
  accepted: "Accepted",
  published: "Published",
  closed: "Closed",
  archived: "Archived",
};

const SPONSOR_STATUS_VALUES = ["draft", "pending_review"];

const SPONSOR_LOCKED_STATUSES = new Set([
  "pre_selected",
  "accepted",
  "published",
  "closed",
  "archived",
]);

const ADMIN_STATUS_VALUES = Object.keys(STATUS_KEYS);

const TabRow = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;

  a {
    padding: 8px 16px;
    border-radius: 100px;
    border: 1px solid #d3dae0;
    background: #ffffff;
    color: #336f8a;
    font-family: "Inter", sans-serif;
    font-weight: 600;
    font-size: 14px;
    text-decoration: none;

    &.active {
      background: #336f8a;
      color: #ffffff;
      border-color: #336f8a;
    }

    &:focus-visible {
      outline: 2px solid #336f8a;
      outline-offset: 2px;
    }
  }
`;

const FilterSelect = styled.div`
  flex: 0 0 180px;

  &.network {
    flex-basis: 220px;
  }
`;

const FILTER_TRIGGER_STYLE = {
  height: "42px",
  minHeight: "42px",
  border: "1px solid #d3dae0",
  borderRadius: "12px",
  background: "#ffffff",
  color: "#171717",
  padding: "0 14px 0 18px",
};

function getSponsorCardStatusValues(status) {
  if (status === "returned") {
    return ["returned", "pending_review"];
  }
  return SPONSOR_STATUS_VALUES;
}

function buildCardStatusOptions(values, t, { currentStatus, isAdmin } = {}) {
  return values.map((value) => {
    if (!isAdmin && currentStatus === "returned" && value === "pending_review") {
      return {
        value,
        label: t("myOpportunitiesList.status.resubmit", {}, {
          default: "Resubmit",
        }),
      };
    }

    const key = STATUS_KEYS[value];
    return {
      value,
      label: t(`myOpportunitiesList.status.${key}`, {}, {
        default: STATUS_DEFAULTS[value],
      }),
    };
  });
}

function isStatusEditable(opportunity, isAdmin) {
  if (isAdmin) return true;
  return !SPONSOR_LOCKED_STATUSES.has(opportunity.status);
}

export default function OpportunitiesList({ user }) {
  const router = useRouter();
  const { t } = useTranslation("connect");
  const { isTeacher, isAdmin, isClassNetworkAdmin } = deriveRoles(user);
  const showReviewTab = isTeacher || isAdmin || isClassNetworkAdmin;
  const { data, loading, refetch } = useQuery(MY_OPPORTUNITIES, {
    fetchPolicy: "cache-and-network",
  });
  const [deleteOpportunity] = useMutation(DELETE_OPPORTUNITY);
  const [updateOpportunity, { loading: statusUpdating }] = useMutation(
    UPDATE_OPPORTUNITY,
  );
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  const opportunities = data?.authenticatedItem?.opportunitiesCreated || [];

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [networkFilter, setNetworkFilter] = useState("");

  const statusLabel = (status) => {
    const key = STATUS_KEYS[status];
    if (!key) return status;
    return t(`myOpportunitiesList.status.${key}`, {}, {
      default: STATUS_DEFAULTS[status] || status,
    });
  };

  const cardStatusOptions = useMemo(
    () => buildCardStatusOptions(ADMIN_STATUS_VALUES, t, { isAdmin: true }),
    [t],
  );

  const getCardStatusOptions = (opportunity) => {
    if (isAdmin) return cardStatusOptions;
    return buildCardStatusOptions(
      getSponsorCardStatusValues(opportunity.status),
      t,
      { currentStatus: opportunity.status, isAdmin: false },
    );
  };

  const networkOptions = useMemo(() => {
    const seen = new Map();
    opportunities.forEach((o) => {
      (o.classNetworks || []).forEach((n) => {
        if (n?.id && !seen.has(n.id)) seen.set(n.id, n);
      });
    });
    return Array.from(seen.values()).map((n) => ({
      value: n.id,
      label: n.title,
    }));
  }, [opportunities]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return opportunities.filter((o) => {
      if (q && !(o.title || "").toLowerCase().includes(q)) return false;
      if (statusFilter && o.status !== statusFilter) return false;
      if (
        networkFilter &&
        !(o.classNetworks || []).some((n) => n.id === networkFilter)
      ) {
        return false;
      }
      return true;
    });
  }, [opportunities, search, statusFilter, networkFilter]);

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        t("myOpportunitiesList.deleteConfirm", {}, {
          default: "Delete this opportunity? This cannot be undone.",
        })
      )
    ) {
      return;
    }
    await deleteOpportunity({ variables: { id } });
    refetch();
  };

  const handleEdit = (id) => {
    router.push({
      pathname: "/dashboard/connect/opportunities",
      query: { op: id },
    });
  };

  const handleStatusChange = async (opportunity, nextStatus) => {
    if (!nextStatus || nextStatus === opportunity.status) return;

    if (nextStatus !== "draft" && !opportunity.guidelinesAcknowledged) {
      alert(
        t("opportunityEditor.validation.guidelines", {}, {
          default:
            "Please tick the guidelines acknowledgment in the Publishing card before changing the status away from Draft.",
        }),
      );
      return;
    }

    // List view cannot validate full proposal fields — send sponsors to the editor.
    if (!isAdmin && nextStatus === "pending_review") {
      alert(
        t("myOpportunitiesList.statusChangeUseEditor", {}, {
          default:
            "Complete required fields in the editor before submitting for review.",
        }),
      );
      handleEdit(opportunity.id);
      return;
    }

    setUpdatingStatusId(opportunity.id);
    try {
      await updateOpportunity({
        variables: {
          id: opportunity.id,
          input: { status: nextStatus },
        },
      });
      await refetch();
    } finally {
      setUpdatingStatusId(null);
    }
  };

  return (
    <Shell>
      <TopBar>
        <h1>
          {t("myOpportunitiesList.pageTitle", {}, {
            default: "My Opportunities",
          })}
        </h1>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          {showReviewTab && (
            <TabRow role="tablist" aria-label={t("opportunityEditor.listTabs.mine", {}, { default: "My opportunities" })}>
              <Link
                href="/dashboard/connect/opportunities"
                className="active"
                role="tab"
                aria-current="page"
              >
                {t("opportunityEditor.listTabs.mine", {}, {
                  default: "My opportunities",
                })}
              </Link>
              <Link
                href="/dashboard/connect/opportunities?tab=review"
                role="tab"
              >
                {t("opportunityEditor.listTabs.review", {}, {
                  default: "Review queue",
                })}
              </Link>
            </TabRow>
          )}
          <Button
            variant="primary"
            onClick={() =>
              router.push({
                pathname: "/dashboard/connect/opportunities",
                query: { op: "new" },
              })
            }
          >
            {t("myOpportunitiesList.newButton", {}, {
              default: "New opportunity",
            })}
          </Button>
        </div>
      </TopBar>

      {opportunities.length > 0 && (
        <FilterBar>
          <input
            className="search"
            type="search"
            placeholder={t("myOpportunitiesList.searchPlaceholder", {}, {
              default: "Search by title…",
            })}
            aria-label={t("myOpportunitiesList.searchLabel", {}, {
              default: "Search opportunities by title",
            })}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <FilterSelect>
            <DropdownSelect
              value={statusFilter}
              onChange={(value) => setStatusFilter(value)}
              placeholder={t("myOpportunitiesList.statusFilterPlaceholder", {}, {
                default: "All statuses",
              })}
              ariaLabel={t("myOpportunitiesList.statusFilterLabel", {}, {
                default: "Filter by status",
              })}
              triggerStyle={FILTER_TRIGGER_STYLE}
              options={[
                {
                  value: "",
                  label: t("myOpportunitiesList.statusFilterPlaceholder", {}, {
                    default: "All statuses",
                  }),
                },
                ...Object.entries(STATUS_KEYS).map(([value, key]) => ({
                  value,
                  label: t(`myOpportunitiesList.status.${key}`, {}, {
                    default: STATUS_DEFAULTS[value],
                  }),
                })),
              ]}
            />
          </FilterSelect>
          {networkOptions.length > 0 && (
            <FilterSelect className="network">
              <DropdownSelect
                value={networkFilter}
                onChange={(value) => setNetworkFilter(value)}
                searchableSingle
                placeholder={t("myOpportunitiesList.networkFilterPlaceholder", {}, {
                  default: "All networks",
                })}
                ariaLabel={t("myOpportunitiesList.networkFilterLabel", {}, {
                  default: "Filter by network",
                })}
                triggerStyle={FILTER_TRIGGER_STYLE}
                options={[
                  {
                    value: "",
                    label: t("myOpportunitiesList.networkFilterPlaceholder", {}, {
                      default: "All networks",
                    }),
                  },
                  ...networkOptions,
                ]}
              />
            </FilterSelect>
          )}
        </FilterBar>
      )}

      {loading && opportunities.length === 0 && (
        <Empty>
          {t("myOpportunitiesList.loading", {}, { default: "Loading…" })}
        </Empty>
      )}

      {!loading && opportunities.length === 0 && (
        <Empty>
          {t("myOpportunitiesList.empty", {}, {
            default:
              "You haven't created any opportunities yet. Click New opportunity to publish your first project for students.",
          })}
        </Empty>
      )}

      {!loading && opportunities.length > 0 && filtered.length === 0 && (
        <Empty>
          {t("myOpportunitiesList.emptyFiltered", {}, {
            default: "No opportunities match the current filters.",
          })}
        </Empty>
      )}

      {filtered.length > 0 && (
        <OpportunityCompactGrid>
          {filtered.map((opportunity) => {
            const editable = isStatusEditable(opportunity, isAdmin);
            const hasReviewNotes = (opportunity.reviewNotes?.length ?? 0) > 0;
            const showReviewCommentsCta = hasReviewNotes && !isAdmin;
            return (
              <OpportunityCompactCard
                key={opportunity.id}
                title={opportunity.title}
                status={opportunity.status}
                statusLabel={statusLabel(opportunity.status)}
                statusOptions={editable ? getCardStatusOptions(opportunity) : undefined}
                statusChangeLabel={t("myOpportunitiesList.statusChangeLabel", {}, {
                  default: "Change opportunity status",
                })}
                statusUpdating={
                  statusUpdating && updatingStatusId === opportunity.id
                }
                onStatusChange={
                  editable
                    ? (nextStatus) => handleStatusChange(opportunity, nextStatus)
                    : undefined
                }
                metaLine={buildMyOpportunityMetaLine(opportunity, t)}
                reviewNoteHint={
                  showReviewCommentsCta
                    ? t("myOpportunitiesList.reviewCommentsWaiting", {}, {
                        default: "Teacher review comments are waiting for you.",
                      })
                    : undefined
                }
                editHighlight={showReviewCommentsCta}
                editLabel={
                  showReviewCommentsCta
                    ? t("myOpportunitiesList.reviewCommentsEdit", {}, {
                        default: "Review comments & Resubmit",
                      })
                    : t("myOpportunitiesList.edit", {}, {
                        default: "Edit",
                      })
                }
                deleteLabel={t("myOpportunitiesList.delete", {}, {
                  default: "Delete",
                })}
                onEdit={() => handleEdit(opportunity.id)}
                onDelete={() => handleDelete(opportunity.id)}
              />
            );
          })}
        </OpportunityCompactGrid>
      )}
    </Shell>
  );
}
