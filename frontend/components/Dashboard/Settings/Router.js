import Link from "next/link";
import useTranslation from "next-translate/useTranslation";
import StyledSettings from "../../styles/StyledSettings";

import Main from "./Main";
import Email from "./Email";
import Username from "./Username";
import Languages from "./Languages";
import Consent from "./Consent";

export default function SettingsMain({ query, user }) {
  const { t } = useTranslation("account");

  const { selector } = query;

  return (
    <StyledSettings>
      {!selector && <Main query={query} user={user} />}
      {selector === "email" && <Email query={query} user={user} />}
      {selector === "username" && <Username query={query} user={user} />}
      {selector === "languages" && <Languages query={query} user={user} />}
      {selector === "consent" && <Consent query={query} user={user} />}
    </StyledSettings>
  );
}
