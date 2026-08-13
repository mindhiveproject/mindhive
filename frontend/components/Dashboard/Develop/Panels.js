import Link from "next/link";
import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";

import Navbar, { NavbarItem } from "../../DesignSystem/Navbar";
import DevelopProjectBank from "../../Projects/Bank/Develop";
import DevelopStudyBank from "../../Studies/Bank/Develop";
import DevelopTaskBank from "../../Tasks/Bank/Develop";
import DevelopVisualsBank from "./Visuals/Main";

/**
 * The design system's 24px inset suits nav that sits at the window edge; these
 * tabs sit inside the page body, so they run flush with the heading above them.
 */
const SectionNavbar = styled(Navbar)`
  .navbar-container {
    padding: 4px 0px;
  }
`;

export default function Panels({ query, user }) {
  const { t } = useTranslation("builder");
  const { selector } = query;

  const userPermissions = user.permissions.map(
    (permission) => permission?.name
  );

  // Visuals is still a placeholder section, so it stays behind ADMIN for now.
  const isAdmin = userPermissions.includes("ADMIN");

  // choose default selector for user dependent on user permissions
  const selectorForUser = userPermissions.includes("SCIENTIST")
    ? selector || "studies"
    : selector || "projects";

  return (
    <>
      <SectionNavbar
        variant="underline"
        id="myPanel"
        aria-label={t("developSections", {}, { default: "Develop sections" })}
      >
        <NavbarItem
          as={Link}
          href="/dashboard/develop/projects"
          selected={selectorForUser === "projects"}
        >
          {t("myProjects")}
        </NavbarItem>

        <NavbarItem
          as={Link}
          href="/dashboard/develop/studies"
          selected={selectorForUser === "studies"}
        >
          {t("myStudies")}
        </NavbarItem>

        <NavbarItem
          as={Link}
          href="/dashboard/develop/tasks"
          selected={selectorForUser === "tasks"}
        >
          {t("myTasks")}
        </NavbarItem>

        <NavbarItem
          as={Link}
          href="/dashboard/develop/surveys"
          selected={selectorForUser === "surveys"}
        >
          {t("mySurveys")}
        </NavbarItem>

        <NavbarItem
          as={Link}
          href="/dashboard/develop/blocks"
          selected={selectorForUser === "blocks"}
        >
          {t("myBlocks")}
        </NavbarItem>

        {isAdmin && (
          <NavbarItem
            as={Link}
            href="/dashboard/develop/visuals"
            selected={selectorForUser === "visuals"}
          >
            {t("myVisuals", {}, { default: "Visuals" })}
          </NavbarItem>
        )}
      </SectionNavbar>

      {selectorForUser == "projects" && <DevelopProjectBank user={user} />}

      {selectorForUser == "studies" && <DevelopStudyBank user={user} />}

      {selectorForUser == "tasks" && (
        <DevelopTaskBank user={user} taskType="TASK" />
      )}

      {selectorForUser == "surveys" && (
        <DevelopTaskBank user={user} taskType="SURVEY" />
      )}

      {selectorForUser == "blocks" && (
        <DevelopTaskBank user={user} taskType="BLOCK" />
      )}

      {isAdmin && selectorForUser == "visuals" && <DevelopVisualsBank />}
    </>
  );
}
