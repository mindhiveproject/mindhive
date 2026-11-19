import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import Modal from "../../../../DesignSystem/Modal";
import Button from "../../../../DesignSystem/Button";
import Checkbox from "../../../../DesignSystem/Checkbox";
import { SET_DATASOURCE_CLASS_SHARING } from "../../../../Mutations/Datasource";
import { GET_DATASOURCE_LINKED_CLASSES } from "../../../../Queries/Datasource";
import { collectDatasourceLinkedClassIds } from "../../../../../lib/dataJournalDatasources";

/**
 * Lets a teacher choose which of their classes may see a dataset. Students of
 * a class only see datasets a teacher shared this way.
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   datasource: { id: string, title?: string, dataOrigin?: string, sharedWithClasses?: Array<{ id: string }> },
 *   staffClasses: Array<{ id: string, title?: string, code?: string }>,
 * }} props
 */
export default function ShareWithClassModal({
  open,
  onClose,
  datasource,
  staffClasses,
}) {
  const { t } = useTranslation("builder");
  const [setSharing] = useMutation(SET_DATASOURCE_CLASS_SHARING, {
    refetchQueries: ["GET_DATASOURCES"],
    awaitRefetchQueries: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  const initiallyShared = useMemo(
    () =>
      new Set(
        (datasource?.sharedWithClasses || [])
          .map((c) => c?.id)
          .filter(Boolean),
      ),
    [datasource?.sharedWithClasses],
  );
  const [selected, setSelected] = useState(initiallyShared);

  useEffect(() => {
    if (open) {
      setSelected(new Set(initiallyShared));
      setError(null);
      setConfirmed(false);
    }
  }, [open, initiallyShared]);

  // Classes linked to the dataset's study or project come first: they are
  // usually the ones a teacher means. Not part of the dataset list (one query
  // per row each), so loaded when the modal opens.
  const { data: linkedData } = useQuery(GET_DATASOURCE_LINKED_CLASSES, {
    variables: { id: datasource?.id },
    skip: !open || !datasource?.id,
  });
  const linkedSource = linkedData?.datasource;
  const orderedClasses = useMemo(() => {
    const linked = new Set(collectDatasourceLinkedClassIds(linkedSource));
    const list = (staffClasses || []).map((cl) => ({
      ...cl,
      linked: linked.has(cl.id),
    }));
    return [
      ...list.filter((cl) => cl.linked),
      ...list.filter((cl) => !cl.linked),
    ];
  }, [linkedSource, staffClasses]);

  const toggle = (classId, next) => {
    setSelected((prev) => {
      const copy = new Set(prev);
      if (next) copy.add(classId);
      else copy.delete(classId);
      return copy;
    });
  };

  const changes = (staffClasses || [])
    .map((cl) => ({ classId: cl.id, shared: selected.has(cl.id) }))
    .filter(({ classId, shared }) => shared !== initiallyShared.has(classId));

  const handleSave = async () => {
    if (!changes.length) {
      onClose();
      return;
    }
    setSaving(true);
    setError(null);
    try {
      for (const change of changes) {
        // one call per class; the server checks the caller teaches each one
        // eslint-disable-next-line no-await-in-loop
        await setSharing({
          variables: { datasourceIds: [datasource.id], ...change },
        });
      }
      onClose({ saved: true });
    } catch (e) {
      setError(
        e?.message ||
          t("dataJournal.datasets.share.error", {}, {
            default: "Sharing could not be saved. Try again.",
          }),
      );
    } finally {
      setSaving(false);
    }
  };

  const isStudyData =
    datasource?.dataOrigin === "STUDY" || datasource?.dataOrigin === "TEMPLATE";
  // Sharing participant data with a new class needs an explicit
  // acknowledgement; removing a class never does.
  const addsClass = changes.some((change) => change.shared);
  const needsConfirm = isStudyData && addsClass;
  const saveBlocked = saving || (needsConfirm && !confirmed);

  return (
    <Modal
      open={open}
      onClose={() => !saving && onClose()}
      maxWidth={480}
      maxHeight="85vh"
      title={
        <span className="MH-Type-Title-Small">
          {t("dataJournal.datasets.share.title", {}, {
            default: "Share with your classes",
          })}
        </span>
      }
      actions={
        <>
          <Button variant="text" onClick={() => onClose()} disabled={saving}>
            {t("dataJournal.datasets.share.cancel", {}, { default: "Cancel" })}
          </Button>
          <Button variant="filled" onClick={handleSave} disabled={saveBlocked}>
            {saving
              ? t("dataJournal.datasets.share.saving", {}, {
                  default: "Saving…",
                })
              : t("dataJournal.datasets.share.save", {}, { default: "Save" })}
          </Button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <p className="MH-Type-Body-Base" style={{ margin: 0 }}>
          {t(
            "dataJournal.datasets.share.intro",
            { title: datasource?.title || "" },
            {
              default:
                "Students and staff of the classes you tick can see “{{title}}” in their dataset library.",
            },
          )}
        </p>
        {isStudyData ? (
          <div
            role="note"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              padding: "12px 14px",
              borderRadius: 8,
              border: "1px solid var(--MH-Theme-Accent-Base, #F2BE42)",
              background: "#FFF8E6",
              color: "#171717",
            }}
          >
            <span className="MH-Type-Label-Base" style={{ display: "flex", gap: 8 }}>
              {t("dataJournal.datasets.share.studyWarningTitle", {}, {
                default: "You are sharing participant data",
              })}
            </span>
            <ul
              className="MH-Type-Body-Small"
              style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4 }}
            >
              <li>
                {t("dataJournal.datasets.share.studyWarningAnswers", {}, {
                  default:
                    "Everyone in the classes you tick will see every included participant's answers to every task in this study.",
                })}
              </li>
              <li>
                {t("dataJournal.datasets.share.studyWarningIds", {}, {
                  default:
                    "Participants appear under public ids, not names or emails, along with their class codes. Classmates may still recognise each other from their answers.",
                })}
              </li>
              <li>
                {t("dataJournal.datasets.share.studyWarningCopies", {}, {
                  default:
                    "Students can download the data or save their own copy. Unsharing later does not remove those.",
                })}
              </li>
              <li>
                {t("dataJournal.datasets.share.studyWarningConsent", {}, {
                  default:
                    "Only share if your participants' consent allows their data to be shown to these classes.",
                })}
              </li>
            </ul>
          </div>
        ) : null}
        <ul
          style={{
            listStyle: "none",
            margin: 0,
            padding: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {orderedClasses.map((cl) => {
            const labelId = `share-class-${datasource?.id}-${cl.id}`;
            return (
              <li
                key={cl.id}
                style={{ display: "flex", alignItems: "center", gap: 4 }}
              >
                <Checkbox
                  checked={selected.has(cl.id)}
                  onChange={(next) => toggle(cl.id, next)}
                  disabled={saving}
                  ariaLabelledBy={labelId}
                />
                <span
                  id={labelId}
                  className="MH-Type-Body-Base"
                  style={{ color: "#171717", cursor: "pointer" }}
                  onClick={() =>
                    !saving && toggle(cl.id, !selected.has(cl.id))
                  }
                >
                  {cl.title ||
                    t("dataJournal.datasets.share.untitledClass", {}, {
                      default: "Untitled class",
                    })}
                  {cl.code ? (
                    <span style={{ color: "#5D5763" }}> · {cl.code}</span>
                  ) : null}
                  {cl.linked ? (
                    <span style={{ color: "#336F8A" }}>
                      {" · "}
                      {t("dataJournal.datasets.share.linkedClass", {}, {
                        default: "linked to this study or project",
                      })}
                    </span>
                  ) : null}
                </span>
              </li>
            );
          })}
        </ul>
        {needsConfirm ? (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Checkbox
              checked={confirmed}
              onChange={setConfirmed}
              disabled={saving}
              ariaLabelledBy={`share-confirm-${datasource?.id}`}
            />
            <span
              id={`share-confirm-${datasource?.id}`}
              className="MH-Type-Body-Base"
              style={{ color: "#171717", cursor: "pointer" }}
              onClick={() => !saving && setConfirmed((v) => !v)}
            >
              {t("dataJournal.datasets.share.studyConfirm", {}, {
                default:
                  "I understand these classes will see this participant data.",
              })}
            </span>
          </div>
        ) : null}
        {error ? (
          <p
            role="alert"
            className="MH-Type-Body-Base"
            style={{ margin: 0, color: "#c62828" }}
          >
            {error}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
