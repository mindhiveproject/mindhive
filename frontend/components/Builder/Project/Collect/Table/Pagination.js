import { StyledPagination } from "../../../../styles/StyledPagination";

export default function ParticipantsPagination({
  page,
  perPage,
  count,
  setPage,
}) {
  const pageCount = Math.ceil(count / perPage);

  return (
    <StyledPagination>
      <div
        onClick={() => {
          if (page > 1) setPage(page - 1);
        }}
      >
        <a
          aria-disabled={page <= 1}
          className={page <= 1 ? "inactive" : undefined}
        >
          Prev
        </a>
      </div>
      <p>
        Page {page} of {pageCount}{" "}
      </p>
      <p>{count} participants total</p>
      <div
        onClick={() => {
          if (page < pageCount) setPage(page + 1);
        }}
      >
        <a
          aria-disabled={page >= pageCount}
          className={page >= pageCount ? "next inactive" : "next"}
        >
          Next
        </a>
      </div>
    </StyledPagination>
  );
}
