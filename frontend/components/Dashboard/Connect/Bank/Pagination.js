import { useQuery } from "@apollo/client";
import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";

import { PAGINATION_CONNECT_USERS_QUERY } from "../../../Queries/User";
import Button from "../../../DesignSystem/Button";

/** Build page list with ellipses: 1 … 4 5 6 … 20 */
function getPageItems(current, total) {
  if (total <= 0) return [];
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const delta = 1;
  const range = [];
  const items = [];
  let last;

  for (let i = 1; i <= total; i += 1) {
    if (
      i === 1 ||
      i === total ||
      (i >= current - delta && i <= current + delta)
    ) {
      range.push(i);
    }
  }

  for (const pageNum of range) {
    if (last !== undefined) {
      if (pageNum - last === 2) {
        items.push(last + 1);
      } else if (pageNum - last > 1) {
        items.push("ellipsis");
      }
    }
    items.push(pageNum);
    last = pageNum;
  }

  return items;
}

const Nav = styled.nav`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 0;
  font-family: Inter, sans-serif;
  font-size: 14px;
  line-height: 20px;
  font-weight: 600;
`;

const PageList = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const PageButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  height: 40px;
  padding: 8px 12px;
  border: none;
  border-radius: 100px;
  background: transparent;
  color: var(--MH-Theme-Primary-Dark, #336f8a);
  font-family: Inter, sans-serif;
  font-size: 14px;
  line-height: 20px;
  font-weight: 600;
  cursor: pointer;
  box-sizing: border-box;
  transition: background-color 0.2s, color 0.2s;

  &:hover:not(:disabled):not([aria-current="page"]) {
    background: var(--MH-Theme-Neutrals-Lighter, #f3f3f3);
  }

  &[aria-current="page"] {
    background: var(--MH-Theme-Primary-Dark, #336f8a);
    color: var(--MH-Theme-Neutrals-White, #ffffff);
    cursor: default;
  }

  &:focus-visible {
    outline: 2px solid var(--MH-Theme-Primary-Dark, #336f8a);
    outline-offset: 2px;
  }
`;

const Ellipsis = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 40px;
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  font-family: Inter, sans-serif;
  font-size: 14px;
  line-height: 20px;
  font-weight: 600;
  user-select: none;
`;

export default function PaginationUsers({
  page,
  setPage,
  perPage,
  search,
  goToPage,
  totalCount,
}) {
  const { t } = useTranslation("common");

  const { data, loading } = useQuery(PAGINATION_CONNECT_USERS_QUERY, {
    variables: {
      search: search,
    },
    skip: totalCount !== undefined,
  });

  const countUsers =
    totalCount !== undefined ? totalCount : data?.searchConnectUsersCount || 0;
  const pageCount = Math.ceil(countUsers / perPage);

  if (totalCount === undefined && loading) {
    return null;
  }

  if (pageCount <= 1) {
    return null;
  }

  const handleGoToPage = (nextPage) => {
    if (typeof goToPage === "function") {
      goToPage(nextPage);
      return;
    }
    if (typeof setPage === "function" && nextPage > 0 && nextPage <= pageCount) {
      setPage(nextPage);
    }
  };

  const pageItems = getPageItems(Number(page), pageCount);

  return (
    <Nav
      aria-label={t("pagination.navLabel", {}, { default: "Pagination" })}
    >
      <Button
        variant="outline"
        disabled={page <= 1}
        onClick={() => handleGoToPage(Number(page) - 1)}
      >
        {t("pagination.prev", {}, { default: "Previous" })}
      </Button>

      <PageList>
        {pageItems.map((item, index) =>
          item === "ellipsis" ? (
            <Ellipsis key={`ellipsis-${index}`} aria-hidden>
              …
            </Ellipsis>
          ) : (
            <PageButton
              key={item}
              type="button"
              aria-current={item === Number(page) ? "page" : undefined}
              aria-label={t(
                "pagination.goToPage",
                { page: item },
                { default: "Go to page {{page}}" }
              )}
              onClick={() => handleGoToPage(item)}
            >
              {item}
            </PageButton>
          )
        )}
      </PageList>

      <Button
        variant="filled"
        disabled={page >= pageCount}
        onClick={() => handleGoToPage(Number(page) + 1)}
      >
        {t("pagination.next", {}, { default: "Next" })}
      </Button>
    </Nav>
  );
}
