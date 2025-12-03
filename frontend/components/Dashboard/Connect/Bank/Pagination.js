import { useQuery } from "@apollo/client";
import { StyledPagination } from "../../../styles/StyledPagination";

import { PAGINATION_CONNECT_USERS_QUERY } from "../../../Queries/User";

import { Dropdown } from "semantic-ui-react";
import useTranslation from "next-translate/useTranslation";

export default function PaginationUsers({
  page,
  setPage,
  perPage,
  search,
  goToPage,
  totalCount,
}) {
  const { t } = useTranslation("common");
  
  // Use provided totalCount if available, otherwise query for it
  const { data, loading, error } = useQuery(PAGINATION_CONNECT_USERS_QUERY, {
    variables: {
      search: search,
    },
    skip: totalCount !== undefined, // Skip query if totalCount is provided
  });
  
  const countUsers = totalCount !== undefined ? totalCount : (data?.profilesCount || 0);
  const pageCount = Math.ceil(countUsers / perPage);

  return (
    <StyledPagination>
      <button disabled={page <= 1} onClick={() => goToPage(parseInt(page) - 1)}>
        <a aria-disabled={page <= 1} className="prev">
          <p>{t("pagination.prev")}</p>
        </a>
      </button>
      <div className="pageDropdown">
        <span>{t("pagination.page")}</span>
        <Dropdown
          selection
          fluid
          options={[...Array(pageCount).keys()].map((n) => ({
            key: n + 1,
            text: n + 1,
            value: n + 1,
          }))}
          value={page}
          onChange={(event, data) => setPage(data.value)}
        />
        <span>{t("pagination.of", { pageCount })}</span>
      </div>
      <p>{t("pagination.totalUsers", { count: countUsers })}</p>

      <button
        disabled={page >= pageCount}
        onClick={() => goToPage(parseInt(page) + 1)}
      >
        <a aria-disabled={page >= pageCount} className="next">
          <p>{t("pagination.next")}</p>
        </a>
      </button>
    </StyledPagination>
  );
}
