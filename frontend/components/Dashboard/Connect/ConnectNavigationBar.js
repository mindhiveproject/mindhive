import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";

import DropdownSelect from "../../DesignSystem/DropdownSelect";
import useConnectRole from "./useConnectRole";

const NAV_DROPDOWN_TRIGGER_STYLE = {
  backgroundColor: "#F6F9F8",
  border: "2px solid #E6E6E6",
  fontWeight: 600,
  fontSize: "16px",
  color: "#5D5763",
};

const NAV_CONNECT_DROPDOWN_TRIGGER_STYLE = {
  ...NAV_DROPDOWN_TRIGGER_STYLE,
  color: "#171717",
  border: "2px solid #A1A1A1",
};

const CONNECT_NAV_ICONS = {
  organizations: "/assets/connect/building.svg",
  opportunities: "/assets/connect/magnifier.svg",
  connect: "/assets/connect/globe.svg",
};

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

const NavigationBar = styled.nav`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  position: sticky;
  top: 0;
  background: rgba(247, 249, 248, 0.8);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(12px);
  z-index: 10;
  padding-top: 16px;
  padding-bottom: 16px;
  padding-inline: clamp(16px, 6vw, 64px);

  a {
    text-decoration: none;
  }
`;

function ConnectNavDropdown({
  placeholderKey,
  placeholderDefault,
  options,
  ariaLabelKey,
  ariaLabelDefault,
  triggerStyle = NAV_DROPDOWN_TRIGGER_STYLE,
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
    <DropdownSelect
      value={value}
      options={options}
      onChange={handleChange}
      fitContent
      placeholder={t(placeholderKey, {}, { default: placeholderDefault })}
      ariaLabel={t(ariaLabelKey, {}, { default: ariaLabelDefault })}
      triggerStyle={triggerStyle}
      icon={icon}
    />
  );
}

export default function ConnectNavigationBar() {
  const { t } = useTranslation("connect");
  const { isAdmin, isTeacher, isMentor, isStudent, isReviewer } =
    useConnectRole();

  const connectOptions = useMemo(
    () => [
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
    ],
    [t],
  );

  const organizationOptions = useMemo(
    () => [
      {
        value: "organizations",
        label: t("nav.organizations", {}, { default: "Organizations" }),
        href: "/dashboard/connect/organizations",
      },
    ],
    [t],
  );

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
        href: "/dashboard/connect/opportunities",
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
        visible: isTeacher || isAdmin,
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
        visible: isTeacher || isAdmin,
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
  }, [t, isAdmin, isTeacher, isMentor, isStudent, isReviewer]);

  return (
    <NavigationBar
      aria-label={t("nav.mainNavAriaLabel", {}, { default: "Connect sections" })}
    >
      <ConnectNavDropdown
        placeholderKey="nav.organizations"
        placeholderDefault="Organizations"
        ariaLabelKey="nav.organizations"
        ariaLabelDefault="Organizations"
        options={organizationOptions}
        icon={<NavDropdownIcon src={CONNECT_NAV_ICONS.organizations} width={22} height={16} />}
      />
      <ConnectNavDropdown
        placeholderKey="nav.opportunities"
        placeholderDefault="Opportunities"
        ariaLabelKey="nav.opportunities"
        ariaLabelDefault="Opportunities"
        options={opportunityOptions}
        icon={<NavDropdownIcon src={CONNECT_NAV_ICONS.opportunities} width={22} height={16} />}
      />
      <ConnectNavDropdown
        placeholderKey="nav.connect"
        placeholderDefault="Connect"
        ariaLabelKey="nav.connect"
        ariaLabelDefault="Connect"
        options={connectOptions}
        triggerStyle={NAV_CONNECT_DROPDOWN_TRIGGER_STYLE}
        icon={<NavDropdownIcon src={CONNECT_NAV_ICONS.connect} width={22} height={16} />}
      />
    </NavigationBar>
  );
}
