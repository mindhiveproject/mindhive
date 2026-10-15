import { useEffect, useState } from "react";
import styled from "styled-components";

// Milestone title with the class-wide completed / total count underneath.
// Clicking cycles the column sort, like AG Grid's default header.
export function MilestoneColumnHeader(props) {
  const { column, displayName, completed = 0, total = 0 } = props;
  const [sort, setSort] = useState(column?.getSort?.() || null);

  useEffect(() => {
    if (!column) return undefined;
    const onSortChanged = () => setSort(column.getSort() || null);
    column.addEventListener("sortChanged", onSortChanged);
    return () => column.removeEventListener("sortChanged", onSortChanged);
  }, [column]);

  return (
    <StyledHeader
      type="button"
      onClick={(event) => props.progressSort?.(event.shiftKey)}
    >
      <span className="milestoneHeaderTitle">
        {displayName}
        {sort === "asc" ? " ↑" : sort === "desc" ? " ↓" : ""}
      </span>
      <span className="milestoneHeaderCount">
        {completed}/{total}
      </span>
    </StyledHeader>
  );
}

const StyledHeader = styled.button`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;

  .milestoneHeaderTitle {
    font: var(--MH-Type-Title-Small);
    letter-spacing: 0;
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }

  .milestoneHeaderCount {
    font: var(--MH-Type-Label-Base);
    letter-spacing: 0;
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  }
`;
