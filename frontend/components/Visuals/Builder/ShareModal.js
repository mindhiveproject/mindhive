"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import Button from "../../DesignSystem/Button";
import IconButton from "../../DesignSystem/IconButton";
import Modal from "../../DesignSystem/Modal";
import { CloseIcon } from "../../DesignSystem/Icons";

import { UPDATE_VISUAL } from "../../Mutations/YQVisual";

import { useVisualBuilder } from "../Context/VisualBuilderContext";
import {
  BlockSharingFields,
  EditingFields,
  sharingDraft,
  sharingUpdate,
} from "./SharingFields";

const RULE_STYLE = {
  height: 1,
  width: "100%",
  background: "var(--MH-Theme-Neutrals-Light, #E6E6E6)",
  border: 0,
  margin: "20px 0 16px",
};

// Matches the Settings tab's section headers, minus the collapse — there are
// only two groups here and both are the reason the modal was opened.
const GROUP_TITLE_STYLE = {
  margin: "0 0 12px",
  font: "var(--MH-Type-Title-Base)",
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
};

/**
 * Sharing, reachable from the top bar rather than only from the Settings tab.
 *
 * The same two field groups the Settings tab shows, deliberately duplicated:
 * sharing is the thing authors come looking for, and a Share button that files
 * them into a settings screen makes them hunt for it. Kept as one modal rather
 * than an "Invite" and a "Publish" button because only the first is an action —
 * the second is an audience the visual already has.
 */
export default function ShareModal({ open, onClose }) {
  const { t } = useTranslation("visuals");
  const { visual, user } = useVisualBuilder();

  const [updateVisual, { loading: saving }] = useMutation(UPDATE_VISUAL);
  const [draft, setDraft] = useState(() => sharingDraft(visual));

  // Every opening starts from what is saved, so a set of changes abandoned by
  // closing the modal doesn't come back the next time it opens.
  useEffect(() => {
    if (open) setDraft(sharingDraft(visual));
  }, [open, visual]);

  const isOwner = visual?.author?.id === user?.id;
  const dirty = JSON.stringify(draft) !== JSON.stringify(sharingDraft(visual));

  async function onSave() {
    await updateVisual({
      variables: { id: visual.id, data: sharingUpdate(draft) },
    });
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      maxWidth={480}
      maxHeight="80vh"
      title={
        <>
          <span style={{ flex: "1 1 0%" }}>{t("share", "Share")}</span>
          <IconButton
            variant="subtle"
            icon={<CloseIcon />}
            ariaLabel={t("close", "Close")}
            onClick={onClose}
          />
        </>
      }
      actions={
        <>
          <Button variant="text" onClick={onClose}>
            {t("cancel", "Cancel")}
          </Button>
          <Button
            variant="filled"
            disabled={!isOwner || !dirty || saving}
            onClick={onSave}
          >
            {t("save", "Save")}
          </Button>
        </>
      }
    >
      <p style={{ margin: "0 0 16px" }}>
        {t(
          "shareDescription",
          "Invite people to build this visual with you, and choose who can open it once it leaves the builder.",
        )}
      </p>

      <h3 style={GROUP_TITLE_STYLE}>{t("editing", "Editing")}</h3>
      <EditingFields
        visual={visual}
        draft={draft}
        setDraft={setDraft}
        isOwner={isOwner}
      />

      <hr style={RULE_STYLE} />

      <h3 style={GROUP_TITLE_STYLE}>{t("blockSharing", "Block Sharing")}</h3>
      <BlockSharingFields
        visual={visual}
        draft={draft}
        setDraft={setDraft}
        isOwner={isOwner}
      />
    </Modal>
  );
}
