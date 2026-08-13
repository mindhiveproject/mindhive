import { useQuery } from "@apollo/client";
import { useState } from "react";
import debounce from "lodash.debounce";
import useTranslation from "next-translate/useTranslation";

import { GET_CONNECT_USERS } from "../../../Queries/User";
import ProfileCard from "../ConnectProfileCard";
import { SearchIcon } from "../../../DesignSystem/Icons";
import {
  BrowseBody,
  BrowseCardsGrid,
  BrowseEmptyState,
  BrowseHeader,
  BrowseSearchField,
  BrowseShell,
} from "../ConnectBrowseLayout";

import PaginationUsers from "./Pagination";

const PER_PAGE = 12;

export default function ConnectBankNew({ query, user }) {
  const { t } = useTranslation("connect");
  const [keyword, setKeyword] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, loading } = useQuery(GET_CONNECT_USERS, {
    variables: {
      skip: page * PER_PAGE - PER_PAGE,
      take: PER_PAGE,
      search: search,
    },
  });

  const profiles = data?.searchConnectUsers || [];

  const debounceSearch = debounce((value) => {
    setSearch(value);
    setPage(1); // Reset to first page when search changes
  }, 500);

  const updateSearch = (value) => {
    setKeyword(value);
    debounceSearch(value);
  };

  const goToPage = (nextPage) => {
    if (nextPage > 0) {
      setPage(nextPage);
    }
  };

  return (
    <BrowseShell>
      <BrowseHeader>
        <h1>{t("connectWithPeople")}</h1>
        <p>{t("connectSubtitle")}</p>
      </BrowseHeader>

      <BrowseBody>
        <BrowseSearchField>
          <SearchIcon className="search-icon" width={20} height={20} />
          <input
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
            type="search"
            name="keyword"
            value={keyword}
            onChange={({ target }) => updateSearch(target.value)}
          />
        </BrowseSearchField>

        <BrowseCardsGrid>
          {profiles.map((profile) => (
            <ProfileCard key={profile?.id} user={user} profile={profile} />
          ))}
        </BrowseCardsGrid>

        {!loading && profiles.length === 0 && (
          <BrowseEmptyState>
            {t("noResults", {}, { default: "No results found." })}
          </BrowseEmptyState>
        )}

        <PaginationUsers
          page={page}
          setPage={setPage}
          perPage={PER_PAGE}
          search={search}
          goToPage={goToPage}
        />
      </BrowseBody>
    </BrowseShell>
  );
}
