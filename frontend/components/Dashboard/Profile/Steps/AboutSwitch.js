// Dual-render gate for the Profile "About" step. Organization setup is owned
// by Connect Manage (inline create). This switch only serves individual
// profiles — org query/type redirects to Manage from EditProfile.
import About from "./2-AboutMe";
import AboutDefinitionMode from "./AboutDefinitionMode";
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

  // Org-as-profile About is retired; EditProfile should redirect before this
  // mounts. Fall through to individual about if we ever land here.
  if (isOrganization) {
    return <About query={{ ...query, type: "individual" }} user={user} />;
  }
  if (isEnabledFor("profile_individual")) {
    return <AboutDefinitionMode user={user} />;
  }
  return <About query={query} user={user} />;
}
