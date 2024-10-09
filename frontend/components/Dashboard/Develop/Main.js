import Link from "next/link";
import useTranslation from "next-translate/useTranslation";
import Trans from "next-translate/Trans";

import Selector from "./DevelopNew/Selector";
import Panels from "./Panels";

import { StyledSelector } from "../../styles/StyledSelector";

export default function DevelopMain({ query, user }) {
  const { t } = useTranslation("dashboard");

  const { selector } = query;
  let developNewQuery;
  switch (selector) {
    case "studies":
      developNewQuery = "study";
      break;
    case "tasks":
      developNewQuery = "task";
      break;
    case "surveys":
      developNewQuery = "survey";
      break;
    case "blocks":
      developNewQuery = "block";
      break;
    default:
      developNewQuery = "study";
  }

  if (selector === "new") {
    return (
      <StyledSelector>
        <Selector query={query} user={user} />
      </StyledSelector>
    );
  }

  return (
    <>
      <h1>Develop</h1>
      <div className="header">
        <div>
          <p>
            <Trans
              i18nKey="dashboard:develop.headerDescription"
              components={[<strong />]}
            />
          </p>
        </div>
        <div>
          <Link
            href={{
              pathname: `/dashboard/develop/new`,
              query: { develop: developNewQuery },
            }}
          >
            <button>Develop new</button>
          </Link>
        </div>
      </div>
      <Panels query={query} user={user} />
    </>
  );
}
