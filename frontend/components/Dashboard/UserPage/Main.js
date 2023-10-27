import { useQuery } from "@apollo/client";
import { GET_USER } from "../../Queries/User";
import Link from "next/link";

import StyledProfile from "../../styles/StyledProfile";

import Participated from "./Participated";
import Created from "./Created";
import Reviewed from "./Reviewed/Main";
import Journal from "./Journal/Main";
import Homework from "./Homework/Main";

export default function StudentPage({ query, user }) {
  const { area, selector } = query;
  const page = query?.page || "participated";

  const { data, loading, error } = useQuery(GET_USER, {
    variables: { id: selector },
  });
  const profile = data?.profile || {
    researcherIn: [],
    collaboratorInStudy: [],
    reviews: [],
  };

  return (
    <StyledProfile>
      <div className="headerProfile">
        <div>
          <h1>{profile?.publicReadableId}</h1>
          <p>{profile?.email}</p>
        </div>
        <div>
          <img
            src={profile?.image?.image?.publicUrlTransformed}
            alt={profile?.username}
          />
        </div>
      </div>
      <div>
        <div className="menu">
          <Link
            href={{
              pathname: `/dashboard/${area}/${selector}`,
              query: {
                page: "participated",
              },
            }}
            className={
              page === "participated"
                ? "menuTitle selectedMenuTitle"
                : "menuTitle"
            }
          >
            <p>Participated</p>
          </Link>

          <Link
            href={{
              pathname: `/dashboard/${area}/${selector}`,
              query: {
                page: "created",
              },
            }}
            className={
              page === "created" ? "menuTitle selectedMenuTitle" : "menuTitle"
            }
          >
            <p>Created</p>
          </Link>

          <Link
            href={{
              pathname: `/dashboard/${area}/${selector}`,
              query: {
                page: "reviewed",
              },
            }}
            className={
              page === "reviewed" ? "menuTitle selectedMenuTitle" : "menuTitle"
            }
          >
            <p>Reviewed</p>
          </Link>

          <Link
            href={{
              pathname: `/dashboard/${area}/${selector}`,
              query: {
                page: "journal",
              },
            }}
            className={
              page === "journal" ? "menuTitle selectedMenuTitle" : "menuTitle"
            }
          >
            <p>Journal</p>
          </Link>

          <Link
            href={{
              pathname: `/dashboard/${area}/${selector}`,
              query: {
                page: "homework",
              },
            }}
            className={
              page === "homework" ? "menuTitle selectedMenuTitle" : "menuTitle"
            }
          >
            <p>Homework</p>
          </Link>
        </div>
        <div>
          {page === "participated" && (
            <Participated query={query} user={user} profile={profile} />
          )}
        </div>
        <div>
          {page === "created" && (
            <Created query={query} user={user} profile={profile} />
          )}
        </div>
        <div>
          {page === "reviewed" && (
            <Reviewed query={query} user={user} profile={profile} />
          )}
        </div>
        <div>
          {page === "journal" && (
            <Journal query={query} user={user} profile={profile} />
          )}
        </div>
        <div>
          {page === "homework" && (
            <Homework query={query} user={user} profile={profile} />
          )}
        </div>
      </div>
    </StyledProfile>
  );
}
