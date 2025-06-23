import DisplayError from "../../../ErrorMessage";

import assemble from "../../../Labjs/Assemble/index";

import useTranslation from "next-translate/useTranslation";
import TemplateParameters from "./Parameters";
import Collaborators from "../../../Global/Collaborators";

import Download from "./Download";

export default function Template({
  template,
  handleChange,
  handleMultipleUpdate,
  loading,
  error,
}) {
  const { t } = useTranslation("builder");

  const collaborators =
    (template && template?.collaborators?.map((c) => c?.id)) || [];

  const handleTemplateChange = (e) => {
    let { value, name, type } = e.target;
    handleMultipleUpdate({
      template: { ...template, [name]: value },
    });
  };

  const deleteTemplateLocally = () => {
    handleMultipleUpdate({
      template: {
        ...template,
        script: null,
        style: null,
        parameters: null,
        file: null,
        scriptAddress: null,
        fileAddress: null,
      },
    });
  };

  const handleScriptUpload = async (e) => {
    const fileReader = new FileReader();
    const fileName =
      e.target.files[0].name && e.target.files[0].name.split(".")[0];
    fileReader.onload = async (fileLoadedEvent) => {
      const file = JSON.parse(fileLoadedEvent.target.result);
      const result = await assemble(file, fileName);
      const script = result.files["script.js"].content;
      handleMultipleUpdate({
        template: {
          ...template,
          parameters: [...result.files.parameters],
          style: result.files["style.css"].content,
          script: script, // string
          file: JSON.parse(fileLoadedEvent.target.result), // JSON object
        },
      });
    };
    fileReader.readAsText(e.target.files[0]);
  };

  return (
    <>
      <DisplayError error={error} />

      <fieldset disabled={loading} aria-busy={loading}>
        <div className="block">
          <label htmlFor="title">{t("template.title", "Template title")}</label>
          <input
            type="text"
            name="title"
            value={template?.title}
            onChange={handleTemplateChange}
            required
          />
        </div>

        <div className="block">
          <label htmlFor="description">{t("template.description", "Template description")}</label>
          <textarea
            id="description"
            name="description"
            value={template?.description}
            onChange={handleTemplateChange}
          />
        </div>

        <div className="block">
          <label>{t("template.labjsScript", "lab.js script (JSON file)")}</label>
          {template?.fileAddress && (
            <Download
              name={template?.slug}
              fileAddress={template?.fileAddress}
            />
          )}
          {template?.scriptAddress ? (
            <div>
              {template?.createdAt && (
                <div>
                  {t("template.createdOn", "Created on")} {moment(template?.createdAt).format("MMMM D, YYYY, h:mm")}
                </div>
              )}

              {template?.updatedAt && (
                <div>
                  {t("template.updatedOn", "Last updated on")} {moment(template?.updatedAt).format("MMMM D, YYYY, h:mm")}
                </div>
              )}

              <div>
                <button onClick={deleteTemplateLocally}>
                  {t("template.deleteAndReupload", "Delete and reupload")}
                </button>
              </div>
            </div>
          ) : (
            <input
              type="file"
              id="script"
              name="script"
              onChange={handleScriptUpload}
              accept=".json"
            />
          )}
        </div>

        <div className="block">
          <label>{t("template.collaborators", "Collaborators on the template")}</label>
          <Collaborators
            collaborators={collaborators}
            handleChange={handleTemplateChange}
          />
        </div>

        <div className="wideBlock">
          <TemplateParameters template={template} handleChange={handleChange} />
        </div>
      </fieldset>
    </>
  );
}
