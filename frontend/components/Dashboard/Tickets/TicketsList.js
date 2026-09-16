import { useContext, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useQuery } from "@apollo/client";
import styled from "styled-components";

import { GET_TICKETS } from "../../Queries/Ticket";
import { SURFACES, getSurface } from "../../../lib/surfaces";
import BeehiveLoading from "../../DesignSystem/BeehiveLoading";
import { UserContext } from "../../Global/Authorized";

/**
 * The board, grouped by surface rather than by date.
 *
 * Grouping by surface is the point: it makes the board read as a map of the
 * product instead of a feed. It also surfaces the thing a date-ordered list
 * hides — which parts of the platform have nothing filed against them at all,
 * and which have piled up.
 */

const OPEN_STATUSES = ["OPEN", "ACCEPTED", "IN_PROGRESS"];

const STATUS_LABELS = {
  OPEN: "Open",
  ACCEPTED: "Accepted",
  IN_PROGRESS: "In progress",
  SHIPPED: "Shipped",
  WONTFIX: "Won't fix",
};

const KIND_LABELS = {
  BUG: "Bug",
  DESIGN_DRIFT: "Design drift",
  MISSING: "Missing",
  COPY: "Copy",
  IDEA: "Idea",
};

/**
 * Areas are the first segment of a surface key. `dashboard` alone holds 26
 * surfaces, so area narrows and the surface filter picks one out of it.
 */
const AREA_LABELS = {
  front: "Public site",
  auth: "Sign-in",
  participate: "Participant",
  dashboard: "Dashboard",
  users: "Profiles",
  builder: "Builder",
  proposals: "Proposals",
};

const areaOf = (surfaceKey) => surfaceKey?.split(".")[0] ?? "";

const STATUS_FILTERS = {
  open: { label: "Open", test: (s) => OPEN_STATUSES.includes(s) },
  resolved: { label: "Resolved", test: (s) => !OPEN_STATUSES.includes(s) },
  all: { label: "All", test: () => true },
};

/**
 * Filters live in the URL, not component state, so a filtered view survives a
 * reload and can be sent to someone as a link. `area` is taken — it is the
 * /dashboard/[area] route segment, "tickets" here — so the area filter is
 * `group`.
 */
const FILTER_KEYS = ["group", "surface", "kind", "status", "who", "q"];

/** Surface order follows the registry, so the board reads in product order. */
const REGISTRY_ORDER = new Map(SURFACES.map((surface, index) => [surface.key, index]));

export default function TicketsList() {
  const router = useRouter();
  const { user } = useContext(UserContext);
  const { data, loading, error } = useQuery(GET_TICKETS, {
    fetchPolicy: "cache-and-network",
  });

  const filters = {
    group: router.query.group ?? "",
    surface: router.query.surface ?? "",
    kind: router.query.kind ?? "",
    status: router.query.status ?? "open",
    who: router.query.who ?? "",
    q: router.query.q ?? "",
  };

  /** Update one filter in the URL without a navigation or a scroll jump. */
  const setFilter = (key, value) => {
    const next = { ...router.query, [key]: value };
    // Changing area invalidates a surface picked from a different area.
    if (key === "group" && value && areaOf(next.surface) !== value) delete next.surface;
    for (const k of FILTER_KEYS) if (next[k] === "" || next[k] == null) delete next[k];
    if (next.status === "open") delete next.status; // the default, kept out of links
    router.replace({ pathname: router.pathname, query: next }, undefined, {
      shallow: true,
      scroll: false,
    });
  };

  const clearFilters = () => {
    const next = { ...router.query };
    for (const k of FILTER_KEYS) delete next[k];
    router.replace({ pathname: router.pathname, query: next }, undefined, {
      shallow: true,
      scroll: false,
    });
  };

  const allTickets = data?.tickets ?? [];

  // People who currently hold something, for the "who" filter — derived from
  // the tickets rather than a separate query, so it only lists real claims.
  const claimants = useMemo(() => {
    const byId = new Map();
    for (const t of allTickets) if (t.assignee) byId.set(t.assignee.id, t.assignee.username);
    return [...byId.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [allTickets]);

  const surfacesInUse = useMemo(() => {
    const keys = new Set(allTickets.map((t) => t.surface));
    return [...keys]
      .filter((k) => !filters.group || areaOf(k) === filters.group)
      .sort((a, b) => (REGISTRY_ORDER.get(a) ?? 1e9) - (REGISTRY_ORDER.get(b) ?? 1e9));
  }, [allTickets, filters.group]);

  const areasInUse = useMemo(
    () => [...new Set(allTickets.map((t) => areaOf(t.surface)))].sort(),
    [allTickets]
  );

  const groups = useMemo(() => {
    const needle = filters.q.trim().toLowerCase();
    const statusTest = (STATUS_FILTERS[filters.status] ?? STATUS_FILTERS.open).test;
    const visible = allTickets.filter((ticket) => {
      if (!statusTest(ticket.status)) return false;
      if (filters.group && areaOf(ticket.surface) !== filters.group) return false;
      if (filters.surface && ticket.surface !== filters.surface) return false;
      if (filters.kind && ticket.kind !== filters.kind) return false;
      if (filters.who === "me" && ticket.assignee?.id !== user?.id) return false;
      if (filters.who === "none" && ticket.assignee) return false;
      if (filters.who && !["me", "none"].includes(filters.who) && ticket.assignee?.id !== filters.who)
        return false;
      if (needle && !ticket.title.toLowerCase().includes(needle)) return false;
      return true;
    });

    const bySurface = new Map();
    for (const ticket of visible) {
      if (!bySurface.has(ticket.surface)) bySurface.set(ticket.surface, []);
      bySurface.get(ticket.surface).push(ticket);
    }

    return [...bySurface.entries()].sort((a, b) => {
      // Registry order, with anything unregistered last — a ticket on a
      // surface that no longer exists is worth seeing, not hiding.
      const orderA = REGISTRY_ORDER.get(a[0]) ?? Number.MAX_SAFE_INTEGER;
      const orderB = REGISTRY_ORDER.get(b[0]) ?? Number.MAX_SAFE_INTEGER;
      return orderA - orderB;
    });
  }, [allTickets, filters.group, filters.surface, filters.kind, filters.status,
      filters.who, filters.q, user?.id]);

  const total = allTickets.length;
  const openCount = allTickets.filter((ticket) => OPEN_STATUSES.includes(ticket.status)).length;
  const shownCount = groups.reduce((n, [, tickets]) => n + tickets.length, 0);
  const filtering = FILTER_KEYS.some((k) => k !== "status" && filters[k]) || filters.status !== "open";

  if (loading && !data) return <BeehiveLoading />;
  if (error) return <Empty>Could not load tickets: {error.message}</Empty>;

  return (
    <Wrapper>
      <Head>
        <div>
          <h1 className="MH-Type-Heading-Base">Tickets</h1>
          <Summary>
            {filtering
              ? `Showing ${shownCount} of ${total}`
              : `${openCount} open of ${total} · ${groups.length} of ${SURFACES.length} surfaces have something filed`}
          </Summary>
        </div>
      </Head>

      <Toolbar role="search" aria-label="Filter tickets">
        <input
          type="search"
          placeholder="Search titles"
          value={filters.q}
          onChange={(event) => setFilter("q", event.target.value)}
          aria-label="Search ticket titles"
        />
        <select value={filters.status} onChange={(e) => setFilter("status", e.target.value)} aria-label="Status">
          {Object.entries(STATUS_FILTERS).map(([value, { label }]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <select value={filters.group} onChange={(e) => setFilter("group", e.target.value)} aria-label="Area">
          <option value="">All areas</option>
          {areasInUse.map((area) => (
            <option key={area} value={area}>{AREA_LABELS[area] ?? area}</option>
          ))}
        </select>
        <select value={filters.surface} onChange={(e) => setFilter("surface", e.target.value)} aria-label="Surface">
          <option value="">All surfaces</option>
          {surfacesInUse.map((key) => (
            <option key={key} value={key}>{getSurface(key)?.label ?? key}</option>
          ))}
        </select>
        <select value={filters.kind} onChange={(e) => setFilter("kind", e.target.value)} aria-label="Kind">
          <option value="">All kinds</option>
          {Object.entries(KIND_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <select value={filters.who} onChange={(e) => setFilter("who", e.target.value)} aria-label="Assignee">
          <option value="">Anyone</option>
          <option value="me">Mine</option>
          <option value="none">Unclaimed</option>
          {claimants
            .filter(([id]) => id !== user?.id)
            .map(([id, username]) => (
              <option key={id} value={id}>{username}</option>
            ))}
        </select>
        {filtering && (
          <ClearButton type="button" onClick={clearFilters}>
            Clear
          </ClearButton>
        )}
      </Toolbar>

      {groups.length === 0 ? (
        <Empty>
          {filtering && total > 0 ? (
            <>
              Nothing matches these filters.{" "}
              <ClearButton type="button" onClick={clearFilters}>
                Clear them
              </ClearButton>
            </>
          ) : (
            <>
              Nothing filed yet. Open the Help Center and choose <strong>File a ticket</strong>,
              or press <kbd>Alt+Shift+T</kbd> on any page, to file one against the surface
              you are looking at.
            </>
          )}
        </Empty>
      ) : (
        groups.map(([surfaceKey, tickets]) => {
          const surface = getSurface(surfaceKey);
          return (
            <Group key={surfaceKey}>
              <GroupHead>
                <div>
                  <GroupName>{surface?.label ?? "Unregistered surface"}</GroupName>
                  <SurfaceKey>{surfaceKey}</SurfaceKey>
                </div>
                <GroupCount>{tickets.length}</GroupCount>
              </GroupHead>
              {!surface && (
                <Warn>
                  No entry in <code>lib/surfaces.js</code> — the surface was probably
                  renamed or removed. These tickets need re-pointing.
                </Warn>
              )}
              {surface?.root && <Root>{surface.root}</Root>}
              <Rows>
                {tickets.map((ticket) => (
                  <Row key={ticket.id}>
                    <Link href={`/dashboard/tickets/${ticket.id}`}>
                      <RowTitle>{ticket.title}</RowTitle>
                    </Link>
                    <Meta>
                      <Pill data-status={ticket.status}>
                        {STATUS_LABELS[ticket.status] ?? ticket.status}
                      </Pill>
                      <MetaText>{KIND_LABELS[ticket.kind] ?? ticket.kind}</MetaText>
                      {ticket.priority === "HIGH" && <Pill data-priority="HIGH">High</Pill>}
                      <MetaText>{ticket.reporter?.username ?? "unknown"}</MetaText>
                      <Claim data-claimed={ticket.assignee ? "yes" : "no"}>
                        {ticket.assignee ? `→ ${ticket.assignee.username}` : "unclaimed"}
                      </Claim>
                    </Meta>
                  </Row>
                ))}
              </Rows>
            </Group>
          );
        })
      )}
    </Wrapper>
  );
}

/* --- styles ------------------------------------------------------------- */

const Wrapper = styled.div`
  padding: 24px;
  max-width: 960px;

  h1 {
    margin: 0 0 4px;
  }
`;

const Head = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 24px;
`;

const Summary = styled.p`
  margin: 0;
  font: var(--MH-Type-Body-Small);
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
`;

const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0 0 24px;

  input,
  select {
    padding: 8px 10px;
    border-radius: 8px;
    border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
    background: var(--MH-Theme-Neutrals-White, #ffffff);
    font: var(--MH-Type-Body-Small);
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }
  input[type="search"] {
    flex: 1 1 200px;
  }
`;

const ClearButton = styled.button`
  border: none;
  background: none;
  padding: 0 4px;
  font: var(--MH-Type-Label-Base);
  color: var(--MH-Theme-Primary-Dark, #336f8a);
  text-decoration: underline;
  cursor: pointer;
`;

const Claim = styled.span`
  font: var(--MH-Type-Body-Small);
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);

  &[data-claimed="yes"] {
    color: var(--MH-Theme-Primary-Dark, #336f8a);
  }
`;


const Group = styled.section`
  margin-bottom: 24px;
  border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
  border-radius: 12px;
  overflow: hidden;
  background: var(--MH-Theme-Neutrals-White, #ffffff);
`;

const GroupHead = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  background: var(--MH-Theme-Neutrals-Lighter, #f3f3f3);
`;

const GroupName = styled.p`
  margin: 0;
  font: var(--MH-Type-Title-Small);
  color: var(--MH-Theme-Neutrals-Black, #171717);
`;

const SurfaceKey = styled.p`
  margin: 2px 0 0;
  font-family: "IBM Plex Mono", ui-monospace, Menlo, monospace;
  font-size: 12px;
  color: var(--MH-Theme-Neutrals-Grey-2, #5f6871);
`;

const Root = styled.p`
  margin: 0;
  padding: 8px 16px 0;
  font-family: "IBM Plex Mono", ui-monospace, Menlo, monospace;
  font-size: 12px;
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
`;

const GroupCount = styled.span`
  flex: none;
  font: var(--MH-Type-Label-Base);
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
`;

const Rows = styled.div`
  padding: 8px 0;
`;

const Row = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  padding: 8px 16px;

  &:hover {
    background: var(--MH-Theme-Primary-Light, #def8fb);
  }
`;

const RowTitle = styled.span`
  font: var(--MH-Type-Body-Base);
  color: var(--MH-Theme-Primary-Dark, #336f8a);
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;

const Meta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
`;

const MetaText = styled.span`
  font: var(--MH-Type-Label-Small);
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  white-space: nowrap;
`;

const Pill = styled.span`
  padding: 2px 8px;
  border-radius: 100px;
  font: var(--MH-Type-Label-Small);
  white-space: nowrap;
  background: var(--MH-Theme-Neutrals-Light, #e6e6e6);
  color: var(--MH-Theme-Neutrals-Black, #171717);

  &[data-status="OPEN"] {
    background: var(--MH-Theme-Accent-Light, #fdf2d0);
    color: var(--MH-Theme-Warning-Dark, #8f1f14);
  }
  &[data-status="IN_PROGRESS"] {
    background: var(--MH-Theme-Primary-Light, #def8fb);
    color: var(--MH-Theme-Primary-Dark, #336f8a);
  }
  &[data-status="SHIPPED"] {
    background: var(--MH-Theme-Success, #e3f4ec);
    color: var(--MH-Theme-Success-Dark, #1d6b3a);
  }
  &[data-priority="HIGH"] {
    background: var(--MH-Theme-Warning-Light, #edcecd);
    color: var(--MH-Theme-Warning-Base, #b9261a);
  }
`;

const Empty = styled.p`
  padding: 24px;
  border: 1px dashed var(--MH-Theme-Neutrals-Light, #e6e6e6);
  border-radius: 12px;
  font: var(--MH-Type-Body-Base);
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);

  kbd {
    font-family: "IBM Plex Mono", ui-monospace, Menlo, monospace;
    font-size: 0.9em;
    padding: 1px 5px;
    border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
    border-radius: 4px;
  }
`;

const Warn = styled.p`
  margin: 8px 16px 0;
  padding: 8px 12px;
  border-radius: 8px;
  font: var(--MH-Type-Body-Small);
  background: var(--MH-Theme-Accent-Light, #fdf2d0);
  color: var(--MH-Theme-Warning-Dark, #8f1f14);

  code {
    font-family: "IBM Plex Mono", ui-monospace, Menlo, monospace;
  }
`;
