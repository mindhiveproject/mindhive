import { useEffect, useState } from "react";
import { useMutation } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import Modal from "../../../DesignSystem/Modal";
import Button from "../../../DesignSystem/Button";
import Collaborators from "../../../Global/Collaborators";
import { UPDATE_STUDY } from "../../../Mutations/Study";

// Opened from the collaborator(s) cell of the class Studies table. Class staff
// can change a study's collaborators (people of this class); others only see
// the list. The author is always part of the study and is not editable here.
export default function StudyCollaboratorsModal({
  study,
  classId,
  readOnly,
  onClose,
}) {
  const { t } = useTranslation("classes");
  const [draft, setDraft] = useState([]);

  useEffect(() => {
    setDraft(
      (study?.collaborators || []).filter((c) => c?.id !== study?.author?.id)
    );
  }, [study]);

  const [updateStudy, { loading }] = useMutation(UPDATE_STUDY, {
    refetchQueries: ["GET_CLASS", "STUDENT_CLASS_QUERY"],
    awaitRefetchQueries: true,
  });

  if (!study) return null;

  const original = (study.collaborators || [])
    .filter((c) => c?.id !== study.author?.id)
    .map((c) => c.id)
    .sort();
  const next = draft.map((c) => c.id).sort();
  const changed =
    original.length !== next.length || original.some((id, i) => id !== next[i]);

  const save = async () => {
    try {
      await updateStudy({
        variables: {
          id: study.id,
          input: {
            collaborators: {
              set: draft.map((c) => ({ id: c.id })),
            },
          },
        },
      });
      onClose();
    } catch (err) {
      alert(err?.message);
    }
  };

  const title = t("studies.collaboratorsModalTitle", { title: study.title }, {
    default: `Collaborators of "${study.title}"`,
  });

  return (
    <Modal
      open
      onClose={() => !loading && onClose()}
      maxWidth={560}
      title={title}
      actions={
        readOnly ? (
          <Button variant="filled" onClick={onClose}>
            {t("studies.close", {}, { default: "Close" })}
          </Button>
        ) : (
          <>
            <Button variant="text" disabled={loading} onClick={onClose}>
              {t("studies.cancel", {}, { default: "Cancel" })}
            </Button>
            <Button
              variant="filled"
              disabled={loading || !changed}
              onClick={save}
            >
              {loading
                ? t("studies.saving", {}, { default: "Saving" })
                : t("studies.save", {}, { default: "Save" })}
            </Button>
          </>
        )
      }
    >
      <h2 className="MH-Type-Title-Small">
        {t("studies.author", {}, { default: "Author" })}
      </h2>
      <p>{study.author?.username || "—"}</p>

      <h2 className="MH-Type-Title-Small">
        {t("studies.collaborators")}
      </h2>
      {readOnly ? (
        <p>
          {draft.length
            ? draft.map((c) => c.username).join(", ")
            : t("studies.noCollaborators", {}, {
                default: "No collaborators yet",
              })}
        </p>
      ) : (
        <>
          <p className="MH-Type-Body-Small" style={{ marginTop: 0 }}>
            {t("studies.collaboratorsModalHint", {}, {
              default:
                "Collaborators can edit the study. You can add people from this class.",
            })}
          </p>
          <Collaborators
            userClasses={classId ? [classId] : []}
            collaborators={draft}
            excludeUserId={study.author?.id}
            handleChange={({ target: { value } }) => setDraft(value || [])}
          />
        </>
      )}
    </Modal>
  );
}
