import Link from "next/link";
import { useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";
import useTranslation from "next-translate/useTranslation";

import { UserContext } from "../Global/Authorized";

import Navbar, { NavbarItem, NavbarSection } from "../DesignSystem/Navbar";
import { MenuIcon, MenuOpenIcon, SearchIcon } from "../DesignSystem/Icons";
import MenuProfile from "./MenuProfile";
import NotificationsMenu from "./NotificationsMenu";
import {
  getNavPermissions,
  resolveSectionLabel,
  visibleSections,
} from "./navigationConfig";
import {
  StyledMenuBar,
  StyledMenuIconButton,
  StyledMenuSearch,
} from "../styles/StyledMenuBar";

const COLLAPSED_STORAGE_KEY = "mh.menuBar.collapsed";

/**
 * Remembers the collapsed state across visits.
 *
 * Always renders expanded on the first pass so the server and client markup
 * agree, then adopts the stored preference once mounted.
 */
function useCollapsedMenu() {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(
        window.localStorage.getItem(COLLAPSED_STORAGE_KEY) === "true",
      );
    } catch (error) {
      console.log("Menu bar will default to expanded");
    }
  }, []);

  const toggle = () => {
    setCollapsed((wasCollapsed) => {
      const next = !wasCollapsed;
      try {
        window.localStorage.setItem(COLLAPSED_STORAGE_KEY, String(next));
      } catch (error) {
        // The preference will not persist, but the toggle still works.
      }
      return next;
    });
  };

  return [collapsed, toggle];
}

export default function DashboardNavigation() {
  const router = useRouter();
  const { user } = useContext(UserContext);
  const { t } = useTranslation("navigation");
  const [collapsed, toggleCollapsed] = useCollapsedMenu();

  const { area } = router.query;
  const permissions = getNavPermissions(user);
  const sections = visibleSections(permissions);

  const collapseLabel = collapsed
    ? t("expandMenu", {}, { default: "Expand menu" })
    : t("collapseMenu", {}, { default: "Collapse menu" });
  const searchLabel = t("search", {}, { default: "Search" });

  return (
    <StyledMenuBar $collapsed={collapsed}>
      {/* Direct child of the card so it stays pinned for the whole scroll. */}
      <div className="menuBarActions">
        <div className="menuBarActionsRow">
          <StyledMenuIconButton
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapseLabel}
            title={collapseLabel}
            aria-expanded={!collapsed}
          >
            {collapsed ? <MenuIcon /> : <MenuOpenIcon />}
          </StyledMenuIconButton>

          <NotificationsMenu user={user} />
        </div>
        <span className="menuBarActionsRule" aria-hidden />
      </div>

      <div className="menuBarHeader">
        <div className="menuBarLogo">
          <Link href="/" aria-label="mindHIVE">
            <img
              src={collapsed ? "/favicon.svg" : "/mh_logo_color.svg"}
              alt="mindHIVE"
            />
          </Link>
        </div>

        {/* Possibly add a search option to the page. Not wired and not rendered yet 
        <StyledMenuSearch $collapsed={collapsed}>
          <SearchIcon />
          {!collapsed && (
            <input
              type="search"
              placeholder={searchLabel}
              aria-label={searchLabel}
            />
          )}
        </StyledMenuSearch> */}
      </div>

      <MenuProfile user={user} collapsed={collapsed} area={area} />

      <div className="menuBarNav">
        <Navbar
          orientation="vertical"
          collapsed={collapsed}
          aria-label={t("workspace")}
          variant="soft"
        >
          {sections.map((section) => {
            const label = resolveSectionLabel(section, permissions);
            return (
              <NavbarSection
                key={section.id}
                label={
                  label
                    ? t(label.key,{ default: label.fallback })
                    : undefined
                }
              >
                {section.items.map((item) => (
                  <NavbarItem
                    key={item.id}
                    as={Link}
                    href={item.href}
                    selected={(item.area ?? null) === (area ?? null)}
                    leadingIcon={<item.Icon />}
                  >
                    {t(item.labelKey, { default: item.fallback })}
                  </NavbarItem>
                ))}
              </NavbarSection>
            );
          })}
        </Navbar>
      </div>
    </StyledMenuBar>
  );
}
