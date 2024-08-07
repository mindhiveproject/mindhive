import { useQuery } from "@apollo/client";
import { StyledPagination } from "../../../styles/StyledPagination";

import { PAGINATION_USERS_QUERY } from "../../../Queries/User";

import { Dropdown } from "semantic-ui-react";

export default function PaginationUsers({
  page,
  setPage,
  perPage,
  search,
  goToPage,
}) {
  const { data, loading, error } = useQuery(PAGINATION_USERS_QUERY, {
    variables: {
      search: search,
    },
  });
  const countUsers = data?.profilesCount || [];
  const pageCount = Math.ceil(countUsers / perPage);

  return (
    <StyledPagination>
      <button disabled={page <= 1} onClick={() => goToPage(parseInt(page) - 1)}>
        <a aria-disabled={page <= 1} className="prev">
          <p>Prev</p>
        </a>
      </button>
      <div className="pageDropdown">
        <span>Page</span>
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
        <span>of {pageCount}</span>
      </div>
      <p>{countUsers} users total</p>

      <button
        disabled={page >= pageCount}
        onClick={() => goToPage(parseInt(page) + 1)}
      >
        <a aria-disabled={page >= pageCount} className="next">
          <p>Next</p>
        </a>
      </button>
    </StyledPagination>
  );
}
