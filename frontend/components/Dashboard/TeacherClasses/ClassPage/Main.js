import { useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";
import Link from "next/link";

import Header from "./Header";
import ClassStudents from "./Students";
import ClassMentors from "./Mentors";
import ClassStudies from "./Studies";
import ClassProjects from "./Projects";
import ClassAssignments from "./Assignments/Main";
import ClassResources from "./Resources/Main";
import ClassSettings from "./Settings";

import { GET_CLASS } from "../../../Queries/Classes";
import RestrictedAccess from "../../../Global/Restricted";

import StyledClass from "../../../styles/StyledClass";

// creating and customizing project boards for a class
import ProjectBoard from "./ProjectBoard/Main";

import Dashboard from "./Dashboard/Main";

const CLASS_PAGE_NAV_ITEMS = [
  {
    value: "students",
    labelKey: "main.students",
    iconSrc: "/assets/icons/profile/people.svg",
  },
  {
    value: "dashboard",
    labelKey: "main.dashboard",
    iconSrc: "/assets/icons/visualize/bar_chart.svg",
  },
  {
    value: "projects",
    labelKey: "main.projects",
    iconSrc: "/assets/icons/project.svg",
  },
  {
    value: "mentors",
    labelKey: "main.mentors",
    iconSrc: "/assets/icons/user.svg",
  },
  {
    value: "studies",
    labelKey: "main.studies",
    iconSrc: "/assets/icons/education.svg",
  },
  {
    value: "assignments",
    labelKey: "main.assignments",
    iconSrc: "/assets/icons/document.svg",
  },
  {
    value: "resources",
    labelKey: "main.resources",
    iconSrc: "/assets/icons/visualize/folder_open.svg",
  },
  {
    value: "settings",
    labelKey: "main.settings",
    iconSrc: "/assets/icons/settings.svg",
  },
];

export default function ClassPage({ code, user, query }) {
  const { t } = useTranslation("classes");
  const page = query?.page || "students";

  const { data, loading, error } = useQuery(GET_CLASS, {
    variables: { code },
  });

  const myclass = data?.class || { title: "", description: "" };

  if (page === "board") {
    return <ProjectBoard myclass={myclass} user={user} query={query} />;
  }

  return (
    <StyledClass>
      <RestrictedAccess
        userCanAccess={[
          ...user?.teacherIn.map((c) => c?.id),
          ...user?.mentorIn.map((c) => c?.id),
        ]}
        whatToAccess={myclass?.id}
      >
        <div>
          <Header user={user} myclass={myclass} />
          <nav className="classPageNav" aria-label={t("main.classSectionsNav")}>
            <div className="secondLine">
              <div className="menu">
                {CLASS_PAGE_NAV_ITEMS.map((item) => (
                  <Link
                    key={item.value}
                    href={{
                      pathname: `/dashboard/myclasses/${code}`,
                      query: { page: item.value },
                    }}
                    aria-current={page === item.value ? "page" : undefined}
                  >
                    <div
                      className={
                        page === item.value
                          ? "menuTitle selectedMenuTitle"
                          : "menuTitle"
                      }
                    >
                      <div className="titleWithIcon">
                        {/* <img src={item.iconSrc} alt="" /> */}
                        <p>{t(item.labelKey)}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </nav>

          <div>
            {page === "students" && (
              <ClassStudents myclass={myclass} user={user} query={query} />
            )}
          </div>
          <div>
            {page === "dashboard" && (
              <Dashboard myclass={myclass} user={user} query={query} />
            )}
          </div>
          <div>
            {page === "mentors" && (
              <ClassMentors myclass={myclass} user={user} query={query} />
            )}
          </div>
          <div>
            {page === "projects" && (
              <ClassProjects myclass={myclass} user={user} query={query} />
            )}
          </div>
          <div>
            {page === "studies" && (
              <ClassStudies myclass={myclass} user={user} query={query} />
            )}
          </div>
          <div>
            {page === "assignments" && (
              <ClassAssignments myclass={myclass} user={user} query={query} />
            )}
          </div>
          <div>
            {page === "resources" && (
              <ClassResources myclass={myclass} user={user} query={query} />
            )}
          </div>
          <div>
            {page === "settings" && (
              <ClassSettings myclass={myclass} user={user} query={query} />
            )}
          </div>
        </div>
      </RestrictedAccess>
    </StyledClass>
  );
}
