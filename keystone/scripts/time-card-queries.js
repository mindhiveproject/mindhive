/**
 * Admin-vs-user timing for the queries a project-board card fires on open.
 *
 * Admins skip the list access filters in access.ts (assignmentQueryFilter,
 * homeworkQueryFilter, ...); regular users go through them. Running the same
 * queries for the same card as both and comparing the timings shows whether
 * those filters are what makes card opening slow.
 *
 * Read-only: it only logs in and runs queries.
 *
 * From the keystone directory:
 *
 *   GQL_URL=https://backend.mindhive.science/api/graphql \
 *   CARD_ID=<proposalCard id> \
 *   ADMIN_EMAIL=... ADMIN_PASSWORD=... \
 *   USER_EMAIL=...  USER_PASSWORD=... \
 *   node scripts/time-card-queries.js
 *
 * Accounts that sign in with Google have no password: pass the value of the
 * browser's `keystonejs-session` cookie instead as ADMIN_COOKIE / USER_COOKIE.
 * The "user" account should be a student or teacher who can see the board.
 *
 * Optional: RUNS (default 5) timed runs per query, after one warm-up run.
 *
 * The query bodies mirror frontend/components/Queries/{Proposal,Homework,
 * Milestone}.js; keep them roughly in sync if those change a lot.
 */

const GQL_URL = process.env.GQL_URL || "http://localhost:4444/api/graphql";
const CARD_ID = process.env.CARD_ID;
const RUNS = Number(process.env.RUNS || 5);

if (!CARD_ID) {
  console.error("CARD_ID is required (see the header of this file).");
  process.exit(1);
}

const GET_CARD_CONTENT = `
  query GET_CARD_CONTENT($id: ID!) {
    proposalCard(where: { id: $id }) {
      id type title publicId description internalContent revisedContent
      content comment settings lastTimeEdited shareType
      milestone {
        id key scope actionCardType reviewStage statusTarget
        legacyBoardStatusField legacyOpenForCommentsField logEventName
        formDefinitionKeyPattern title description
        formDefinition { id key scope status }
      }
      assignedTo { id username }
      isEditedBy { username }
      resources {
        id title content settings isPublic
        parent { id } author { id } collaborators { id }
      }
      assignments { id title content public }
      tasks { id title slug }
      studies { id title slug }
      section { id title }
    }
  }
`;

const CARD_BOARD = `
  query CARD_BOARD($id: ID!) {
    proposalCard(where: { id: $id }) {
      assignments { id }
      section { board { id } }
    }
  }
`;

const RESOLVE_MILESTONES_FOR_BOARD = `
  query RESOLVE_MILESTONES_FOR_BOARD($boardId: ID!) {
    resolveMilestonesForBoard(boardId: $boardId) {
      id key title scope actionCardType reviewStage statusTarget position
      actionCards { id publicId type title }
    }
  }
`;

const HOMEWORKS_FOR_ASSIGNMENTS = `
  query GET_ALL_HOMEWORK_FOR_CARD_ASSIGNMENTS($assignmentIds: [ID!]!) {
    homeworks(where: { assignment: { id: { in: $assignmentIds } } }) {
      id settings assignment { id } author { id username }
    }
  }
`;

// The board query, trimmed to the parts that hit the database hardest.
const PROPOSAL_QUERY = `
  query PROPOSAL_QUERY($id: ID!) {
    proposalBoard(where: { id: $id }) {
      id title settings
      usedInClass { id code settings creator { id } teachingTeam { id } mentors { id } }
      collaborators { id username }
      study { id title collaborators { id username } classes { id } }
      sections {
        id title position
        cards {
          id publicId type title content revisedContent comment settings position
          milestone { id key }
          assignedTo { id username }
          isEditedBy { username }
        }
      }
    }
  }
`;

const SIGNIN = `
  mutation SIGNIN($email: String!, $password: String!) {
    authenticateProfileWithPassword(email: $email, password: $password) {
      ... on ProfileAuthenticationWithPasswordSuccess { item { id } }
      ... on ProfileAuthenticationWithPasswordFailure { message }
    }
  }
`;

async function gql(query, variables, cookie) {
  const start = performance.now();
  const res = await fetch(GQL_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(cookie ? { cookie: `keystonejs-session=${cookie}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });
  const text = await res.text();
  const ms = performance.now() - start;
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  return { json, ms, bytes: Buffer.byteLength(text), res };
}

async function login(label, email, password, cookie) {
  if (cookie) return cookie;
  if (!email || !password) {
    throw new Error(
      `${label}: set ${label.toUpperCase()}_EMAIL + ${label.toUpperCase()}_PASSWORD or ${label.toUpperCase()}_COOKIE`,
    );
  }
  const { json, res } = await gql(SIGNIN, { email, password });
  const result = json?.data?.authenticateProfileWithPassword;
  if (!result?.item?.id) {
    throw new Error(`${label}: login failed (${result?.message || JSON.stringify(json?.errors)})`);
  }
  const setCookies = res.headers.getSetCookie?.() || [res.headers.get("set-cookie") || ""];
  for (const c of setCookies) {
    const m = c.match(/keystonejs-session=([^;]+)/);
    if (m && m[1]) return m[1];
  }
  throw new Error(`${label}: logged in but no keystonejs-session cookie came back`);
}

async function time(query, variables, cookie) {
  const first = await gql(query, variables, cookie); // warm-up, not counted
  if (first.json.errors) {
    return { error: first.json.errors.map((e) => e.message).join("; ") };
  }
  const times = [];
  let bytes = first.bytes;
  for (let i = 0; i < RUNS; i += 1) {
    const r = await gql(query, variables, cookie);
    times.push(r.ms);
    bytes = r.bytes;
  }
  times.sort((a, b) => a - b);
  return { median: times[Math.floor(times.length / 2)], max: times[times.length - 1], bytes };
}

function fmt(r) {
  if (!r) return "-";
  if (r.error) return `ERROR: ${r.error}`;
  return `${Math.round(r.median)}ms (max ${Math.round(r.max)}) ${(r.bytes / 1024).toFixed(1)}KB`;
}

async function main() {
  const admin = await login("admin", process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD, process.env.ADMIN_COOKIE);
  const user = await login("user", process.env.USER_EMAIL, process.env.USER_PASSWORD, process.env.USER_COOKIE);

  // Look the card's board and assignments up as admin so both sides query the same ids.
  const { json } = await gql(CARD_BOARD, { id: CARD_ID }, admin);
  const card = json?.data?.proposalCard;
  if (!card) throw new Error(`Card ${CARD_ID} not found (${JSON.stringify(json?.errors)})`);
  const boardId = card.section?.board?.id;
  const assignmentIds = (card.assignments || []).map((a) => a.id);

  const cases = [
    ["GET_CARD_CONTENT", GET_CARD_CONTENT, { id: CARD_ID }],
    boardId && ["RESOLVE_MILESTONES_FOR_BOARD", RESOLVE_MILESTONES_FOR_BOARD, { boardId }],
    assignmentIds.length && ["homeworks (card assignments)", HOMEWORKS_FOR_ASSIGNMENTS, { assignmentIds }],
    boardId && ["PROPOSAL_QUERY (board)", PROPOSAL_QUERY, { id: boardId }],
  ].filter(Boolean);

  console.log(`${GQL_URL}  card=${CARD_ID} board=${boardId || "-"} assignments=${assignmentIds.length}  runs=${RUNS}\n`);
  console.log(`${"query".padEnd(32)}${"admin".padEnd(36)}user`);
  for (const [name, query, variables] of cases) {
    const a = await time(query, variables, admin);
    const u = await time(query, variables, user);
    console.log(`${name.padEnd(32)}${fmt(a).padEnd(36)}${fmt(u)}`);
  }
  console.log(
    "\nUser much slower than admin on the same query → the access filters are the cost." +
      "\nBoth slow → look at payload size (KB) or the database itself.",
  );
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
