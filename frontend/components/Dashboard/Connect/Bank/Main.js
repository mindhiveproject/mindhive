import { useQuery } from "@apollo/client";
import { useState } from "react";
import debounce from "lodash.debounce";
import Link from "next/link";
import { Dropdown } from "semantic-ui-react";
import useTranslation from "next-translate/useTranslation";

import StyledConnect from "../../../styles/StyledConnect";
import { StyledInput } from "../../../styles/StyledForm";

import { GET_ALL_USERS } from "../../../Queries/User";
import ProfileCard from "./Card";

import PaginationUsers from "./Pagination";

export default function ConnectBank({ query, user }) {
  const { t } = useTranslation("connect");
  const [keyword, setKeyword] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(30);

  const { data, loading, error } = useQuery(GET_ALL_USERS, {
    variables: {
      skip: page * perPage - perPage,
      take: perPage,
      search: search,
    },
  });

  const profiles = data?.profiles || [];

  const debounceSearch = debounce((value) => {
    setSearch(value);
  }, 1000);

  const updateSearch = (value) => {
    setKeyword(value);
    debounceSearch(value);
  };

  const goToPage = (page) => {
    if (page > 0) {
      setPage(page);
    }
  };

  return (
    <StyledConnect>
      <div className="navigation">
        <Link
          href={{
            pathname: `/dashboard/connect/my`,
          }}
        >
          <button>{t("myConnections")}</button>
        </Link>
      </div>
      <div className="header">
        <div className="title">{t("connectWithPeople")}</div>
        <div className="subtitle">
          {t("connectSubtitle")}
        </div>
      </div>
      <StyledInput>
        <div className="searchArea">
          <input
            placeholder={t("searchPlaceholder")}
            type="text"
            name="keyword"
            value={keyword}
            onChange={({ target }) => updateSearch(target.value)}
          />
        </div>
      </StyledInput>
      <div className="cards">
        {profiles.map((profile) => (
          <ProfileCard key={profile?.id} user={user} profile={profile} />
        ))}
      </div>

      <PaginationUsers
        page={page}
        setPage={setPage}
        perPage={perPage}
        search={search}
        goToPage={goToPage}
      />

      <div>
        <span>{t("usersPerPage")}</span>
        <Dropdown
          fluid
          selection
          options={[9, 27, 54, 108].map((n) => ({
            key: n,
            text: n,
            value: n,
          }))}
          value={perPage}
          onChange={(event, data) => setPerPage(data.value)}
        />
      </div>
    </StyledConnect>
  );
}
