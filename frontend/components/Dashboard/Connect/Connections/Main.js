import { useQuery } from "@apollo/client";
import { useState } from "react";
import debounce from "lodash.debounce";
import useTranslation from "next-translate/useTranslation";

import { MY_FAVORITE_PEOPLE } from "../../../Queries/User";
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
import PaginationUsers from "../Bank/Pagination";
import { organizationSearchText } from "../../../../lib/organizationLabels";

const PER_PAGE = 12;

export default function Connections({ query, user }) {
  const { t } = useTranslation("connect");
  const [keyword, setKeyword] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, loading } = useQuery(MY_FAVORITE_PEOPLE);

  const allFavorites = data?.authenticatedItem?.favoritePeople || [];

  // Client-side search filtering
  const filteredProfiles = allFavorites.filter((profile) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    const searchFields = [
      profile?.username,
      profile?.firstName,
      profile?.lastName,
      profile?.publicId,
      profile?.publicReadableId,
      profile?.email,
      organizationSearchText(profile?.organization),
      profile?.location,
    ]
      .filter(Boolean)
      .map((field) => field.toLowerCase());

    return searchFields.some((field) => field.includes(searchLower));
  });

  // Client-side pagination
  const totalCount = filteredProfiles.length;
  const startIndex = (page - 1) * PER_PAGE;
  const endIndex = startIndex + PER_PAGE;
  const profiles = filteredProfiles.slice(startIndex, endIndex);

  const debounceSearch = debounce((value) => {
    setSearch(value);
    setPage(1); // Reset to first page when search changes
  }, 500);

  const updateSearch = (value) => {
    setKeyword(value);
    debounceSearch(value);
  };

  const goToPage = (nextPage) => {
    const maxPage = Math.ceil(totalCount / PER_PAGE);
    if (nextPage > 0 && nextPage <= maxPage) {
      setPage(nextPage);
    }
  };

  return (
    <BrowseShell>
      <BrowseHeader>
        <h1>{t("savedConnections")}</h1>
        <p>{t("savedConnectionsSubtitle")}</p>
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
          totalCount={totalCount}
        />
      </BrowseBody>
    </BrowseShell>
  );
}
