import {
  HomeIcon,
  DiscoverIcon,
  ConnectIcon,
  BuilderIcon,
  FeedbackIcon,
  JournalIcon,
  SchoolIcon,
  ConsentFormIcon,
  LessonsIcon,
  DatasetIcon,
  FolderIcon,
  TagsIcon,
  NotificationsIcon,
  FileCopyIcon,
  BriefcaseIcon,
  AssignmentIcon,
} from "../DesignSystem/Icons";

/**
 * Dashboard navigation, described as data rather than markup.
 *
 * Each section renders only the items whose `canView` passes, and a section
 * with no visible items disappears along with its label. `area` matches the
 * `area` route query so the active item can be resolved by comparison; Home is
 * the dashboard root and therefore has no area.
 *
 * `labelKey` is a key in the `navigation` translation namespace. Keys carry an
 * English `fallback` so a locale that has not been updated still renders real
 * text instead of the raw key.
 */

/** Derives the role predicates the sections switch on. */
export function getNavPermissions(user) {
  const permissions = user?.permissions?.map((permission) => permission?.name) ?? [];
  const has = (...names) => names.some((name) => permissions.includes(name));

  const isSponsor = has("SPONSOR");
  const isStudent = has("STUDENT");
  // Roles that manage a class and everything hanging off it.
  const managesClasses = has("ADMIN", "TEACHER", "MENTOR");

  return {
    has,
    isSponsor,
    isStudent,
    managesClasses,
    isAdmin: has("ADMIN"),
    canDevelop: has("ADMIN", "SCIENTIST", "TEACHER", "STUDENT", "MENTOR"),
    canSeeResearch: has("ADMIN", "RESEARCHER"),
    canSeeLessons: has("ADMIN", "TEACHER", "MENTOR", "SCIENTIST"),
  };
}

export const NAV_SECTIONS = [
  {
    id: "main",
    items: [
      {
        id: "home",
        href: "/dashboard",
        area: null,
        labelKey: "home",
        fallback: "Home",
        Icon: HomeIcon,
      },
      {
        id: "discover",
        href: "/dashboard/discover",
        area: "discover",
        labelKey: "discover",
        fallback: "Discover",
        Icon: DiscoverIcon,
      },
      {
        id: "connect",
        href: "/dashboard/connect",
        area: "connect",
        labelKey: "connect",
        fallback: "Connect",
        Icon: ConnectIcon,
      },
    ],
  },
  {
    id: "projects",
    label: { key: "projects", fallback: "Projects" },
    items: [
      {
        id: "develop",
        href: "/dashboard/develop",
        area: "develop",
        labelKey: "dev",
        fallback: "Develop",
        Icon: BuilderIcon,
        canView: (p) => p.canDevelop,
      },
      {
        id: "review",
        href: "/dashboard/review",
        area: "review",
        labelKey: "feedbackCenter",
        fallback: "Feedback Center",
        Icon: FeedbackIcon,
        canView: (p) => p.canDevelop,
      },
      {
        id: "journals",
        href: "/dashboard/journals",
        area: "journals",
        labelKey: "journal",
        fallback: "Journal",
        Icon: JournalIcon,
        canView: (p) => p.isAdmin,
      },
    ],
  },
  // Teacher and student workflows are separate sections so dual-role users
  // see both (e.g. teacher My Classes and student My Classes) instead of one
  // section whose label flips based on permissions.
  {
    id: "teacher",
    label: { key: "teacher", fallback: "Teacher" },
    items: [
      {
        id: "myclasses",
        href: "/dashboard/myclasses",
        area: "myclasses",
        labelKey: "myClasses",
        fallback: "My Classes",
        Icon: SchoolIcon,
        canView: (p) => p.managesClasses,
      },
      {
        id: "irb-teacher",
        href: "/dashboard/irb",
        area: "irb",
        labelKey: "consentProtocol",
        fallback: "Consent Protocol",
        Icon: ConsentFormIcon,
        // Prefer the teacher section when the user also manages classes or
        // sees lessons, so dual-role users do not get a duplicate link.
        canView: (p) => p.managesClasses || p.canSeeLessons,
      },
      {
        id: "boards",
        href: "/dashboard/boards",
        area: "boards",
        labelKey: "boards",
        fallback: "Project Boards",
        Icon: AssignmentIcon,
        canView: (p) => p.isAdmin,
      },
      {
        id: "resources",
        href: "/dashboard/resources",
        area: "resources",
        labelKey: "resources",
        fallback: "Resources",
        Icon: TagsIcon,
        canView: (p) => p.managesClasses,
      },
      {
        id: "lessons",
        href: "/dashboard/lessons",
        area: "lessons",
        labelKey: "lessons",
        fallback: "Lessons",
        Icon: LessonsIcon,
        canView: (p) => p.canSeeLessons,
      },
    ],
  },
  {
    id: "student",
    label: { key: "student", fallback: "Student" },
    items: [
      {
        id: "classes",
        href: "/dashboard/classes",
        area: "classes",
        labelKey: "myClasses",
        fallback: "My Classes",
        Icon: SchoolIcon,
        canView: (p) => p.isStudent,
      },
      {
        id: "irb-student",
        href: "/dashboard/irb",
        area: "irb",
        labelKey: "consentProtocol",
        fallback: "Consent Protocol",
        Icon: ConsentFormIcon,
        canView: (p) => p.isStudent,
      },
    ],
  },
  {
    id: "research",
    label: { key: "researcher", fallback: "Researcher" },
    items: [
      {
        id: "research",
        href: "/dashboard/research",
        area: "research",
        labelKey: "research",
        fallback: "Research",
        Icon: DatasetIcon,
        canView: (p) => p.canSeeResearch,
      },
    ],
  },
  {
    // Not drawn in Figma, but sponsor accounts still need somewhere to go.
    // Route is /dashboard/sponsor-connect to avoid colliding with /dashboard/connect.
    id: "sponsors",
    label: { key: "sponsors", fallback: "Sponsors" },
    items: [
      {
        id: "sponsor-connect",
        href: "/dashboard/sponsor-connect/opportunities",
        area: "sponsor-connect",
        labelKey: "myOpportunities",
        fallback: "My opportunities",
        Icon: BriefcaseIcon,
        canView: (p) => p.isSponsor,
      },
    ],
  },
  {
    id: "admin",
    label: { key: "admin", fallback: "Admin" },
    items: [
      {
        id: "management",
        href: "/dashboard/management",
        area: "management",
        labelKey: "management",
        fallback: "Management",
        Icon: FolderIcon,
        canView: (p) => p.isAdmin,
      },
      {
        id: "tags",
        href: "/dashboard/tags",
        area: "tags",
        labelKey: "tags",
        fallback: "Tags",
        Icon: TagsIcon,
        canView: (p) => p.isAdmin,
      },
      {
        id: "updates",
        href: "/dashboard/updates",
        area: "updates",
        labelKey: "updates",
        fallback: "Updates",
        Icon: NotificationsIcon,
        canView: (p) => p.isAdmin,
      },
      {
        id: "proposals",
        href: "/dashboard/proposals",
        area: "proposals",
        labelKey: "proposalTemplates",
        fallback: "Proposal Templates",
        Icon: FileCopyIcon,
        canView: (p) => p.isAdmin,
      },
    ],
  },
];

/** Resolves a section's label, which may be static or role-dependent. */
export function resolveSectionLabel(section, permissions) {
  if (!section.label) return null;
  return typeof section.label == "function"
    ? section.label(permissions)
    : section.label;
}

/** Drops items the viewer cannot see, then drops sections left with nothing. */
export function visibleSections(permissions) {
  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter(
      (item) => !item.canView || item.canView(permissions),
    ),
  })).filter((section) => section.items.length > 0);
}
