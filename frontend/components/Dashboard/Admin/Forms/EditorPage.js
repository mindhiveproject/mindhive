// Admin: three-pane form-definition editor. Loads the full definition
// (with nested cards + fields), maintains a selection (card or field),
// and renders three panes side by side.
//
// Top bar: title + status badge + Save publish/archive actions.
import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useMutation, useQuery } from "@apollo/client";
import Link from "next/link";
import styled from "styled-components";

import {
  ADMIN_FORM_DEFINITION,
  ADMIN_FORM_DEFINITIONS,
  SIBLING_FORM_DEFINITIONS,
} from "../../../Queries/FormDefinition";
import {
  UPDATE_FORM_DEFINITION,
  PUBLISH_FORM_DEFINITION,
} from "../../../Mutations/FormDefinition";
import FormDefinitionEditor from "./FormDefinitionEditor";
import PublishModal from "./PublishModal";
import VersionHistoryPanel from "./VersionHistoryPanel";
import {
  PrimaryButton,
  SecondaryButton,
} from "./EditorPanelStyles";

const SURFACE_LABEL = {
  profile_individual: "Individual profile",
  profile_organization: "Organization profile",
  opportunity: "Opportunity",
  feedback: "Feedback",
};

const Shell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px clamp(16px, 4vw, 48px);
  background-color: #f7f9f8;
  min-height: 100vh;
  border-radius: 32px 0 0 32px;
`;

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  background: #ffffff;
  border-radius: 16px;
  padding: 16px 20px;
  box-shadow: 0px 4px 24px rgba(0, 0, 0, 0.05);

  h1 {
    margin: 0;
    font-family: "Lato", sans-serif;
    font-size: 22px;
    color: #171717;
  }

  .meta {
    color: #5f6871;
    font-size: 13px;
  }

  .actions {
    display: flex;
    gap: 8px;
  }
`;

const StatusBadge = styled.span`
  padding: 2px 10px;
  border-radius: 100px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-left: 6px;
  background: ${({ $status }) =>
    $status === "published" ? "#1d6b3a" :
    $status === "draft" ? "#8a6d3b" :
    "#5f6871"};
  color: #ffffff;
`;

const BackLink = styled.button`
  background: none;
  border: none;
  color: #336f8a;
  font-family: "Nunito", sans-serif;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  padding: 0;
`;

export default function EditorPage({ definitionId }) {
  const router = useRouter();
  const [publishOpen, setPublishOpen] = useState(false);

  const { data, loading, error } = useQuery(ADMIN_FORM_DEFINITION, {
    variables: { id: definitionId },
    fetchPolicy: "cache-and-network",
  });
  const definition = data?.formDefinition;

  // Fetch siblings so the publish modal can warn about an auto-archive.
  const { data: siblingData } = useQuery(SIBLING_FORM_DEFINITIONS, {
    variables: { key: definition?.key },
    skip: !definition?.key,
    fetchPolicy: "cache-and-network",
  });

  const liveSibling = useMemo(() => {
    if (!definition) return null;
    const siblings = siblingData?.formDefinitions || [];
    return (
      siblings.find(
        (s) =>
          s.id !== definition.id &&
          s.status === "published" &&
          s.scope === definition.scope &&
          (s.organization?.id || null) ===
            (definition.organization?.id || null) &&
          (s.classNetwork?.id || null) ===
            (definition.classNetwork?.id || null) &&
          (s.proposalBoard?.id || null) ===
            (definition.proposalBoard?.id || null)
      ) || null
    );
  }, [siblingData, definition]);

  const refetchAfterDefMutation = [
    { query: ADMIN_FORM_DEFINITION, variables: { id: definitionId } },
    { query: ADMIN_FORM_DEFINITIONS },
    ...(definition?.key
      ? [
          {
            query: SIBLING_FORM_DEFINITIONS,
            variables: { key: definition.key },
          },
        ]
      : []),
  ];

  const [updateDefinition, { loading: savingDef }] = useMutation(
    UPDATE_FORM_DEFINITION,
    {
      refetchQueries: refetchAfterDefMutation,
      awaitRefetchQueries: true,
    }
  );

  const [publishDef, { loading: publishing, error: publishError }] = useMutation(
    PUBLISH_FORM_DEFINITION,
    {
      refetchQueries: refetchAfterDefMutation,
      awaitRefetchQueries: true,
    }
  );


  const confirmPublish = async (changelog) => {
    try {
      await publishDef({
        variables: { id: definitionId, changelog: changelog || null },
      });
      setPublishOpen(false);
    } catch {
      // Error surfaces via publishError → PublishModal renders it
      // inline so the admin can fix the underlying field wiring and
      // try again.
    }
  };

  const revertToDraft = async () => {
    await updateDefinition({
      variables: {
        id: definitionId,
        input: { status: "draft" },
      },
    });
  };

  const archive = async () => {
    if (
      !window.confirm(
        "Archive this definition? The renderer will fall back to the next-most-specific published version."
      )
    ) {
      return;
    }
    await updateDefinition({
      variables: { id: definitionId, input: { status: "archived" } },
    });
  };

  if (loading && !definition) {
    return <Shell>Loading…</Shell>;
  }
  if (error) {
    return (
      <Shell>
        <p style={{ color: "#871b16" }}>Couldn't load: {error.message}</p>
      </Shell>
    );
  }
  if (!definition) {
    return (
      <Shell>
        <p>Definition not found.</p>
        <Link href="/dashboard/admin-forms">← Back to list</Link>
      </Shell>
    );
  }

  return (
    <Shell>
      <TopBar>
        <div>
          <BackLink
            type="button"
            onClick={() => router.push("/dashboard/admin-forms")}
          >
            ← All form definitions
          </BackLink>
          <h1>
            {definition.title}
            <StatusBadge $status={definition.status}>
              {definition.status}
            </StatusBadge>
          </h1>
          <div className="meta">
            {definition.surface ? (
              <>
                <strong>{SURFACE_LABEL[definition.surface] || definition.surface}</strong>{" "}
                ·{" "}
              </>
            ) : null}
            <code>{definition.key}</code> · {definition.scope}
            {definition.scope === "project_board" &&
            definition.proposalBoard?.title
              ? ` (${definition.proposalBoard.title})`
              : definition.scope === "organization" &&
                  definition.organization?.name
                ? ` (${definition.organization.name})`
                : definition.scope === "class_network" &&
                    definition.classNetwork?.title
                  ? ` (${definition.classNetwork.title})`
                  : ""}{" "}
            · v{definition.version}
          </div>
        </div>
        <div className="actions">
          {definition.status === "draft" ? (
            <PrimaryButton
              type="button"
              onClick={() => setPublishOpen(true)}
              disabled={savingDef || publishing}
            >
              Publish…
            </PrimaryButton>
          ) : null}
          {definition.status === "published" ? (
            <SecondaryButton
              type="button"
              onClick={revertToDraft}
              disabled={savingDef}
            >
              Revert to draft
            </SecondaryButton>
          ) : null}
          {definition.status !== "archived" ? (
            <SecondaryButton
              type="button"
              onClick={archive}
              disabled={savingDef}
            >
              Archive
            </SecondaryButton>
          ) : null}
        </div>
      </TopBar>

      <VersionHistoryPanel definition={definition} />

      <FormDefinitionEditor
        definitionId={definitionId}
        locale={router.locale}
      />
      {publishOpen ? (
        <PublishModal
          definition={definition}
          liveSibling={liveSibling}
          onCancel={() => setPublishOpen(false)}
          onConfirm={confirmPublish}
          busy={publishing}
          error={publishError}
        />
      ) : null}
    </Shell>
  );
}
