import { useQuery } from "@apollo/client";
import { useState } from "react";
import debounce from "lodash.debounce";
import Link from "next/link";
import styled from "styled-components";
import { Dropdown, Icon } from "semantic-ui-react";
import useTranslation from "next-translate/useTranslation";

import { GET_CONNECT_USERS } from "../../../Queries/User";
import ProfileCard from "../ConnectProfileCard";

import PaginationUsers from "./Pagination";

const imgBackground =
  "/assets/connect/background.svg";
const ConnectShell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 48px;
  margin: 0px; 
  background-color: #f7f9f8;
  background-image: url(${imgBackground});
  background-repeat: repeat;
  background-position: center top;
  background-attachment: fixed;
  background-size: auto;
  min-height: 100vh;
  border-radius: 32px 0 0 32px;

  @media (max-width: 1024px) {
    padding: 32px 24px 48px;
  }
`;

const NavigationBar = styled.div`
  display: flex;
  justify-content: flex-end;
  position: sticky;
  top: 0;
  background: rgba(247, 249, 248, 0.8);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(12px);
  z-index: 10;
  padding-top: 16px;
  padding-bottom: 16px;

  a {
    text-decoration: none;
  }

  button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 8px 24px;
    border-radius: 100px;
    border: 1px solid #336f8a;
    background: #ffffff;
    color: #336f8a;
    font-family: "Nunito", sans-serif;
    font-weight: 600;
    font-size: 16px;
    line-height: 24px;
    cursor: pointer;
    transition: all 0.2s ease-in-out;

    &:hover {
      background: #336f8a;
      color: #ffffff;
    }
  }
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;

  h1 {
    margin: 0;
    color: #171717;
    font-family: "Lato", sans-serif;
    font-size: clamp(36px, 5vw, 60px);
    font-weight: 600;
    line-height: 1.1;
  }

  p {
    margin: 0;
    max-width: 640px;
    color: #666666;
    font-family: "Lato", sans-serif;
    font-size: clamp(18px, 2vw, 24px);
    line-height: 32px;
  }
`;

const FiltersRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 20px;
`;

const SearchField = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  width: min(100%, 425px);
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0px 7px 64px rgba(0, 0, 0, 0.07);
  padding: 0 48px 0 24px;
  height: 48px;

  input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 15px;
    font-family: "Inter", sans-serif;
    color: #171717;

    &::placeholder {
      color: #979797;
    }
  }

  .search-icon {
    position: absolute;
    right: 16px;
    height: 24px;
    width: 24px;
    color: #434343;
  }
`;

const FilterPill = styled.button`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  padding: 0 24px;
  width: ${({ $size }) => $size || "205px"};
  height: 48px;
  background: #ffffff;
  border: none;
  border-radius: 20px;
  box-shadow: 0px 7px 64px rgba(0, 0, 0, 0.07);
  font-family: "Inter", sans-serif;
  font-size: 15px;
  color: #979797;
  cursor: pointer;
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-1px);
  }

  .filter-icon {
    color: #336f8a;
  }

  .chevron {
    margin-left: auto;
    color: #979797;
  }
`;

const CardsGrid = styled.div`
  display: grid;
  gap: 24px;
  padding-inline: clamp(16px, 6vw, 64px);
  justify-content: center;
  justify-items: center;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
`;

const FooterControls = styled.div`
  display: flex;
  justify-content: center;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
  color: #5f6871;
  font-family: "Lato", sans-serif;

  span {
    font-size: 14px;
  }

  .per-page-dropdown {
    display: flex;
    align-items: center;
    gap: 12px;

    .ui.selection.dropdown {
      min-width: 120px;
      border-radius: 16px;
      border: 1px solid #d3dae0;
      padding: 8px 12px;
    }
  }
`;

export default function ConnectBankNew({ query, user }) {
  const { t } = useTranslation("connect");
  const [keyword, setKeyword] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(30);

  const { data, loading } = useQuery(GET_CONNECT_USERS, {
    variables: {
      skip: page * perPage - perPage,
      take: perPage,
      search: search,
    },
  });

  const profiles = data?.profiles || [];

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
    <ConnectShell>
      <NavigationBar>
        <Link
          href={{
            pathname: `/dashboard/connect/my`,
          }}
        >
          <button type="button">{t("myConnections")}</button>
        </Link>
      </NavigationBar>

      <Header>
        <h1>{t("connectWithPeople")}</h1>
        <p>{t("connectSubtitle")}</p>
      </Header>

      <FiltersRow>
        <SearchField>
          <Icon className="search-icon" name="search" />
          <input
            placeholder={t("searchPlaceholder")}
            type="text"
            name="keyword"
            value={keyword}
            onChange={({ target }) => updateSearch(target.value)}
          />
        </SearchField>

        {/* <FilterPill type="button">
          <Icon className="filter-icon" name="map marker alternate" />
          {t("locationFilter", { defaultValue: "Location" })}
        </FilterPill>

        <FilterPill type="button">
          <Icon className="filter-icon" name="calendar outline" />
          {t("availabilityFilter", { defaultValue: "Availability" })}
        </FilterPill>

        <FilterPill type="button" $size="140px">
          {t("userTypeFilter", { defaultValue: "User Type" })}
          <Icon className="chevron" name="chevron down" />
        </FilterPill> */}
      </FiltersRow>

      <CardsGrid>
        {profiles.map((profile) => (
          <ProfileCard key={profile?.id} user={user} profile={profile} />
        ))}
        {!loading && profiles.length === 0 && (
          <p>{t("noResults", { defaultValue: "No results found." })}</p>
        )}
      </CardsGrid>

      <PaginationUsers
        page={page}
        setPage={setPage}
        perPage={perPage}
        search={search}
        goToPage={goToPage}
      />

      <FooterControls>
        <span>{t("usersPerPage")}</span>
        <div className="per-page-dropdown">
          <Dropdown
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
      </FooterControls>
    </ConnectShell>
  );
}

