import { useMutation } from "@apollo/client";
import { useState } from "react";
import useTranslation from "next-translate/useTranslation";

import Modal from "../../../../DesignSystem/Modal";
import Button from "../../../../DesignSystem/Button";
import DropdownSelect from "../../../../DesignSystem/DropdownSelect";
import { peopleOption } from "../Dashboard/Modals/peopleOption";
import { UPDATE_STUDY } from "../../../../Mutations/Study";
import { projectPeople, studyRefetchQueries } from "./studyProjects";

// Links a study to a student project of the class; the project's team
// (students and mentors) joins the study.
export default function LinkStudyProjectModal({
  myclass,
  study,
  projects,
  onClose,
}) {
  const { t } = useTranslation("classes");
  const [projectId, setProjectId] = useState(null);

  const [updateStudy, { loading }] = useMutation(UPDATE_STUDY, {
    refetchQueries: studyRefetchQueries(myclass),
    awaitRefetchQueries: true,
  });

  if (!study) return null;

  const untitled = t("studies.newStudy.untitledProject", {}, {
    default: "Untitled project",
  });
  const mainGroup = t("studies.newStudy.mainProjects", {}, {
    default: "Main projects",
  });
  const otherGroup = t("studies.newStudy.otherProjects", {}, {
    default: "Other projects",
  });
  const options = projects
    .filter((p) => p?.study?.id !== study.id)
    .map((p) => ({
      ...peopleOption(p, untitled),
      group: p.isMain ? mainGroup : otherGroup,
    }));
  const project = projects.find((p) => p.id === projectId);

  const link = async () => {
    if (!project) return;
    try {
      await updateStudy({
        variables: {
          id: study.id,
          input: {
            proposal: { connect: { id: project.id } },
            collaborators: {
              connect: projectPeople(project).map((p) => ({ id: p.id })),
            },
          },
        },
      });
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
      title={t("studies.linkProject.title", { title: study.title }, {
        default: "Link “{{title}}” to a project",
      })}
      actions={
        <>
          <Button variant="text" disabled={loading} onClick={onClose}>
            {t("studies.cancel", {}, { default: "Cancel" })}
          </Button>
          <Button
            variant="filled"
            disabled={!project || loading}
            onClick={link}
          >
            {loading
              ? t("studies.saving", {}, { default: "Saving" })
              : t("studies.linkProject.link", {}, { default: "Link study" })}
          </Button>
        </>
      }
    >
      <p className="MH-Type-Body-Small" style={{ marginTop: 0 }}>
        {t("studies.linkProject.hint", {}, {
          default:
            "The project's students and mentors are added to the study as collaborators.",
        })}
      </p>
      <DropdownSelect
        options={options}
        value={projectId}
        onChange={setProjectId}
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
            "studies.linkProject.replacesStudy",
            { title: project.study.title || untitled },
            {
              default:
                "This project is linked to “{{title}}”. Linking replaces it; that study is kept.",
            }
          )}
        </p>
      ) : null}
    </Modal>
  );
}
