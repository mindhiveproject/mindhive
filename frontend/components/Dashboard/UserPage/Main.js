import { useQuery } from "@apollo/client";
import { GET_USER } from "../../Queries/User";
import Link from "next/link";

import StyledProfile from "../../styles/StyledProfile";

import Participated from "./Participated";
import Projects from "./Projects";
import Created from "./Created";
import Reviewed from "./Reviewed/Main";
import Journal from "./Journal/Main";
import Homework from "./Homework/Main";
import useTranslation from 'next-translate/useTranslation';

export default function StudentPage({ query, user }) {
  const { t } = useTranslation('common');
  const { area, selector } = query;
  const page = query?.page || "projects";

  const { data, loading, error } = useQuery(GET_USER, {
    variables: { id: selector },
  });
  const profile = data?.profile || {
    researcherIn: [],
    collaboratorInStudy: [],
    reviews: [],
    authorOfProposal: [],
    collaboratorInProposal: [],
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
      <div className="pageProfile">
        <div className="menu">
          <Link
            href={{
              pathname: `/dashboard/${area}/${selector}`,
              query: {
                page: "projects",
              },
            }}
            className={
              page === "projects" ? "menuTitle selectedMenuTitle" : "menuTitle"
            }
          >
            <p>{t('projects.menuTitle')}</p>
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
            <p>{t('created.menuTitle')}</p>
          </Link>

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
            <p>{t('participated.menuTitle')}</p>
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
            <p>{t('reviewed.menuTitle')}</p>
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
            <p>{t('journal.menuTitle')}</p>
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
            <p>{t('homework.menuTitle')}</p>
          </Link>
        </div>
        <div>
          {page === "participated" && (
            <Participated query={query} user={user} profile={profile} />
          )}
        </div>
        <div>
          {page === "projects" && (
            <Projects query={query} user={user} profile={profile} />
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
