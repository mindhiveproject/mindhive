import { useState } from "react";
import Link from "next/link";
import useTranslation from "next-translate/useTranslation";

import Navbar, { NavbarItem } from "../DesignSystem/Navbar";
import {
  GroupIcon,
  ArrowDropDownIcon,
  SettingsIcon,
  OpenInNewIcon,
} from "../DesignSystem/Icons";
import { useSignout } from "../Auth/Signout";
import { StyledMenuProfile } from "../styles/StyledMenuBar";

/**
 * Roles in order of significance, which is the order they are listed in when a
 * user holds more than one.
 */
const ROLE_PRIORITY = [
  ["ADMIN", "Admin"],
  ["TEACHER", "Teacher"],
  ["MENTOR", "Mentor"],
  ["SCIENTIST", "Scientist"],
  ["RESEARCHER", "Researcher"],
  ["SPONSOR", "Sponsor"],
  ["STUDENT", "Student"],
];

/**
 * Every role the user holds, most significant first, comma separated. Holding
 * several at once is uncommon but real, and showing only the highest would
 * misrepresent what the account can actually do.
 */
function roleLabel(user) {
  const permissions =
    user?.permissions?.map((permission) => permission?.name) ?? [];
  const held = ROLE_PRIORITY.filter(([name]) =>
    permissions.includes(name),
  ).map(([, label]) => label);

  return held.length > 0 ? held.join(", ") : "Member";
}

/**
 * Account block at the top of the menu bar: identity row that discloses
 * Settings and Log Off.
 *
 * @param {object} user - Current profile from UserContext.
 * @param {boolean} [collapsed=false] - Renders the icon-only rail form.
 * @param {string} [area] - Active dashboard area, so Settings can mark itself current.
 */
export default function MenuProfile({ user, collapsed = false, area }) {
  const { t } = useTranslation("navigation");
  const [open, setOpen] = useState(false);
  const signOut = useSignout();

  const name = user?.email || user?.username || "";
  const roles = roleLabel(user);

  return (
    <StyledMenuProfile $collapsed={collapsed} $open={open}>
      <button
        type="button"
        className="profileTrigger"
        onClick={() => setOpen((wasOpen) => !wasOpen)}
        aria-expanded={open}
        aria-label={collapsed ? name : undefined}
        title={collapsed ? name : undefined}
      >
        <GroupIcon />
        {!collapsed && (
          <>
            <span className="profileIdentity">
              {/* Titles expose the full value when truncation kicks in. */}
              <span className="profileRole" title={roles}>
                {roles}
              </span>
              <span className="profileName" title={name}>
                {name}
              </span>
            </span>
            <span className="profileCaret">
              <ArrowDropDownIcon />
            </span>
          </>
        )}
      </button>

      {open && (
        <div className="profilePanel">
          {/* The rule ties the panel back to the trigger above it; there is no
              room for it once the rail is only wide enough for icons. */}
          {!collapsed && <span className="profilePanelRule" aria-hidden />}
          <div className="profilePanelLinks">
            <Navbar
              orientation="vertical"
              collapsed={collapsed}
              aria-label={t("account", {}, { default: "Account" })}
            >
              <NavbarItem
                as={Link}
                href="/dashboard/settings"
                selected={area === "settings"}
                leadingIcon={<SettingsIcon />}
              >
                {t("settings")}
              </NavbarItem>
            </Navbar>
            <button
              type="button"
              className="signoutButton"
              onClick={signOut}
              aria-label={collapsed ? t("logoff") : undefined}
              title={collapsed ? t("logoff") : undefined}
            >
              <OpenInNewIcon />
              {!collapsed && t("logoff")}
            </button>
          </div>
        </div>
      )}
    </StyledMenuProfile>
  );
}
