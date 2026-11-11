import { useMutation } from "@apollo/client";
import { useState } from "react";
import useTranslation from "next-translate/useTranslation";

import Modal from "../../../../DesignSystem/Modal";
import Button from "../../../../DesignSystem/Button";
import Chip from "../../../../DesignSystem/Chip";
import Input from "../../../../DesignSystem/Input";
import DropdownSelect from "../../../../DesignSystem/DropdownSelect";
import { peopleOption } from "../Dashboard/Modals/peopleOption";
import { UPDATE_PROJECT_BOARD } from "../../../../Mutations/Proposal";
import {
  DEFAULT_STUDY_SETTINGS,
  projectPeople,
  studyRefetchQueries,
} from "./studyProjects";

const FIELD_GAP = { display: "flex", flexDirection: "column", gap: 16 };
const CHIP_ROW = { display: "flex", flexWrap: "wrap", gap: 4 };

// Creates a study for a student project of the class. The project's team joins
// it, with the mentors the teacher picks (the project's mentors to start with).
export default function NewStudyModal({
  myclass,
  projects,
  mentorIds,
  onClose,
  onCreated,
}) {
  const { t } = useTranslation("classes");
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState(null);
  const [pickedMentorIds, setPickedMentorIds] = useState([]);

  const [updateProject, { loading }] = useMutation(UPDATE_PROJECT_BOARD, {
    refetchQueries: studyRefetchQueries(myclass),
    awaitRefetchQueries: true,
  });

  const project = projects.find((p) => p.id === projectId);
  const people = projectPeople(project);
  const students = people.filter((p) => !mentorIds.has(p.id));

  const untitled = t("studies.newStudy.untitledProject", {}, {
    default: "Untitled project",
  });
  const mainGroup = t("studies.newStudy.mainProjects", {}, {
    default: "Main projects",
  });
  const otherGroup = t("studies.newStudy.otherProjects", {}, {
    default: "Other projects",
  });
  const projectOptions = projects.map((p) => ({
    ...peopleOption(p, untitled),
    group: p.isMain ? mainGroup : otherGroup,
  }));

  // The class's mentors, plus any mentor already on the project.
  const mentorsById = new Map();
  for (const mentor of myclass?.mentors || []) {
    if (mentor?.id) mentorsById.set(mentor.id, mentor);
  }
  for (const person of people) {
    if (mentorIds.has(person.id)) mentorsById.set(person.id, person);
  }
  const mentorOptions = [...mentorsById.values()].map((m) => ({
    value: m.id,
    labelText: m.username,
    label: m.username,
  }));

  const pickProject = (id) => {
    setProjectId(id);
    const next = projects.find((p) => p.id === id);
    setPickedMentorIds(
      projectPeople(next)
        .filter((p) => mentorIds.has(p.id))
        .map((p) => p.id)
    );
  };

  const canCreate = Boolean(title.trim() && project) && !loading;

  const create = async () => {
    if (!canCreate) return;
    const memberIds = new Set([
      ...students.map((p) => p.id),
      ...pickedMentorIds,
    ]);
    try {
      await updateProject({
        variables: {
          id: project.id,
          input: {
            study: {
              create: {
                title: title.trim(),
                classes: { connect: { id: myclass?.id } },
                settings: DEFAULT_STUDY_SETTINGS,
                collaborators: {
                  connect: [...memberIds].map((id) => ({ id })),
                },
              },
            },
          },
        },
      });
      onCreated?.(title.trim());
      onClose();
    } catch (error) {
      alert(error?.message);
    }
  };

  return (
    <Modal
      open
      onClose={() => !loading && onClose()}
      maxWidth={560}
      title={t("studies.newStudy.title", {}, { default: "New study" })}
      actions={
        <>
          <Button variant="text" disabled={loading} onClick={onClose}>
            {t("studies.cancel", {}, { default: "Cancel" })}
          </Button>
          <Button variant="filled" disabled={!canCreate} onClick={create}>
            {loading
              ? t("studies.newStudy.creating", {}, { default: "Creating" })
              : t("studies.newStudy.create", {}, { default: "Create study" })}
          </Button>
        </>
      }
    >
      <div style={FIELD_GAP}>
        <Input
          label={t("studies.newStudy.studyTitle", {}, {
            default: "Study title",
          })}
          value={title}
          onChange={setTitle}
        />

        <div>
          <p className="MH-Type-Label-Base" style={{ margin: "0 0 4px" }}>
            {t("studies.newStudy.project", {}, { default: "Student project" })}
          </p>
          <DropdownSelect
            options={projectOptions}
            value={projectId}
            onChange={pickProject}
            searchableSingle
            portal
            placeholder={t("studies.newStudy.pickProject", {}, {
              default: "Pick the project this study is for",
            })}
            searchPlaceholder={t("studies.newStudy.searchProjects", {}, {
              default: "Search by project title or student",
            })}
          />
          {project?.study ? (
            <p className="MH-Type-Body-Small" style={{ margin: "8px 0 0" }}>
              {t(
                "studies.newStudy.replacesStudy",
                { title: project.study.title || untitled },
                {
                  default:
                    "This project is linked to “{{title}}”. The new study replaces that link; the old study is kept.",
                }
              )}
            </p>
          ) : null}
        </div>

        {project ? (
          <>
            <div>
              <p className="MH-Type-Label-Base" style={{ margin: "0 0 4px" }}>
                {t("studies.newStudy.collaborators", {}, {
                  default: "Collaborators",
                })}
              </p>
              {students.length ? (
                <div style={CHIP_ROW}>
                  {students.map((p) => (
                    <Chip key={p.id} variant="static" label={p.username} />
                  ))}
                </div>
              ) : (
                <p className="MH-Type-Body-Small" style={{ margin: 0 }}>
                  {t("studies.noCollaborators", {}, {
                    default: "No collaborators yet",
                  })}
                </p>
              )}
            </div>

            <div>
              <p className="MH-Type-Label-Base" style={{ margin: "0 0 4px" }}>
                {t("studies.newStudy.mentors", {}, { default: "Mentors" })}
              </p>
              {mentorOptions.length ? (
                <DropdownSelect
                  multiple
                  options={mentorOptions}
                  value={pickedMentorIds}
                  onChange={setPickedMentorIds}
                  portal
                  placeholder={t("studies.newStudy.pickMentors", {}, {
                    default: "Add mentors",
                  })}
                />
              ) : (
                <p className="MH-Type-Body-Small" style={{ margin: 0 }}>
                  {t("studies.newStudy.noMentors", {}, {
                    default: "This class has no mentors yet.",
                  })}
                </p>
              )}
            </div>
          </>
        ) : null}
      </div>
    </Modal>
  );
}
