"use client";

import { motion } from "motion/react";
import useTranslation from "next-translate/useTranslation";

import IconButton from "../../DesignSystem/IconButton";
import Tooltip from "../../DesignSystem/Tooltip";
import { COLLAPSE_TRANSITION } from "../../DesignSystem/SplitPane";
import { MenuIcon, MenuOpenIcon } from "../../DesignSystem/Icons";

// Wide enough that every description wraps onto two lines rather than three,
// as it does in Figma.
const MENU_WIDTH = 360;

// The dashboard menu bar's collapsed width, so the two rails match.
const RAIL_WIDTH = 72;

// The same white 12px surface as every other panel in the builder, so the menu
// reads as one of them: the panel that picks what the one beside it shows. The
// surface is what animates; what is inside switches at once and is clipped.
const ROOT_STYLE = {
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  flexShrink: 0,
  height: "100%",
  borderRadius: 12,
  background: "var(--MH-Theme-Neutrals-White, #FFFFFF)",
  border: "1px solid var(--MH-Theme-Neutrals-Light, #E6E6E6)",
  overflow: "hidden",
};

// Fixed to the open width, so the text holds its wrap while the surface grows
// around it rather than reflowing on every frame.
const CONTENT_STYLE = {
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  flex: "1 1 0%",
  minHeight: 0,
  width: MENU_WIDTH - 2,
};

// No side padding on the rail: 40px controls centred in its 70px leave the
// same 15px either side the dashboard's does.
const RAIL_CONTENT_STYLE = {
  ...CONTENT_STYLE,
  width: RAIL_WIDTH - 2,
  alignItems: "center",
};

const HEADER_STYLE = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexShrink: 0,
  padding: "16px 16px 0",
};

const RAIL_HEADER_STYLE = { ...HEADER_STYLE, padding: "16px 0 0" };

// MH-Theme/title/base
const TITLE_STYLE = {
  margin: 0,
  font: "var(--MH-Type-Title-Base)",
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
  whiteSpace: "nowrap",
};

const BODY_STYLE = {
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  gap: 24,
  flex: "1 1 0%",
  minHeight: 0,
  width: "100%",
  overflowY: "auto",
  padding: "24px 16px 16px",
};

const RAIL_BODY_STYLE = {
  ...BODY_STYLE,
  alignItems: "center",
  padding: "24px 0 16px",
};

const GROUP_STYLE = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

// MH-Theme/title/base in Neutrals Dark, inset to line up with the icons below.
const GROUP_LABEL_STYLE = {
  margin: 0,
  padding: "0 12px",
  font: "var(--MH-Type-Title-Base)",
  color: "var(--MH-Theme-Neutrals-Dark, #6A6A6A)",
};

// On the rail a heading has no room, so it becomes a rule that keeps the
// grouping, as the dashboard's NavbarSection does.
const GROUP_RULE_STYLE = {
  width: 40,
  height: 1,
  background: "var(--MH-Theme-Neutrals-Light, #E6E6E6)",
};

const LIST_STYLE = {
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  gap: 4,
  margin: 0,
  padding: 0,
  listStyle: "none",
};

// The dashboard's sidebar item — the 8px corners its rail gives the selected
// and hovered items, so the two menus match — but in Neutrals Black, like the
// rest of the builder's text, rather than the dashboard's Accent Dark.
const ITEM_STYLE = {
  boxSizing: "border-box",
  display: "flex",
  alignItems: "flex-start",
  gap: 12,
  width: "100%",
  padding: 12,
  border: "none",
  borderRadius: 8,
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
  textAlign: "left",
  cursor: "pointer",
  transition: "background-color 0.2s",
};

const RAIL_ITEM_STYLE = {
  ...ITEM_STYLE,
  width: 40,
  height: 40,
  padding: 8,
};

const ITEM_ICON_STYLE = {
  display: "flex",
  flexShrink: 0,
  width: 24,
  height: 24,
};

const ITEM_TEXT_STYLE = {
  display: "flex",
  flexDirection: "column",
  minWidth: 0,
};

// MH-Theme/title/base
const ITEM_TITLE_STYLE = { font: "var(--MH-Type-Title-Base)" };

// MH-Theme/body/base
const ITEM_DESCRIPTION_STYLE = {
  font: "var(--MH-Type-Body-Base)",
  color: "var(--MH-Theme-Neutrals-Dark, #6A6A6A)",
};

// The dashboard rail's states: Accent Light behind hovered and selected items
// alike, with the selected one also turning its glyph Accent Base. The resting
// background lives here rather than in ITEM_STYLE: an inline one would beat
// these rules and the fill would never show.
const ITEM_STATE_STYLE =
  ".Visuals-NavMenu-Item {" +
  "background: none;" +
  "}" +
  ".Visuals-NavMenu-Item:hover," +
  ".Visuals-NavMenu-Item[aria-current] {" +
  "background: var(--MH-Theme-Accent-Light, #FDF2D0);" +
  "}" +
  ".Visuals-NavMenu-Item[aria-current] .Visuals-NavMenu-Icon {" +
  "color: var(--MH-Theme-Accent-Base, #F2BE42);" +
  "}" +
  ".Visuals-NavMenu-Item:focus-visible {" +
  "outline: 2px solid var(--MH-Theme-Primary-Dark, #336F8A);" +
  "outline-offset: 2px;" +
  "}" +
  ".Visuals-NavMenu-Item svg {" +
  "fill: currentColor;" +
  "}";

// The body only scrolls on a short window, and a gutter beside the items would
// eat into a rail that is barely wider than they are. Same trick the Panel
// body uses: still scrolls, just without the scrollbar.
const HIDE_SCROLLBAR_STYLE =
  ".Visuals-NavMenu-Body { scrollbar-width: none; -ms-overflow-style: none; }" +
  ".Visuals-NavMenu-Body::-webkit-scrollbar { display: none; }";

/**
 * The builder's vertical navigation: every work panel, grouped, each with a
 * line on what it is for. Collapses to an icon rail rather than going away, so
 * switching panels stays one click either way. An alternative to the
 * horizontal Navbar.
 *
 * @param {{ id: string, label: string, items: { id: string, label: string, labelKey?: string, description: string, descriptionKey?: string, icon: React.ReactNode }[] }[]} groups
 *   Sections in order. A group's `id` is its heading's translation key; an
 *   item's is its label's (unless `labelKey` says otherwise), and
 *   `<id>Description` its description's (unless `descriptionKey` does).
 * @param {string} selected - The id of the panel being shown.
 * @param {boolean} collapsed - Shows the icon rail instead of the full menu.
 * @param {function} onSelect - Called with an item's id.
 * @param {function} onToggle - Called by the menu button in the header.
 * @param {React.CSSProperties} [style] - Override for the root.
 */
export default function NavMenu({
  groups,
  selected,
  collapsed,
  onSelect,
  onToggle,
  style = {},
}) {
  const { t } = useTranslation("visuals");
  const toggleLabel = collapsed
    ? t("openMenu", "Open menu")
    : t("closeMenu", "Close menu");

  return (
    <motion.nav
      className="Visuals-NavMenu"
      style={{ ...ROOT_STYLE, ...style }}
      initial={false}
      animate={{ width: collapsed ? RAIL_WIDTH : MENU_WIDTH }}
      transition={COLLAPSE_TRANSITION}
      aria-label={t("visualMenu", "Visual Menu")}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: ITEM_STATE_STYLE + HIDE_SCROLLBAR_STYLE,
        }}
      />
      <div style={collapsed ? RAIL_CONTENT_STYLE : CONTENT_STYLE}>
        <header style={collapsed ? RAIL_HEADER_STYLE : HEADER_STYLE}>
          <IconButton
            variant="neutral"
            icon={collapsed ? <MenuIcon /> : <MenuOpenIcon />}
            onClick={onToggle}
            ariaLabel={toggleLabel}
            title={toggleLabel}
            aria-expanded={!collapsed}
          />
          {collapsed ? null : (
            <h2 style={TITLE_STYLE}>{t("visualMenu", "Visual Menu")}</h2>
          )}
        </header>

        <div
          className="Visuals-NavMenu-Body"
          style={collapsed ? RAIL_BODY_STYLE : BODY_STYLE}
        >
          {groups.map((group) => (
            <section key={group.id} style={GROUP_STYLE}>
              {collapsed ? (
                <span style={GROUP_RULE_STYLE} aria-hidden />
              ) : (
                <h3 style={GROUP_LABEL_STYLE}>{t(group.id, group.label)}</h3>
              )}
              <ul style={LIST_STYLE}>
                {group.items.map((item) => {
                  const label = t(item.labelKey || item.id, item.label);
                  const button = (
                    <button
                      type="button"
                      className="Visuals-NavMenu-Item"
                      style={collapsed ? RAIL_ITEM_STYLE : ITEM_STYLE}
                      aria-current={selected === item.id ? "page" : undefined}
                      aria-label={collapsed ? label : undefined}
                      onClick={() => onSelect(item.id)}
                    >
                      <span
                        className="Visuals-NavMenu-Icon"
                        style={ITEM_ICON_STYLE}
                        aria-hidden
                      >
                        {item.icon}
                      </span>
                      {collapsed ? null : (
                        <span style={ITEM_TEXT_STYLE}>
                          <span style={ITEM_TITLE_STYLE}>{label}</span>
                          <span style={ITEM_DESCRIPTION_STYLE}>
                            {t(
                              item.descriptionKey || `${item.id}Description`,
                              item.description
                            )}
                          </span>
                        </span>
                      )}
                    </button>
                  );

                  return (
                    <li key={item.id}>
                      {collapsed ? (
                        <Tooltip content={label} side="right">
                          {button}
                        </Tooltip>
                      ) : (
                        button
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </motion.nav>
  );
}
