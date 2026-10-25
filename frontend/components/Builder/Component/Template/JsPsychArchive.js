import useTranslation from "next-translate/useTranslation";

import DisplayError from "../../../ErrorMessage";
import { describeEnvelope } from "../../../../lib/runtime/jspsychEnvelope";

const ENVELOPE = describeEnvelope();

function megabytes(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * The jsPsych side of the Template tab (W14): the experiment's title and
 * description, its zip, and the envelope it has to fit, so a researcher can
 * check their package before uploading. Upload problems the server found
 * are listed here too. Lives in `inputs.jsPsych`.
 */
export default function JsPsychArchive({
  jsPsych,
  handleMultipleUpdate,
  loading,
  error,
}) {
  const { t } = useTranslation("builder");
  const update = (fields) =>
    handleMultipleUpdate({ jsPsych: { ...jsPsych, ...fields } });

  return (
    <>
      <DisplayError error={error} />

      <fieldset disabled={loading} aria-busy={loading}>
        <div className="block">
          <label htmlFor="jsPsychTitle">
            {t("jsPsych.title", {}, { default: "Experiment title" })}
          </label>
          <input
            id="jsPsychTitle"
            type="text"
            value={jsPsych?.title || ""}
            onChange={(e) => update({ title: e.target.value })}
            required
          />
        </div>

        <div className="block">
          <label htmlFor="jsPsychDescription">
            {t("jsPsych.description", {}, { default: "Experiment description" })}
          </label>
          <textarea
            id="jsPsychDescription"
            value={jsPsych?.description || ""}
            onChange={(e) => update({ description: e.target.value })}
          />
        </div>

        <div className="block">
          <label htmlFor="jsPsychArchive">
            {t("jsPsych.archive", {}, { default: "jsPsych experiment (zip)" })}
          </label>
          <input
            id="jsPsychArchive"
            type="file"
            accept=".zip,application/zip"
            onChange={(e) =>
              update({ file: e.target.files?.[0] || null, problems: [] })
            }
          />
          {jsPsych?.file && (
            <p>
              {jsPsych.file.name} · {megabytes(jsPsych.file.size)}
            </p>
          )}
        </div>

        {jsPsych?.problems?.length > 0 && (
          <div className="block" role="alert">
            <p>
              {t(
                "jsPsych.refused",
                {},
                { default: "This archive can't be used yet:" }
              )}
            </p>
            <ul>
              {jsPsych.problems.map((problem) => (
                <li key={problem}>{problem}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="block">
          <h3>
            {t(
              "jsPsych.envelopeTitle",
              { version: ENVELOPE.jsPsychVersion },
              { default: "What MindHive provides: jsPsych {{version}}" }
            )}
          </h3>
          <ul>
            <li>
              {t(
                "jsPsych.ruleEntry",
                {},
                {
                  default:
                    "Put an index.html at the top of the zip; it is the page the task opens.",
                }
              )}
            </li>
            <li>
              {t(
                "jsPsych.ruleNoBundle",
                {},
                {
                  default:
                    "Don't include jsPsych or its plugins, or load them from a CDN: MindHive adds them. Use the globals, such as initJsPsych and jsPsychHtmlKeyboardResponse.",
                }
              )}
            </li>
            <li>
              {t(
                "jsPsych.ruleParams",
                {},
                {
                  default:
                    "Build and run your timeline inside MindHive.onInit(…) and read settings from MindHive.params. Declare them in an optional mindhive.json: { \"parameters\": [{ \"name\": \"trials\", \"type\": \"number\", \"value\": 20 }] }.",
                }
              )}
            </li>
            <li>
              {t(
                "jsPsych.ruleAggregate",
                {},
                {
                  default:
                    "Return an object from on_finish to save summary results.",
                }
              )}
            </li>
          </ul>
          <details>
            <summary>
              {t(
                "jsPsych.pluginsAvailable",
                { count: ENVELOPE.plugins.length },
                { default: "{{count}} plugins available" }
              )}
            </summary>
            <ul>
              {ENVELOPE.plugins.map((plugin) => (
                <li key={plugin.name}>
                  <code>{plugin.global}</code> — {plugin.name} {plugin.version}
                </li>
              ))}
            </ul>
          </details>
          <details>
            <summary>
              {t(
                "jsPsych.pluginsExcluded",
                {},
                {
                  default:
                    "Not available: plugins that need a camera, microphone or eye tracker",
                }
              )}
            </summary>
            <ul>
              {ENVELOPE.excluded.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          </details>
        </div>
      </fieldset>
    </>
  );
}
