// Dual-render gate for the Profile "About" step. The legacy
// 2-AboutMe.js stays in place as the fallback; the new path renders
// the `profile_individual` or `profile_organization` FormDefinition
// when NEXT_PUBLIC_USE_CUSTOMIZABLE_FORMS includes the matching key.
import About from "./2-AboutMe";
import AboutDefinitionMode from "./AboutDefinitionMode";
import OrgAboutDefinitionMode from "./OrgAboutDefinitionMode";
import { resolveProfileType } from "../../../../lib/profileEditNavigation";

function isEnabledFor(key) {
  const raw = process.env.NEXT_PUBLIC_USE_CUSTOMIZABLE_FORMS || "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .includes(key);
}

export default function AboutSwitch({ query, user }) {
  const profileType = resolveProfileType(query, user);
  const isOrganization = profileType === "organization";

  if (isOrganization && isEnabledFor("profile_organization")) {
    return <OrgAboutDefinitionMode user={user} />;
  }
  if (!isOrganization && isEnabledFor("profile_individual")) {
    return <AboutDefinitionMode user={user} />;
  }
  return <About query={query} user={user} />;
}
