import { useMemo, useState } from "react";
import styled from "styled-components";

const Wrapper = styled.div`
  width: 100%;
  overflow-x: auto;
  padding: 8px;
`;

const Legend = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 12px;
  font-size: 12px;
  color: #5f6871;

  span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  i {
    display: inline-block;
    width: 18px;
    height: 3px;
    background: var(--c);
    border-radius: 2px;
  }
`;

const STATUS_STYLE = {
  proposed: { stroke: "#d4a304", dash: "4 4" },
  active: { stroke: "#1d8f47", dash: "0" },
  completed: { stroke: "#1976d2", dash: "0" },
  declined: { stroke: "#b3261e", dash: "4 4" },
  cancelled: { stroke: "#888", dash: "4 4" },
};

function displayName(profile) {
  if (!profile) return "Unknown";
  return (
    `${profile.firstName || ""} ${profile.lastName || ""}`.trim() ||
    profile.username
  );
}

export default function NetworkGraph({ round }) {
  const matches = round?.matches || [];
  const opportunities = round?.opportunities || [];
  const preferences = round?.preferences || [];

  const [hoverEdge, setHoverEdge] = useState(null);

  const { studentNodes, opportunityNodes, edges, height } = useMemo(() => {
    const studentMap = new Map();
    matches.forEach((m) => {
      if (m.student?.id) studentMap.set(m.student.id, m.student);
    });
    preferences.forEach((p) => {
      if (p.submitter?.id) studentMap.set(p.submitter.id, p.submitter);
    });
    const students = Array.from(studentMap.values()).sort((a, b) =>
      displayName(a).localeCompare(displayName(b))
    );

    const sortedOpps = [...opportunities].sort((a, b) =>
      (a.title || "").localeCompare(b.title || "")
    );

    const rowGap = 36;
    const padding = 40;
    const leftX = 60;
    const rightX = 720;
    const sH = padding + Math.max(students.length, 1) * rowGap + padding;
    const oH = padding + Math.max(sortedOpps.length, 1) * rowGap + padding;
    const totalH = Math.max(sH, oH);

    const offsetS = (totalH - students.length * rowGap) / 2;
    const offsetO = (totalH - sortedOpps.length * rowGap) / 2;

    const sNodes = students.map((s, i) => ({
      id: s.id,
      name: displayName(s),
      x: leftX,
      y: offsetS + i * rowGap,
    }));

    const oNodes = sortedOpps.map((o, i) => ({
      id: o.id,
      title: o.title || "(opportunity)",
      capacity: o.studentCapacity || 1,
      x: rightX,
      y: offsetO + i * rowGap,
    }));

    const sPos = new Map(sNodes.map((n) => [n.id, n]));
    const oPos = new Map(oNodes.map((n) => [n.id, n]));

    const eList = matches
      .map((m) => {
        const s = sPos.get(m.student?.id);
        const o = oPos.get(m.opportunity?.id);
        if (!s || !o) return null;
        return {
          id: m.id,
          x1: s.x + 6,
          y1: s.y,
          x2: o.x - 6,
          y2: o.y,
          status: m.status,
          studentName: s.name,
          opportunityTitle: o.title,
          score: m.matchScore,
        };
      })
      .filter(Boolean);

    return {
      studentNodes: sNodes,
      opportunityNodes: oNodes,
      edges: eList,
      height: totalH,
    };
  }, [matches, opportunities, preferences]);

  if (studentNodes.length === 0 && opportunityNodes.length === 0) {
    return (
      <p style={{ color: "#5f6871", fontSize: 14 }}>
        No matches or preferences to visualize yet.
      </p>
    );
  }

  return (
    <Wrapper>
      <Legend>
        <span>
          <i style={{ "--c": STATUS_STYLE.active.stroke }} /> Active
        </span>
        <span>
          <i style={{ "--c": STATUS_STYLE.proposed.stroke }} /> Proposed
        </span>
        <span>
          <i style={{ "--c": STATUS_STYLE.completed.stroke }} /> Completed
        </span>
        <span>
          <i style={{ "--c": STATUS_STYLE.declined.stroke }} /> Declined
        </span>
        <span>
          <i style={{ "--c": STATUS_STYLE.cancelled.stroke }} /> Cancelled
        </span>
      </Legend>
      <svg
        viewBox={`0 0 880 ${height}`}
        width="100%"
        height={height}
        style={{ minWidth: 800 }}
      >
        <text
          x={60}
          y={20}
          fontSize={12}
          fill="#5f6871"
          fontWeight={600}
        >
          Students
        </text>
        <text
          x={720}
          y={20}
          fontSize={12}
          fill="#5f6871"
          fontWeight={600}
          textAnchor="end"
        >
          Opportunities
        </text>

        {edges.map((e) => {
          const style = STATUS_STYLE[e.status] || STATUS_STYLE.proposed;
          const midX = (e.x1 + e.x2) / 2;
          const path = `M ${e.x1} ${e.y1} C ${midX} ${e.y1}, ${midX} ${e.y2}, ${e.x2} ${e.y2}`;
          const isHover = hoverEdge === e.id;
          return (
            <path
              key={e.id}
              d={path}
              fill="none"
              stroke={style.stroke}
              strokeWidth={isHover ? 3 : 1.6}
              strokeDasharray={style.dash}
              opacity={hoverEdge && !isHover ? 0.2 : 1}
              onMouseEnter={() => setHoverEdge(e.id)}
              onMouseLeave={() => setHoverEdge(null)}
              style={{ cursor: "pointer" }}
            >
              <title>
                {e.studentName} → {e.opportunityTitle}
                {typeof e.score === "number" ? ` (score ${e.score.toFixed(0)})` : ""}
                {` · ${e.status}`}
              </title>
            </path>
          );
        })}

        {studentNodes.map((n) => (
          <g key={n.id}>
            <circle cx={n.x} cy={n.y} r={6} fill="#336f8a" />
            <text
              x={n.x - 12}
              y={n.y + 4}
              textAnchor="end"
              fontSize={12}
              fill="#171717"
            >
              {n.name}
            </text>
          </g>
        ))}

        {opportunityNodes.map((n) => (
          <g key={n.id}>
            <rect
              x={n.x - 6}
              y={n.y - 6}
              width={12}
              height={12}
              fill="#f5b800"
              rx={2}
            />
            <text
              x={n.x + 12}
              y={n.y + 4}
              fontSize={12}
              fill="#171717"
            >
              {n.title}{" "}
              <tspan fill="#888" fontSize={10}>
                · cap {n.capacity}
              </tspan>
            </text>
          </g>
        ))}
      </svg>
    </Wrapper>
  );
}
