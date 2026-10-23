import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import Button from "../../../DesignSystem/Button";
import DisplayError from "../../../ErrorMessage";
import {
  RUNTIME_VERSION_STATUS,
  UPDATE_TASK_RUNTIME_VERSION,
} from "../../../Mutations/Runtime";
import { MY_TASK, TASK_TO_EDIT } from "../../../Queries/Task";

const UPLOAD_ROLES = ["ADMIN", "TESTER"];

function ChangeList({ label, names }) {
  if (!names?.length) return null;
  return (
    <li>
      {label}: {names.join(", ")}
    </li>
  );
}

/**
 * A jsPsych block's version (W35): which version it runs, whether a newer
 * one exists, and the update to it. Updating never happens on its own; the
 * researcher sees what changes in the parameters and confirms. While a study
 * that uses the block is collecting data, the update is disabled (the server
 * refuses it too) and the researcher is told to duplicate instead.
 *
 * With `allowUpload`, owners of the experiment can also upload a new version
 * into its family. Blocks keep their version until someone updates them.
 *
 * @param {object} task - Needs `id` and `jsPsychExperiment` (id, title,
 *   family, author, collaborators) when the viewer can read it.
 * @param {object} [user]
 * @param {boolean} [allowUpload=false]
 */
export default function JsPsychVersion({ task, user, allowUpload = false }) {
  const { t } = useTranslation("builder");
  const [confirming, setConfirming] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [problems, setProblems] = useState([]);

  const { data, refetch } = useQuery(RUNTIME_VERSION_STATUS, {
    variables: { taskId: task?.id },
    skip: !task?.id,
    fetchPolicy: "cache-and-network",
  });
  const [updateVersion, { loading: updating, error: updateError }] =
    useMutation(UPDATE_TASK_RUNTIME_VERSION, {
      variables: { taskId: task?.id },
      refetchQueries: [
        { query: MY_TASK, variables: { id: task?.id } },
        { query: TASK_TO_EDIT, variables: { id: task?.id } },
      ],
    });

  const status = data?.runtimeVersionStatus;
  const experiment = task?.jsPsychExperiment;
  const ownsExperiment =
    !!user?.id &&
    !!experiment &&
    (String(experiment.author?.id) === String(user.id) ||
      (experiment.collaborators || []).some(
        (c) => String(c?.id) === String(user.id)
      ));
  const canUpload =
    allowUpload &&
    ownsExperiment &&
    (user?.permissions || []).some((role) => UPLOAD_ROLES.includes(role?.name));

  if (!status) return null;
  const { changes } = status;
  const hasChanges =
    changes.added.length || changes.removed.length || changes.reset.length;

  async function uploadVersion() {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    setProblems([]);
    try {
      const query = new URLSearchParams({
        title: experiment?.title || task?.title || "",
        family: experiment?.family || experiment?.id,
        filename: file.name,
      });
      const response = await fetch(`/api/runtime/upload/jspsych?${query}`, {
        method: "POST",
        headers: { "Content-Type": "application/zip" },
        body: file,
      });
      const result = await response.json().catch(() => ({}));
      if (response.status === 422) {
        setProblems(result.problems || []);
      } else if (!response.ok) {
        throw new Error(result.error || "The version could not be uploaded.");
      } else {
        setFile(null);
        await refetch();
      }
    } catch (error) {
      setUploadError(error);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="block">
      <h3>{t("jsPsychVersion.title", {}, { default: "Experiment version" })}</h3>
      <p>
        {t(
          "jsPsychVersion.current",
          { version: status.currentVersion || "1" },
          { default: "This block runs version {{version}}." }
        )}
      </p>

      {!status.isLatest && (
        <div role="status">
          <p>
            {t(
              "jsPsychVersion.newer",
              { version: status.latestVersion || "?" },
              { default: "A newer version ({{version}}) is available." }
            )}
          </p>

          {status.locked && (
            <p>
              {t(
                "jsPsychVersion.locked",
                { studies: status.lockingStudies.join(", ") },
                {
                  default:
                    "It can't be updated while a study that uses it is collecting data ({{studies}}). Duplicate the study or the block to use the new version.",
                }
              )}
            </p>
          )}

          {!status.locked && !status.canUpdate && (
            <p>
              {t(
                "jsPsychVersion.notEditor",
                {},
                {
                  default:
                    "Only the block's author or a collaborator can update it.",
                }
              )}
            </p>
          )}

          {status.canUpdate && !confirming && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirming(true)}
            >
              {t(
                "jsPsychVersion.update",
                {},
                { default: "Update to the latest version" }
              )}
            </Button>
          )}

          {status.canUpdate && confirming && (
            <div>
              <p>
                {hasChanges
                  ? t(
                      "jsPsychVersion.changes",
                      {},
                      {
                        default:
                          "Your parameter values are kept where they still fit. Updating will change:",
                      }
                    )
                  : t(
                      "jsPsychVersion.noChanges",
                      {},
                      {
                        default:
                          "Your parameters stay as they are; only the experiment's code changes.",
                      }
                    )}
              </p>
              <ul>
                <ChangeList
                  label={t("jsPsychVersion.added", {}, { default: "Added (new default)" })}
                  names={changes.added}
                />
                <ChangeList
                  label={t("jsPsychVersion.removed", {}, { default: "Removed" })}
                  names={changes.removed}
                />
                <ChangeList
                  label={t(
                    "jsPsychVersion.reset",
                    {},
                    { default: "Reset to the new default" }
                  )}
                  names={changes.reset}
                />
              </ul>
              <DisplayError error={updateError} />
              <Button
                type="button"
                variant="filled"
                disabled={updating}
                onClick={async () => {
                  try {
                    await updateVersion();
                    setConfirming(false);
                  } catch {
                    // updateError shows the server's reason (for example the
                    // collecting-data lock) above the button.
                  } finally {
                    await refetch();
                  }
                }}
              >
                {t("jsPsychVersion.confirm", {}, { default: "Update" })}
              </Button>{" "}
              <Button
                type="button"
                variant="text"
                onClick={() => setConfirming(false)}
              >
                {t("jsPsychVersion.cancel", {}, { default: "Cancel" })}
              </Button>
            </div>
          )}
        </div>
      )}

      {canUpload && (
        <fieldset disabled={uploading} aria-busy={uploading}>
          <label htmlFor="jsPsychNewVersion">
            {t(
              "jsPsychVersion.upload",
              {},
              { default: "Upload a new version (zip)" }
            )}
          </label>
          <input
            id="jsPsychNewVersion"
            type="file"
            accept=".zip,application/zip"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <p>
            {t(
              "jsPsychVersion.uploadHint",
              {},
              {
                default:
                  "Blocks keep the version they run until someone updates them.",
              }
            )}
          </p>
          {problems.length > 0 && (
            <ul role="alert">
              {problems.map((problem) => (
                <li key={problem}>{problem}</li>
              ))}
            </ul>
          )}
          <DisplayError error={uploadError} />
          <Button
            type="button"
            variant="outline"
            disabled={!file || uploading}
            onClick={uploadVersion}
          >
            {t("jsPsychVersion.uploadButton", {}, { default: "Upload version" })}
          </Button>
        </fieldset>
      )}
    </div>
  );
}
