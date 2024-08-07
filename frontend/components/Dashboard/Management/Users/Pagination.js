import { useQuery } from "@apollo/client";
import { StyledPagination } from "../../../styles/StyledPagination";

import { PAGINATION_USERS_QUERY } from "../../../Queries/User";

export default function PaginationUsers({ page, perPage, search, goToPage }) {
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
        <a aria-disabled={page <= 1}>Prev</a>
      </button>
      <p>
        Page {page} of {pageCount}{" "}
      </p>
      <p>{countUsers} users total</p>
      <button
        disabled={page >= pageCount}
        onClick={() => goToPage(parseInt(page) + 1)}
      >
        <a aria-disabled={page >= pageCount} className="next">
          Next
        </a>
      </button>
    </StyledPagination>
  );
}
