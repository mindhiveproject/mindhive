// Sibling-versions panel for the editor. Loads all FormDefinition rows
// sharing the current definition's `key`, then filters in-component to
// rows that also match scope + organization + classNetwork (the same
// tuple the publish workflow scopes by). Renders a compact list with
// click-to-open and the changelog text.
//
// Rolling back to an older version: use the "Duplicate" button on that
// version. That clones it as a new draft you can review and publish
// when ready.
import { useMemo } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "@apollo/client";
import styled from "styled-components";

import {
  SIBLING_FORM_DEFINITIONS,
  ADMIN_FORM_DEFINITIONS,
} from "../../../Queries/FormDefinition";
import { DUPLICATE_FORM_DEFINITION } from "../../../Mutations/FormDefinition";

const Shell = styled.section`
  background: #ffffff;
  border-radius: 16px;
  padding: 16px 20px;
  box-shadow: 0px 4px 24px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 8px;

  h2 {
    margin: 0;
    font-family: "Lato", sans-serif;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #5f6871;
  }
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 60px 90px 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 8px 6px;
  border-radius: 8px;
  font-size: 13px;
  background: ${({ $current }) => ($current ? "#eef5f9" : "transparent")};
  border: 1px solid
    ${({ $current }) => ($current ? "#336f8a" : "transparent")};

  .version {
    font-family: "Nunito", sans-serif;
    font-weight: 700;
    color: #171717;
  }

  .pill {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 100px;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #ffffff;
    background: ${({ $status }) =>
      $status === "published"
        ? "#1d6b3a"
        : $status === "draft"
          ? "#8a6d3b"
          : "#5f6871"};
  }

  .meta {
    color: #5f6871;
    font-size: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .changelog {
    color: #171717;
    font-size: 12px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .actions {
    display: flex;
    gap: 8px;
  }

  a,
  button {
    color: #336f8a;
    font-family: "Nunito", sans-serif;
    font-weight: 600;
    font-size: 12px;
    text-decoration: none;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
  }
`;

function fmtDate(d) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleString();
  } catch {
    return "";
  }
}

function sameScopeKey(a, b) {
  if (a.scope !== b.scope) return false;
  if ((a.organization?.id || null) !== (b.organization?.id || null)) return false;
  if ((a.classNetwork?.id || null) !== (b.classNetwork?.id || null)) return false;
  return true;
}

export default function VersionHistoryPanel({ definition }) {
  const { data } = useQuery(SIBLING_FORM_DEFINITIONS, {
    variables: { key: definition.key },
    fetchPolicy: "cache-and-network",
  });

  const siblings = useMemo(() => {
    const all = data?.formDefinitions || [];
    return all.filter((d) => sameScopeKey(d, definition));
  }, [data, definition]);

  const [duplicateDef, { loading: duplicating }] = useMutation(
    DUPLICATE_FORM_DEFINITION,
    {
      refetchQueries: [
        { query: ADMIN_FORM_DEFINITIONS },
        {
          query: SIBLING_FORM_DEFINITIONS,
          variables: { key: definition.key },
        },
      ],
      awaitRefetchQueries: true,
    }
  );

  if (siblings.length <= 1) {
    return (
      <Shell>
        <h2>Version history</h2>
        <span style={{ color: "#5f6871", fontSize: 13 }}>
          This is the only version of <code>{definition.key}</code> at scope{" "}
          <code>{definition.scope}</code>. Use "Duplicate" on the list page
          to fork a new draft.
        </span>
      </Shell>
    );
  }

  return (
    <Shell>
      <h2>Version history</h2>
      {siblings.map((s) => {
        const isCurrent = s.id === definition.id;
        const author =
          s.publishedBy?.username ||
          s.createdBy?.username ||
          "unknown";
        return (
          <Row key={s.id} $status={s.status} $current={isCurrent}>
            <span className="version">v{s.version}</span>
            <span className="pill">{s.status}</span>
            <div style={{ overflow: "hidden" }}>
              {s.changelog ? (
                <div className="changelog" title={s.changelog}>
                  {s.changelog}
                </div>
              ) : null}
              <div className="meta">
                {s.publishedAt
                  ? `published ${fmtDate(s.publishedAt)} by ${author}`
                  : `updated ${fmtDate(s.updatedAt)}`}
              </div>
            </div>
            <div className="actions">
              {isCurrent ? (
                <span style={{ color: "#888", fontSize: 12 }}>(current)</span>
              ) : (
                <>
                  <Link
                    href={{
                      pathname: "/dashboard/admin-forms",
                      query: { id: s.id },
                    }}
                  >
                    Open
                  </Link>
                  <button
                    type="button"
                    onClick={() =>
                      duplicateDef({ variables: { id: s.id } })
                    }
                    disabled={duplicating}
                    title="Clone this version as a new draft"
                  >
                    Roll back
                  </button>
                </>
              )}
            </div>
          </Row>
        );
      })}
    </Shell>
  );
}
