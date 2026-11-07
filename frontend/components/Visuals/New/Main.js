"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";

import Button from "../../DesignSystem/Button";
import ButtonGroup from "../../DesignSystem/ButtonGroup";
import DropdownSelect from "../../DesignSystem/DropdownSelect";
import Input from "../../DesignSystem/Input";
import { StyledBuilderArea } from "../../styles/StyledBuilder";

import { MY_VISUALS } from "../../Queries/YQVisual";
import {
  COPY_VISUAL,
  CREATE_VISUAL,
  UPDATE_VISUAL,
} from "../../Mutations/YQVisual";
import { EditingFields, sharingDraft, sharingUpdate } from "../Builder/SharingFields";

/**
 * The page before a new visual exists, at `/builder/visuals/add`: a name, where
 * it starts from (the default template or a copy of another visual), and who
 * to invite. The same shape as starting a study, and it ends in the builder.
 */
export default function NewVisual({ user }) {
  const { t } = useTranslation("visuals");
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [start, setStart] = useState("template");
  const [sourceId, setSourceId] = useState(null);
  const [draft, setDraft] = useState(sharingDraft(null));
  const [creating, setCreating] = useState(false);

  // Everything the caller can read, so a copy can start from their own, a
  // collaborator's or a published one.
  const { data } = useQuery(MY_VISUALS, {
    variables: {
      where: {
        OR: [
          { author: { id: { equals: user.id } } },
          { collaborators: { some: { id: { equals: user.id } } } },
          { viewers: { some: { id: { equals: user.id } } } },
          { likes: { some: { id: { equals: user.id } } } },
          { published: { equals: true } },
        ],
      },
    },
    skip: start !== "copy",
  });

  const [createVisual] = useMutation(CREATE_VISUAL);
  const [copyVisual] = useMutation(COPY_VISUAL);
  const [updateVisual] = useMutation(UPDATE_VISUAL);

  const canCreate = title.trim() && (start === "template" || sourceId);

  async function onCreate() {
    setCreating(true);
    try {
      let id;
      if (start === "copy") {
        const copied = await copyVisual({ variables: { id: sourceId } });
        id = copied.data?.copyVisual?.id;
        await updateVisual({
          variables: {
            id,
            data: { title: title.trim(), ...sharingUpdate(draft) },
          },
        });
      } else {
        const created = await createVisual({
          variables: {
            data: {
              title: title.trim(),
              author: { connect: { id: user.id } },
              collaborators: { connect: draft.collaborators.map((p) => ({ id: p.id })) },
              viewers: { connect: draft.viewers.map((p) => ({ id: p.id })) },
              privacy: draft.privacy,
              participationMode: "sandbox",
              // A new visual declares its parameters in code; the legacy array
              // default would be read as a set of YQ-era parameters.
              parameters: { schemaVersion: 3, bindings: {} },
            },
          },
        });
        id = created.data?.createVisual?.id;
      }
      if (id) router.push(`/builder/visuals/${id}`);
    } finally {
      setCreating(false);
    }
  }

  return (
    <StyledBuilderArea>
      {/* Grows past the viewport when the invite list does, rather than
          centring the form with its top cut off. */}
      <div className="newProject" style={{ height: "auto", minHeight: "100vh" }}>
        <div className="modal">
          <div className="formSections">
            <div className="formSection">
              <div className="title">{t("nameYourVisual", "Name your visual")}</div>
              <div className="helpText">
                {t(
                  "nameYourVisualHelp",
                  "Give your visual a name. You can change it later in its settings."
                )}
              </div>
              <Input
                aria-label={t("nameYourVisual", "Name your visual")}
                placeholder={t("visualNamePlaceholder", "The name of my visual is")}
                value={title}
                onChange={setTitle}
              />
            </div>

            <div className="formSection">
              <div className="title">{t("startFrom", "Start from")}</div>
              <ButtonGroup
                fullWidth
                aria-label={t("startFrom", "Start from")}
                value={start}
                items={[
                  { value: "template", label: t("defaultTemplate", "Default template") },
                  { value: "copy", label: t("copyAVisual", "Copy a visual") },
                ]}
                onChange={setStart}
              />
              {start === "copy" ? (
                <DropdownSelect
                  portal
                  searchableSingle
                  ariaLabel={t("visualToCopy", "Visual to copy")}
                  placeholder={t("chooseAVisual", "Choose a visual")}
                  value={sourceId}
                  options={(data?.visuals || []).map((visual) => ({
                    value: visual.id,
                    label: visual.title,
                  }))}
                  onChange={setSourceId}
                />
              ) : null}
            </div>

            <div className="formSection">
              <div className="title">{t("inviteCollaborators", "Invite people")}</div>
              <div className="helpText">
                {t(
                  "inviteCollaboratorsHelp",
                  "Editors can change the visual with you. Viewers can only open it."
                )}
              </div>
              <EditingFields
                visual={{ author: { id: user.id } }}
                draft={draft}
                setDraft={setDraft}
                isOwner
              />
            </div>
          </div>

          <div className="createAction createActionSplit">
            <Button
              variant="outline"
              type="button"
              onClick={() => router.push("/dashboard/develop")}
            >
              {t("backToHome", "← Back to home")}
            </Button>
            <Button
              variant="filled"
              disabled={!canCreate || creating}
              onClick={onCreate}
            >
              {t("createVisual", "Create Visual")}
            </Button>
          </div>
        </div>
      </div>
    </StyledBuilderArea>
  );
}
