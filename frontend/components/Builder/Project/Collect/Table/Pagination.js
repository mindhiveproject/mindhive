import { StyledPagination } from "../../../../styles/StyledPagination";
import useTranslation from "next-translate/useTranslation";

export default function ParticipantsPagination({
  page,
  perPage,
  count,
  setPage,
}) {
  const { t } = useTranslation("builder");
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
          {t("pagination.prev", "Prev")}
        </a>
      </div>
      <p>
        {t("pagination.pageOf", "Page {{page}} of {{pageCount}}", { page, pageCount })}
      </p>
      <p>{t("pagination.participantsTotal", "{{count}} participants total", { count })}</p>
      <div
        onClick={() => {
          if (page < pageCount) setPage(page + 1);
        }}
      >
        <a
          aria-disabled={page >= pageCount}
          className={page >= pageCount ? "next inactive" : "next"}
        >
          {t("pagination.next", "Next")}
        </a>
      </div>
    </StyledPagination>
  );
}
