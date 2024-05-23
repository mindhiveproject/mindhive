import Link from "next/link";
import useTranslation from "next-translate/useTranslation";
import Trans from "next-translate/Trans";

import Selector from "./DevelopNew/Selector";
import Panels from "./Panels";

import { StyledSelector } from "../../styles/StyledSelector";

export default function DevelopMain({ query, user }) {
  const { t } = useTranslation("dashboard");

  const { selector } = query;

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
          <Link href="/dashboard/develop/new">
            <button>Develop new</button>
          </Link>
        </div>
      </div>
      <Panels query={query} user={user} />
    </>
  );
}
