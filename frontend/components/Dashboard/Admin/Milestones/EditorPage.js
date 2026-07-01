import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";
import { useMutation, useQuery } from "@apollo/client";

import { ADMIN_MILESTONE, ADMIN_MILESTONES } from "../../../Queries/Milestone";
import { UPDATE_MILESTONE } from "../../../Mutations/Milestone";
import {
  EditorPanelShell,
  FieldRow,
  PrimaryButton,
  SecondaryButton,
} from "../Forms/EditorPanelStyles";

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

  h1 {
    margin: 0;
    font-family: "Lato", sans-serif;
    font-size: 22px;
    color: #171717;
  }

  .actions {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .flash {
    color: #1d6b3a;
    font-size: 13px;
  }
`;

const ReadOnlyGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
  margin-top: 8px;

  div {
    font-size: 13px;
    color: #5f6871;
  }

  strong {
    display: block;
    color: #171717;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 4px;
  }
`;

export default function EditorPage({ milestoneId }) {
  const { t } = useTranslation("dashboard");
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [formDefinitionKeyPattern, setFormDefinitionKeyPattern] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [showInFeedbackCenter, setShowInFeedbackCenter] = useState(true);
  const [savedFlash, setSavedFlash] = useState(false);

  const { data, loading, error } = useQuery(ADMIN_MILESTONE, {
    variables: { id: milestoneId },
    fetchPolicy: "cache-and-network",
  });

  const milestone = data?.milestone;

  useEffect(() => {
    if (!milestone) return;
    setTitle(milestone.title || "");
    setDescription(milestone.description || "");
    setFormDefinitionKeyPattern(milestone.formDefinitionKeyPattern || "");
    setIsActive(!!milestone.isActive);
    setShowInFeedbackCenter(!!milestone.showInFeedbackCenter);
  }, [milestone]);

  const [updateMilestone, { loading: saving }] = useMutation(UPDATE_MILESTONE, {
    refetchQueries: [
      { query: ADMIN_MILESTONE, variables: { id: milestoneId } },
      { query: ADMIN_MILESTONES },
    ],
    awaitRefetchQueries: true,
  });

  if (loading && !milestone) {
    return (
      <Shell>
        <p>{t("adminMilestones.loading", {}, { default: "Loading…" })}</p>
      </Shell>
    );
  }

  if (error) {
    return (
      <Shell>
        <p style={{ color: "#871b16" }}>
          {t(
            "adminMilestones.loadError",
            { message: error.message },
            { default: "Couldn't load milestones: {{message}}" }
          )}
        </p>
      </Shell>
    );
  }

  if (!milestone) {
    return (
      <Shell>
        <p>{t("adminMilestones.editorNotFound", {}, { default: "Milestone not found." })}</p>
        <Link href="/dashboard/admin-milestones">
          {t("adminMilestones.backToList", {}, { default: "← Back to list" })}
        </Link>
      </Shell>
    );
  }

  if (milestone.scope !== "global") {
    return (
      <Shell>
        <p>
          {t(
            "adminMilestones.editorGlobalOnly",
            {},
            { default: "Only global milestones can be edited here." }
          )}
        </p>
        <Link href="/dashboard/admin-milestones">
          {t("adminMilestones.backToList", {}, { default: "← Back to list" })}
        </Link>
      </Shell>
    );
  }

  const handleSave = async (e) => {
    e.preventDefault();
    setSavedFlash(false);
    await updateMilestone({
      variables: {
        id: milestoneId,
        input: {
          title,
          description,
          formDefinitionKeyPattern,
          isActive,
          showInFeedbackCenter,
        },
      },
    });
    setSavedFlash(true);
  };

  return (
    <Shell>
      <TopBar>
        <div>
          <h1>
            {t("adminMilestones.editorTitle", {}, { default: "Edit milestone" })}
            {": "}
            <code>{milestone.key}</code>
          </h1>
        </div>
        <div className="actions">
          {savedFlash ? (
            <span className="flash">
              {t("adminMilestones.saved", {}, { default: "Changes saved." })}
            </span>
          ) : null}
          <SecondaryButton
            type="button"
            onClick={() => router.push("/dashboard/admin-milestones")}
          >
            {t("adminMilestones.backToList", {}, { default: "← Back to list" })}
          </SecondaryButton>
          <PrimaryButton type="submit" form="milestone-editor" disabled={saving}>
            {saving
              ? t("adminMilestones.saving", {}, { default: "Saving…" })
              : t("adminMilestones.save", {}, { default: "Save changes" })}
          </PrimaryButton>
        </div>
      </TopBar>

      <EditorPanelShell as="form" id="milestone-editor" onSubmit={handleSave}>
        <ReadOnlyGrid>
          <div>
            <strong>{t("adminMilestones.readOnlyKey", {}, { default: "Key" })}</strong>
            {milestone.key}
          </div>
          <div>
            <strong>
              {t("adminMilestones.readOnlyActionCard", {}, { default: "Action card type" })}
            </strong>
            {milestone.actionCardType || "—"}
          </div>
          <div>
            <strong>
              {t("adminMilestones.readOnlyReviewStage", {}, { default: "Review stage" })}
            </strong>
            {milestone.reviewStage}
          </div>
          <div>
            <strong>
              {t("adminMilestones.readOnlyStatusTarget", {}, { default: "Status target" })}
            </strong>
            {milestone.statusTarget}
          </div>
          <div>
            <strong>
              {t("adminMilestones.readOnlyLegacyStatus", {}, { default: "Legacy status field" })}
            </strong>
            {milestone.legacyBoardStatusField || "—"}
          </div>
          <div>
            <strong>
              {t("adminMilestones.readOnlyLegacyOpen", {}, { default: "Legacy open-for-comments field" })}
            </strong>
            {milestone.legacyOpenForCommentsField || "—"}
          </div>
        </ReadOnlyGrid>

        <FieldRow>
          <span className="label-text">
            {t("adminMilestones.fieldTitle", {}, { default: "Title" })}
          </span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </FieldRow>

        <FieldRow>
          <span className="label-text">
            {t("adminMilestones.fieldDescription", {}, { default: "Description" })}
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </FieldRow>

        <FieldRow>
          <span className="label-text">
            {t("adminMilestones.fieldFormPattern", {}, { default: "Form definition key pattern" })}
          </span>
          <span className="hint">
            {t(
              "adminMilestones.fieldFormPatternHint",
              {},
              { default: "Use {{key}} and {{curriculumType}} placeholders." }
            )}
          </span>
          <input
            type="text"
            value={formDefinitionKeyPattern}
            onChange={(e) => setFormDefinitionKeyPattern(e.target.value)}
          />
        </FieldRow>

        <FieldRow>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            {t("adminMilestones.fieldIsActive", {}, { default: "Active" })}
          </label>
        </FieldRow>

        <FieldRow>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={showInFeedbackCenter}
              onChange={(e) => setShowInFeedbackCenter(e.target.checked)}
            />
            {t(
              "adminMilestones.fieldShowInFeedbackCenter",
              {},
              { default: "Show in feedback center" }
            )}
          </label>
        </FieldRow>
      </EditorPanelShell>
    </Shell>
  );
}
