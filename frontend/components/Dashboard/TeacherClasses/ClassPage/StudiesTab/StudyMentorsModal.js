import { useMutation } from "@apollo/client";
import { useState } from "react";
import useTranslation from "next-translate/useTranslation";

import Modal from "../../../../DesignSystem/Modal";
import Button from "../../../../DesignSystem/Button";
import DropdownSelect from "../../../../DesignSystem/DropdownSelect";
import { UPDATE_STUDY } from "../../../../Mutations/Study";

const personName = (p) =>
  [p?.firstName, p?.lastName].filter(Boolean).join(" ").trim() || p?.username;

/**
 * Opened from the Mentors cell of the class Studies table. Mentors are study
 * collaborators from the class's teaching team; the teacher picks them among
 * the team members with a mentor or teacher permission. Other collaborators
 * are kept as they are.
 */
export default function StudyMentorsModal({
  study,
  staff,
  mentorSet,
  onClose,
}) {
  const { t } = useTranslation("classes");
  const authorId = study?.author?.id;
  const collaborators = (study?.collaborators || []).filter(
    (c) => c?.id && c.id !== authorId
  );
  const currentMentors = collaborators.filter((c) => mentorSet.has(c.id));
  const [picked, setPicked] = useState(() => currentMentors.map((c) => c.id));

  const [updateStudy, { loading }] = useMutation(UPDATE_STUDY, {
    refetchQueries: ["GET_CLASS", "STUDENT_CLASS_QUERY"],
    awaitRefetchQueries: true,
  });

  if (!study) return null;

  // The teaching team, plus mentors already on the study who are not on it
  // (so opening the modal never drops them).
  const optionsById = new Map();
  for (const person of [...staff, ...currentMentors]) {
    if (person?.id && person.id !== authorId && !optionsById.has(person.id)) {
      optionsById.set(person.id, person);
    }
  }
  const options = [...optionsById.values()].map((p) => ({
    value: p.id,
    label: personName(p),
    labelText: personName(p),
  }));

  const original = currentMentors.map((c) => c.id).sort();
  const next = [...picked].sort();
  const changed =
    original.length !== next.length || original.some((id, i) => id !== next[i]);

  const save = async () => {
    const others = collaborators.filter((c) => !mentorSet.has(c.id));
    try {
      await updateStudy({
        variables: {
          id: study.id,
          input: {
            collaborators: {
              set: [...others.map((c) => c.id), ...picked].map((id) => ({
                id,
              })),
            },
          },
        },
      });
      onClose();
    } catch (err) {
      alert(err?.message);
    }
  };

  return (
    <Modal
      open
      onClose={() => !loading && onClose()}
      maxWidth={560}
      title={t("studies.mentorsModal.title", { title: study.title }, {
        default: "Mentors of “{{title}}”",
      })}
      actions={
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
      }
    >
      <p className="MH-Type-Body-Small" style={{ marginTop: 0 }}>
        {t("studies.mentorsModal.hint", {}, {
          default:
            "Mentors can edit the study. You can add people from this class's teaching team who have a mentor or teacher account.",
        })}
      </p>
      {options.length ? (
        <DropdownSelect
          multiple
          options={options}
          value={picked}
          onChange={setPicked}
          portal
          placeholder={t("studies.mentorsModal.pick", {}, {
            default: "Add mentors",
          })}
        />
      ) : (
        <p className="MH-Type-Body-Small" style={{ margin: 0 }}>
          {t("studies.mentorsModal.empty", {}, {
            default:
              "No one on this class's teaching team has a mentor or teacher account yet.",
          })}
        </p>
      )}
    </Modal>
  );
}
