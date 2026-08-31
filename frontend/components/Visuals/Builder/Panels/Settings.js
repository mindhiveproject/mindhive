"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";

import Button from "../../../DesignSystem/Button";
import Card, { CardSection } from "../../../DesignSystem/Card";
import Checkbox from "../../../DesignSystem/Checkbox";
import Input from "../../../DesignSystem/Input";
import Radio from "../../../DesignSystem/Radio";
import { ArrowDropDownIcon, DeleteIcon } from "../../../DesignSystem/Icons";

import { DELETE_VISUAL, UPDATE_VISUAL } from "../../../Mutations/YQVisual";

import Panel from "../Panel";
import {
  BlockSharingFields,
  EditingFields,
  sharingDraft,
  sharingUpdate,
} from "../SharingFields";
import { useVisualBuilder } from "../../Context/VisualBuilderContext";

const SECTION_HEADER_STYLE = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  width: "100%",
  padding: 0,
  border: "none",
  background: "transparent",
  cursor: "pointer",
  font: "var(--MH-Type-Title-Base)",
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
};

const RULE_STYLE = {
  height: 1,
  width: "100%",
  background: "var(--MH-Theme-Neutrals-Light, #E6E6E6)",
  border: 0,
  margin: 0,
};

const FIELD_LABEL_STYLE = {
  font: "var(--MH-Type-Body-Base)",
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
};

const HELP_STYLE = {
  margin: 0,
  font: "var(--MH-Type-Body-Base)",
  color: "var(--MH-Theme-Neutrals-Dark, #6A6A6A)",
};

const OPTION_ROW_STYLE = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: 12,
};

// The two participation modes are one choice, so both sit on a fill and the
// chosen one is the lighter of the two rather than the only one with an
// outline — an outline here would read as a second, separate object.
const OPTION_CHOSEN_STYLE = {
  background: "var(--MH-Theme-Neutrals-Light-Green, #F6F9F8)",
};

const FOOTER_STYLE = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  paddingTop: 8,
};

/** A collapsible titled block. The three sections are separate on purpose — see below. */
function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <>
      <hr style={RULE_STYLE} />
      <button
        type="button"
        style={SECTION_HEADER_STYLE}
        onClick={() => setOpen((on) => !on)}
        aria-expanded={open}
      >
        <span>{title}</span>
        <span
          style={{
            display: "flex",
            transform: open ? "none" : "rotate(-90deg)",
            transition: "transform 0.2s",
          }}
          aria-hidden
        >
          <ArrowDropDownIcon />
        </span>
      </button>
      {open ? children : null}
    </>
  );
}

/**
 * The Settings tab.
 *
 * The three sections are kept apart deliberately, because they answer three
 * different questions about a visual:
 *
 *   Editing       — who may change the original. By invitation only; there is no
 *                   "who can edit" audience select, and there shouldn't be.
 *   Participation — how the visual behaves when someone experiences it. A
 *                   property of the block itself, not of a share link, which is
 *                   what lets the same setting hold when a visual later becomes
 *                   a step inside a study.
 *   Block Sharing — who can reach it at all.
 *
 * Folding participation into sharing would lose that distinction.
 *
 * Editing and Block Sharing render the same fields the Share modal does, so the
 * two places an author can change them stay one control.
 */
export default function SettingsPanel({ user }) {
  const { t } = useTranslation("visuals");
  const router = useRouter();
  const { visual, canEdit } = useVisualBuilder();

  const [updateVisual, { loading: saving }] = useMutation(UPDATE_VISUAL);
  const [deleteVisual] = useMutation(DELETE_VISUAL);

  const [draft, setDraft] = useState(() => fromVisual(visual));

  useEffect(() => setDraft(fromVisual(visual)), [visual]);

  const isOwner = visual?.author?.id === user?.id;
  const dirty = JSON.stringify(draft) !== JSON.stringify(fromVisual(visual));

  async function onSave() {
    await updateVisual({
      variables: {
        id: visual.id,
        data: {
          title: draft.title,
          description: draft.description,
          participationMode: draft.participationMode,
          docsVisible: draft.docsVisible,
          ...sharingUpdate(draft),
        },
      },
    });
  }

  async function onDelete() {
    if (!window.confirm(t("confirmDelete", "Delete this visual permanently?")))
      return;
    await deleteVisual({ variables: { id: visual.id } });
    router.push("/dashboard/develop/visuals");
  }

  return (
    <Panel title={t("settings", "Settings")}>
      <Section title={t("properties", "Properties")}>
        <Input
          label={t("name", "Name")}
          value={draft.title}
          disabled={!canEdit}
          onChange={(next) => setDraft((c) => ({ ...c, title: next }))}
        />
        <Input
          label={t("description", "Description")}
          multiline
          value={draft.description}
          disabled={!canEdit}
          onChange={(next) => setDraft((c) => ({ ...c, description: next }))}
        />
        <div>
          <span style={FIELD_LABEL_STYLE}>{t("cover", "Cover")}</span>
          <p style={{ ...HELP_STYLE, marginTop: 4 }}>
            {t("coverComing", "Cover images are coming with the visuals bank.")}
          </p>
        </div>
      </Section>

      <Section title={t("editing", "Editing")}>
        <EditingFields
          visual={visual}
          draft={draft}
          setDraft={setDraft}
          isOwner={isOwner}
        />
      </Section>

      <Section title={t("participation", "Participation")}>
        <div role="radiogroup" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Card
            variant="subtle"
            style={
              draft.participationMode === "sandbox" ? OPTION_CHOSEN_STYLE : null
            }
          >
            <div style={OPTION_ROW_STYLE}>
              <div style={{ flex: "1 1 auto", minWidth: 0 }}>
                <p style={{ ...FIELD_LABEL_STYLE, margin: 0, font: "var(--MH-Type-Title-Base)" }}>
                  {t("sandboxMode", "Sandbox mode")}
                </p>
                <p style={HELP_STYLE}>
                  {t(
                    "sandboxHelp",
                    "Allows viewers to add their own data sources and change how the parameters are mapped."
                  )}
                </p>
              </div>
              <Radio
                checked={draft.participationMode === "sandbox"}
                disabled={!canEdit}
                ariaLabel={t("sandboxMode", "Sandbox mode")}
                onChange={() =>
                  setDraft((c) => ({ ...c, participationMode: "sandbox" }))
                }
              />
            </div>
            {draft.participationMode === "sandbox" ? (
              <CardSection style={{ padding: "0 12px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ flex: "1 1 auto", ...FIELD_LABEL_STYLE }}>
                    {t("showDocumentation", "Show documentation")}
                  </span>
                  <Checkbox
                    checked={draft.docsVisible}
                    disabled={!canEdit}
                    ariaLabel={t("showDocumentation", "Show documentation")}
                    onChange={(next) =>
                      setDraft((c) => ({ ...c, docsVisible: next }))
                    }
                  />
                </div>
              </CardSection>
            ) : null}
          </Card>

          <Card
            variant="subtle"
            style={
              draft.participationMode === "authored" ? OPTION_CHOSEN_STYLE : null
            }
          >
            <div style={OPTION_ROW_STYLE}>
              <div style={{ flex: "1 1 auto", minWidth: 0 }}>
                <p style={{ ...FIELD_LABEL_STYLE, margin: 0, font: "var(--MH-Type-Title-Base)" }}>
                  {t("authoredMode", "Authored mode")}
                </p>
                <p style={HELP_STYLE}>
                  {t(
                    "authoredHelp",
                    "Show the visual in full screen when opened and require connection to the data sources listed by you."
                  )}
                </p>
              </div>
              <Radio
                checked={draft.participationMode === "authored"}
                disabled={!canEdit}
                ariaLabel={t("authoredMode", "Authored mode")}
                onChange={() =>
                  setDraft((c) => ({ ...c, participationMode: "authored" }))
                }
              />
            </div>
          </Card>
        </div>
      </Section>

      <Section title={t("blockSharing", "Block Sharing")}>
        <BlockSharingFields
          visual={visual}
          draft={draft}
          setDraft={setDraft}
          isOwner={isOwner}
        />
      </Section>

      <hr style={RULE_STYLE} />
      <div style={FOOTER_STYLE}>
        <Button
          variant="text"
          leadingIcon={<DeleteIcon />}
          disabled={!isOwner}
          onClick={onDelete}
          style={{ color: "var(--MH-Theme-Warning-Base, #b9261a)" }}
        >
          {t("deleteVisual", "Delete Visual")}
        </Button>
        <div style={{ display: "flex", gap: 8 }}>
          <Button
            variant="outline"
            disabled={!dirty}
            onClick={() => setDraft(fromVisual(visual))}
          >
            {t("discardChanges", "Discard Changes")}
          </Button>
          <Button
            variant="filled"
            disabled={!canEdit || !dirty || saving}
            onClick={onSave}
          >
            {t("save", "Save")}
          </Button>
        </div>
      </div>
    </Panel>
  );
}

function fromVisual(visual) {
  return {
    title: visual?.title || "",
    description: visual?.description || "",
    participationMode: visual?.participationMode || "sandbox",
    docsVisible: !!visual?.docsVisible,
    ...sharingDraft(visual),
  };
}
