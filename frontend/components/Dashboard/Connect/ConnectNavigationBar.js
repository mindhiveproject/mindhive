import { useContext, useMemo, useState } from "react";
import { useRouter } from "next/router";
import clsx from "clsx";
import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";

import DropdownSelect from "../../DesignSystem/DropdownSelect";
import Navbar from "../../DesignSystem/Navbar";
import { UserContext } from "../../Global/Authorized";
import useConnectRole from "./useConnectRole";

const CONNECT_NAV_ICONS = {
  organizations: "/assets/connect/building.svg",
  classNetworks: "/assets/connect/network.svg",
  opportunities: "/assets/connect/magnifier.svg",
  connect: "/assets/connect/globe.svg",
};

/** Paths owned by the Opportunities group, used to highlight the active section. */
const OPPORTUNITY_PATHS = [
  "/dashboard/connect/explore",
  "/dashboard/connect/my-matches",
  "/dashboard/connect/rounds",
  "/dashboard/connect/questions",
  "/dashboard/connect/participate",
  "/dashboard/connect/matches",
  "/dashboard/connect/review-queue",
  "/dashboard/connect/review",
  "/dashboard/sponsor-connect",
];

function getActiveSection(path) {
  if (
    path.startsWith("/dashboard/connect/organizations") ||
    path.startsWith("/dashboard/connect/manage-organization")
  ) {
    return "organizations";
  }
  if (path.startsWith("/dashboard/connect/networks")) {
    return "classNetworks";
  }
  if (OPPORTUNITY_PATHS.some((p) => path.startsWith(p))) {
    return "opportunities";
  }
  if (path.startsWith("/dashboard/connect")) {
    return "connect";
  }
  return null;
}

function NavDropdownIcon({ src, width = 24, height = 24 }) {
  return (
    <img
      src={src}
      alt=""
      aria-hidden
      width={width}
      height={height}
      style={{ display: "block" }}
    />
  );
}

/**
 * The design system Navbar, pinned to the top of every Connect page. Each entry
 * opens a menu rather than navigating directly, so the trigger is a
 * DropdownSelect wearing the Navbar item's own classes.
 */
const NavigationBar = styled(Navbar)`
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(247, 249, 248, 0.8);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(12px);
  padding: 8px clamp(16px, 6vw, 64px);

  .navbar-container {
    justify-content: flex-end;
    padding: 0;
  }

  /* Labels keep their natural width — a nav bar squeezing its own text to fit
     is worse than one that runs out of room. */
  .navbar-item {
    flex-shrink: 0;
  }

  /* !important: DropdownSelect sets these inline for its full-width case, where
     the label is expected to clamp and shrink. A nav trigger is the opposite. */
  .navbar-item [data-dropdown-label] {
    flex: 0 0 auto !important;
    white-space: nowrap !important;
    overflow: visible !important;
  }

  /* Out of room: drop the labels and leave icon-only triggers. The menus still
     open, and each trigger keeps its aria-label as its accessible name. */
  @media (max-width: 1100px) {
    .navbar-item [data-dropdown-label] {
      display: none !important;
    }

    .navbar-item.has-icon {
      padding-left: 12px;
      padding-right: 12px;
    }
  }
`;

function ConnectNavDropdown({
  placeholderKey,
  placeholderDefault,
  options,
  ariaLabelKey,
  ariaLabelDefault,
  active = false,
  icon,
}) {
  const { t } = useTranslation("connect");
  const router = useRouter();
  const [value, setValue] = useState(undefined);

  const handleChange = (next) => {
    const option = options.find((o) => o.value === next);
    if (option?.href) {
      router.push(option.href);
    }
    setValue(undefined);
  };

  if (options.length === 0) {
    return null;
  }

  return (
    <li>
      <DropdownSelect
        value={value}
        options={options}
        onChange={handleChange}
        fitContent
        placeholder={t(placeholderKey, {}, { default: placeholderDefault })}
        ariaLabel={t(ariaLabelKey, {}, { default: ariaLabelDefault })}
        triggerClassName={clsx(
          "navbar-item",
          icon && "has-icon",
          "has-trailing",
          active && "selected"
        )}
        leadingIcon={
          icon ? (
            <span className="navbar-item-icon" aria-hidden>
              {icon}
            </span>
          ) : null
        }
      />
    </li>
  );
}

export default function ConnectNavigationBar() {
  const { t } = useTranslation("connect");
  const router = useRouter();
  const { user } = useContext(UserContext);
  const activeSection = getActiveSection((router.asPath || "").split("?")[0]);
  const {
    isAdmin,
    isTeacher,
    isMentor,
    isStudent,
    isScientist,
    isReviewer,
    isSponsor,
    isClassNetworkAdmin,
    adminClassNetworkIds,
  } = useConnectRole();

  const connectOptions = useMemo(() => {
    const items = [
      {
        value: "exploreConnect",
        label: t("exploreConnect", {}, { default: "Explore Connect" }),
        href: "/dashboard/connect",
      },
      {
        value: "savedConnections",
        label: t("savedConnections", {}, { default: "Saved Connections" }),
        href: "/dashboard/connect/my",
      },
    ];
    const canAccessMyProfile =
      !!user?.publicId &&
      (isAdmin ||
        isTeacher ||
        isMentor ||
        isScientist ||
        isClassNetworkAdmin);
    if (canAccessMyProfile) {
      items.push({
        value: "myProfile",
        label: t("myProfile", {}, { default: "My profile" }),
        href: "/dashboard/connect/profile",
      });
    }
    return items;
  }, [
    t,
    user?.publicId,
    isAdmin,
    isTeacher,
    isMentor,
    isScientist,
    isClassNetworkAdmin,
  ]);

  const organizationOptions = useMemo(() => {
    const items = [
      {
        value: "organizations",
        label: t("nav.organizations", {}, { default: "Organizations" }),
        href: "/dashboard/connect/organizations",
      },
    ];
    const canManageOrganization =
      isSponsor ||
      isAdmin ||
      (user?.adminOfOrganizations || []).length > 0;
    if (canManageOrganization) {
      items.push({
        value: "manageOrganization",
        label: t("nav.manageOrganization", {}, {
          default: "Manage organization",
        }),
        href: "/dashboard/connect/manage-organization",
      });
    }
    return items;
  }, [t, user?.adminOfOrganizations, isSponsor, isAdmin]);

  const classNetworkOptions = useMemo(() => {
    const canExploreNetworks = isAdmin || isTeacher || isMentor || isSponsor;
    const canManageNetworks =
      isAdmin || isClassNetworkAdmin || adminClassNetworkIds.length > 0;
    const items = [
      {
        value: "explorePublicNetworks",
        label: t("nav.explorePublicNetwork", {}, {
          default: "Explore public network",
        }),
        href: "/dashboard/connect/networks",
        visible: canExploreNetworks,
      },
      {
        value: "manageNetworks",
        label: t("nav.manageNetwork", {}, { default: "Manage network" }),
        href: "/dashboard/connect/networks?mode=manage",
        visible: canManageNetworks,
      },
    ];

    return items
      .filter((item) => item.visible)
      .map(({ value, label, href }) => ({ value, label, href }));
  }, [
    t,
    isAdmin,
    isTeacher,
    isMentor,
    isSponsor,
    isClassNetworkAdmin,
    adminClassNetworkIds,
  ]);

  const opportunityOptions = useMemo(() => {
    const items = [
      {
        value: "explore",
        label: t("nav.exploreOpportunities", {}, { default: "Explore opportunities" }),
        href: "/dashboard/connect/explore",
        visible: true,
      },
      {
        value: "myOpportunities",
        label: t("nav.myOpportunities", {}, { default: "My opportunities" }),
        href: "/dashboard/sponsor-connect/opportunities",
        visible: isMentor || isAdmin,
      },
      {
        value: "myMatchedStudents",
        label: t("nav.myMatchedStudents", {}, { default: "My matched students" }),
        href: "/dashboard/connect/my-matches",
        visible: isMentor || isAdmin,
      },
      {
        value: "matchingRounds",
        label: t("nav.matchingRounds", {}, { default: "Matching rounds" }),
        href: "/dashboard/connect/rounds",
        visible: isTeacher || isAdmin || isClassNetworkAdmin,
      },
      {
        value: "questionLibrary",
        label: t("nav.questionLibrary", {}, { default: "Question library" }),
        href: "/dashboard/connect/questions",
        visible: isTeacher || isAdmin,
      },
      {
        value: "participate",
        label: t("nav.participate", {}, { default: "Participate" }),
        href: "/dashboard/connect/participate",
        visible: isStudent || isAdmin,
      },
      {
        value: "matches",
        label: t("nav.matches", {}, { default: "Matches" }),
        href: "/dashboard/connect/matches",
        visible: isTeacher || isAdmin || isClassNetworkAdmin,
      },
      {
        value: "reviewQueue",
        label: t("nav.reviewQueue", {}, { default: "Review queue" }),
        href: "/dashboard/connect/review-queue",
        visible: isReviewer || isAdmin,
      },
    ];

    return items
      .filter((item) => item.visible)
      .map(({ value, label, href }) => ({ value, label, href }));
  }, [
    t,
    isAdmin,
    isTeacher,
    isMentor,
    isStudent,
    isReviewer,
    isClassNetworkAdmin,
  ]);

  return (
    <NavigationBar
      aria-label={t("nav.mainNavAriaLabel", {}, { default: "Connect sections" })}
      variant="underline"
      showRule
    >
      <ConnectNavDropdown
        placeholderKey="nav.organizations"
        placeholderDefault="Organizations"
        ariaLabelKey="nav.organizations"
        ariaLabelDefault="Organizations"
        options={organizationOptions}
        active={activeSection === "organizations"}
        icon={<NavDropdownIcon src={CONNECT_NAV_ICONS.organizations} width={22} height={16} />}
      />
      <ConnectNavDropdown
        placeholderKey="nav.classNetworks"
        placeholderDefault="Networks"
        ariaLabelKey="nav.classNetworks"
        ariaLabelDefault="Networks"
        options={classNetworkOptions}
        active={activeSection === "classNetworks"}
        icon={
          <NavDropdownIcon
            src={CONNECT_NAV_ICONS.classNetworks}
            width={16}
            height={16}
          />
        }
      />
      <ConnectNavDropdown
        placeholderKey="nav.opportunities"
        placeholderDefault="Opportunities"
        ariaLabelKey="nav.opportunities"
        ariaLabelDefault="Opportunities"
        options={opportunityOptions}
        active={activeSection === "opportunities"}
        icon={<NavDropdownIcon src={CONNECT_NAV_ICONS.opportunities} width={22} height={16} />}
      />
      <ConnectNavDropdown
        placeholderKey="nav.connect"
        placeholderDefault="Connect"
        ariaLabelKey="nav.connect"
        ariaLabelDefault="Connect"
        options={connectOptions}
        active={activeSection === "connect"}
        icon={<NavDropdownIcon src={CONNECT_NAV_ICONS.connect} width={22} height={16} />}
      />
    </NavigationBar>
  );
}
