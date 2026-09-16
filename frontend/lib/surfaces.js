/**
 * The surface registry — a written-down list of the places this product has.
 *
 * A "surface" is a named region someone could sensibly file a complaint about:
 * the proposal board, the task bank, the participant landing page. It exists
 * because neither a URL nor a DOM selector survives as a ticket anchor here.
 * A URL cannot: `/dashboard/[area]/[selector]` alone serves 24 different areas,
 * ids in the path belong to one user's board, and eleven locales fork every
 * path. A CSS selector cannot: styled-components class names are generated.
 *
 * A surface key survives both, because it is declared rather than derived.
 *
 * HOW A SURFACE IS RESOLVED
 *
 * From the route pattern Next already gives us — `router.pathname` plus, for
 * the two fan-out routes, `query.area` and sometimes `query.selector`. The
 * route *pattern* is stable even though the URL instance is not, so no DOM
 * markup is required for screen-level anchoring and every surface below is
 * addressable today.
 *
 * `data-mh-surface="<key>"` markers are the optional refinement, for when one
 * screen holds several panels worth distinguishing. Add a marker only where
 * the distinction is real: one per meaningful panel, never one per button.
 * Forty entries stay accurate; four hundred rot within a quarter and take the
 * trust in this file with them.
 *
 * KEEPING IT HONEST
 *
 * `scripts/check-surfaces.mjs` (npm run lint:surfaces) fails when a page route
 * exists with no surface covering it, when a surface names a route that does
 * not exist, or when a `data-mh-surface` marker names a key not listed here.
 * So adding a page without registering its surface breaks the check rather
 * than silently leaving a hole.
 *
 * `figmaNodeId` is filled in as Figma frames are captured per surface. `null`
 * means "no design on record", which is itself worth knowing.
 */

/**
 * @typedef {Object} Surface
 * @property {string} key        Stable id. Never rename — tickets point at it.
 * @property {string} label      Human name, as it appears in the ticket UI.
 * @property {string[]} routes   Next route patterns (`router.pathname`) this covers.
 * @property {string[]} [areas]  For fan-out routes, the `query.area` values this covers.
 * @property {string[]} [selectors] Narrows further by `query.selector`.
 * @property {string} root       Where the code lives, for whoever picks the ticket up.
 * @property {string|null} figmaNodeId  Figma frame captured from this surface, if any.
 */

const DASHBOARD = ["/dashboard/[area]", "/dashboard/[area]/[selector]"];
const BUILDER = ["/builder/[area]", "/builder/[area]/[selector]"];

/** @type {Surface[]} */
export const SURFACES = [
  // ---- Public / unauthenticated ------------------------------------------
  {
    key: "front.home",
    label: "Front page",
    routes: ["/", "/discover", "/discover/study", "/discover/task"],
    root: "components/Front/Main",
    figmaNodeId: null,
  },
  {
    key: "front.teachers",
    label: "Teachers information page",
    routes: ["/teachers"],
    root: "components/Front/Teachers/Main",
    figmaNodeId: null,
  },
  {
    key: "front.docs",
    label: "Documentation article",
    routes: ["/docs/[slug]"],
    root: "components/Documents/Main",
    figmaNodeId: null,
  },

  // ---- Auth ---------------------------------------------------------------
  {
    key: "auth.login",
    label: "Log in",
    routes: ["/login"],
    root: "components/Auth/Login",
    figmaNodeId: null,
  },
  {
    key: "auth.request-reset",
    label: "Request a password reset",
    routes: ["/login/requestreset"],
    root: "components/Auth/RequestReset",
    figmaNodeId: null,
  },
  {
    key: "auth.reset",
    label: "Set a new password",
    routes: ["/login/reset"],
    root: "components/Auth/Reset",
    figmaNodeId: null,
  },
  {
    key: "auth.signup",
    label: "Sign up",
    routes: ["/signup"],
    root: "components/Auth/Sign",
    figmaNodeId: null,
  },
  {
    key: "auth.signup-role",
    label: "Sign up as a specific role",
    routes: ["/signup/[role]"],
    root: "components/Auth/SignupRoles/Role",
    figmaNodeId: null,
  },

  // ---- Participation (public, and never screenshotted — see TicketOverlay)
  {
    key: "participate.landing",
    label: "Study landing page for participants",
    routes: ["/participate/[step]", "/studies/[name]"],
    root: "components/Studies/Landing/Main",
    figmaNodeId: null,
  },
  {
    key: "participate.join",
    label: "Join a study",
    routes: ["/join/[step]"],
    root: "components/Studies/Join/Main",
    figmaNodeId: null,
  },
  {
    key: "participate.task",
    label: "Task landing page",
    routes: ["/tasks/[slug]"],
    root: "components/Tasks/Landing/Main",
    figmaNodeId: null,
  },
  {
    key: "participate.preview",
    label: "Task preview runner",
    routes: ["/preview/[type]/[id]"],
    root: "components/Tasks/Preview/Main",
    figmaNodeId: null,
  },

  // ---- Dashboard ----------------------------------------------------------
  {
    key: "dashboard.home",
    label: "Dashboard home",
    routes: ["/dashboard"],
    root: "components/Dashboard/Home/Main",
    figmaNodeId: null,
  },
  {
    key: "dashboard.discover",
    label: "Discover",
    routes: DASHBOARD,
    areas: ["discover"],
    root: "components/Dashboard/Discover/Main",
    figmaNodeId: null,
  },
  {
    key: "dashboard.connect",
    label: "Connect",
    routes: DASHBOARD,
    areas: ["connect"],
    root: "components/Dashboard/Connect/Main",
    figmaNodeId: null,
  },
  {
    key: "dashboard.sponsor-connect",
    label: "Sponsor Connect",
    routes: DASHBOARD,
    areas: ["sponsor-connect"],
    root: "components/Dashboard/SponsorConnect/Main",
    figmaNodeId: null,
  },
  {
    key: "dashboard.develop",
    label: "Develop — study and task bank",
    routes: DASHBOARD,
    areas: ["develop"],
    root: "components/Dashboard/Develop/Main",
    figmaNodeId: null,
  },
  {
    key: "dashboard.review",
    label: "Review",
    routes: DASHBOARD,
    areas: ["review"],
    root: "components/Dashboard/Review/Main",
    figmaNodeId: null,
  },
  {
    key: "dashboard.journals",
    label: "Journals",
    routes: DASHBOARD,
    areas: ["journals"],
    root: "components/Dashboard/Journal/Main",
    figmaNodeId: null,
  },
  {
    key: "dashboard.boards",
    label: "Proposal boards",
    routes: DASHBOARD,
    areas: ["boards"],
    root: "components/Dashboard/Boards/Main",
    figmaNodeId: null,
  },
  {
    key: "dashboard.myclasses",
    label: "My classes (teacher view)",
    routes: DASHBOARD,
    areas: ["myclasses"],
    root: "components/Dashboard/TeacherClasses/Main",
    figmaNodeId: null,
  },
  {
    key: "dashboard.classes",
    label: "My classes (student view)",
    routes: DASHBOARD,
    areas: ["classes"],
    root: "components/Dashboard/StudentClasses/Main",
    figmaNodeId: null,
  },
  {
    key: "dashboard.assignments",
    label: "Assignments",
    routes: DASHBOARD,
    areas: ["assignments"],
    root: "components/Dashboard/Assignment/Main",
    figmaNodeId: null,
  },
  {
    key: "dashboard.research",
    label: "Research",
    routes: DASHBOARD,
    areas: ["research"],
    root: "components/Dashboard/Research/Main",
    figmaNodeId: null,
  },
  {
    key: "dashboard.proposals",
    label: "Proposal templates",
    routes: DASHBOARD,
    areas: ["proposals"],
    root: "components/Dashboard/Proposals/Main",
    figmaNodeId: null,
  },
  {
    key: "dashboard.resources",
    label: "Resources",
    routes: DASHBOARD,
    areas: ["resources"],
    root: "components/Dashboard/Resources/Main",
    figmaNodeId: null,
  },
  {
    key: "dashboard.lessons",
    label: "Lessons",
    routes: DASHBOARD,
    areas: ["lessons"],
    root: "components/Dashboard/Lessons/Main",
    figmaNodeId: null,
  },
  {
    key: "dashboard.irb",
    label: "IRB and consent",
    routes: DASHBOARD,
    areas: ["irb"],
    root: "components/Dashboard/Consent/Main",
    figmaNodeId: null,
  },
  {
    key: "dashboard.settings",
    label: "Settings",
    routes: DASHBOARD,
    areas: ["settings"],
    root: "components/Dashboard/Settings/Router",
    figmaNodeId: null,
  },
  {
    key: "dashboard.profile",
    label: "Own profile",
    routes: DASHBOARD,
    areas: ["profile"],
    root: "components/Dashboard/Profile/Router",
    figmaNodeId: null,
  },
  {
    key: "dashboard.profile.create",
    label: "Create a profile",
    routes: ["/dashboard/profile/create"],
    root: "components/Dashboard/Profile/CreateProfile",
    figmaNodeId: null,
  },
  {
    key: "dashboard.people",
    label: "Students and mentors directory",
    routes: DASHBOARD,
    areas: ["students", "mentors"],
    root: "components/Dashboard/UserPage/Main",
    figmaNodeId: null,
  },
  {
    key: "users.profile",
    label: "Public user profile",
    routes: ["/users/[id]"],
    root: "components/User/Main",
    figmaNodeId: null,
  },

  // ---- Dashboard, admin-only areas ---------------------------------------
  {
    key: "dashboard.management",
    label: "Management (admin)",
    routes: DASHBOARD,
    areas: ["management"],
    root: "components/Dashboard/Management/Main",
    figmaNodeId: null,
  },
  {
    key: "dashboard.admin-forms",
    label: "Form definitions (admin)",
    routes: DASHBOARD,
    areas: ["admin-forms"],
    root: "components/Dashboard/Admin/Forms/Main",
    figmaNodeId: null,
  },
  {
    key: "dashboard.admin-milestones",
    label: "Milestones (admin)",
    routes: DASHBOARD,
    areas: ["admin-milestones"],
    root: "components/Dashboard/Admin/Milestones/Main",
    figmaNodeId: null,
  },
  {
    key: "dashboard.tags",
    label: "Tags (admin)",
    routes: DASHBOARD,
    areas: ["tags"],
    root: "components/Dashboard/Tags/Main",
    figmaNodeId: null,
  },
  {
    key: "dashboard.updates",
    label: "Notifications and updates (admin)",
    routes: DASHBOARD,
    areas: ["updates"],
    root: "components/Dashboard/Updates/Main",
    figmaNodeId: null,
  },
  {
    key: "dashboard.tickets",
    label: "Ticket board (admin)",
    routes: DASHBOARD,
    areas: ["tickets"],
    root: "components/Dashboard/Tickets/Main",
    figmaNodeId: null,
  },

  // ---- Builder ------------------------------------------------------------
  {
    key: "builder.projects.start",
    label: "Start a new project",
    routes: ["/builder/[area]/[selector]"],
    areas: ["projects"],
    selectors: ["start"],
    root: "components/Builder/Project/New/Start",
    figmaNodeId: null,
  },
  {
    key: "builder.projects",
    label: "Project builder",
    routes: BUILDER,
    areas: ["projects"],
    root: "components/Builder/Project/Main",
    figmaNodeId: null,
  },
  {
    key: "builder.studies.new",
    label: "New study",
    routes: ["/builder/[area]/[selector]"],
    areas: ["studies"],
    selectors: ["add"],
    root: "components/Builder/Study/New/Main",
    figmaNodeId: null,
  },
  {
    key: "builder.studies",
    label: "Study builder",
    routes: BUILDER,
    areas: ["studies", "cloneofstudy"],
    root: "components/Builder/Study/Main",
    figmaNodeId: null,
  },
  {
    key: "builder.component.add",
    label: "Add a task, survey or block",
    routes: ["/builder/[area]/[selector]"],
    areas: ["tasks", "surveys", "blocks"],
    selectors: ["add", "addexternal"],
    root: "components/Builder/Component/Add",
    figmaNodeId: null,
  },
  {
    key: "builder.component.edit",
    label: "Task, survey or block builder",
    routes: BUILDER,
    areas: ["tasks", "surveys", "blocks"],
    root: "components/Builder/Component/Edit",
    figmaNodeId: null,
  },
  {
    key: "builder.component.clone",
    label: "Clone a task, survey or block",
    routes: BUILDER,
    areas: ["cloneoftask", "cloneofsurvey", "cloneofblock"],
    root: "components/Builder/Component/Clone",
    figmaNodeId: null,
  },

  // ---- Standalone ---------------------------------------------------------
  {
    key: "proposals.export",
    label: "Proposal PDF export",
    routes: ["/proposals/[id]"],
    root: "components/Proposal/PDF/Export",
    figmaNodeId: null,
  },
];

/** Every key, for validation and for the ticket board's grouping. */
export const SURFACE_KEYS = SURFACES.map((surface) => surface.key);

const BY_KEY = new Map(SURFACES.map((surface) => [surface.key, surface]));

/** @returns {Surface|null} */
export function getSurface(key) {
  return BY_KEY.get(key) ?? null;
}

/**
 * Resolve the surface for a route. Pass Next's `router.pathname` (the pattern,
 * not the filled-in URL) and `router.query`.
 *
 * Surfaces that name `selectors` win over ones that don't, so
 * `/builder/projects/start` resolves to the start screen rather than the
 * builder it sits in front of.
 *
 * @returns {Surface|null} null when nothing covers the route — which
 *   `check-surfaces.mjs` treats as a failure rather than a shrug.
 */
export function surfaceForRoute(pathname, query = {}) {
  const area = query.area ?? null;
  const selector = query.selector ?? null;

  const matches = SURFACES.filter((surface) => {
    if (!surface.routes.includes(pathname)) return false;
    if (surface.areas && !surface.areas.includes(area)) return false;
    if (surface.selectors && !surface.selectors.includes(selector)) return false;
    return true;
  });

  if (matches.length === 0) return null;
  // Most specific first: selector-narrowed, then area-narrowed, then bare.
  matches.sort(
    (a, b) =>
      (b.selectors ? 2 : 0) + (b.areas ? 1 : 0) - ((a.selectors ? 2 : 0) + (a.areas ? 1 : 0))
  );
  return matches[0];
}
