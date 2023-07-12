import { StyledForm } from "../../../styles/StyledForm";
import DisplayError from "../../../ErrorMessage";

import lz from "lzutf8";
import assemble from "../../../Labjs/Assemble/index";

import useTranslation from "next-translate/useTranslation";
import TemplateParameters from "./Parameters";
import Collaborators from "../../../Global/Collaborators";

export default function Template({
  template,
  handleChange,
  handleMultipleUpdate,
  loading,
  error,
}) {
  // console.log({ template });
  const { t } = useTranslation("classes");

  const collaborators =
    (template && template?.collaborators?.map((c) => c?.id)) || [];

  const handleTemplateChange = (e) => {
    let { value, name, type } = e.target;
    // console.log(value, name, type);
    handleMultipleUpdate({
      template: { ...template, [name]: value },
    });
  };

  const downloadJSON = ({ file, name }) => {
    // create file in browser
    const fileToOpen = lz.decompress(lz.decodeBase64(file));
    // const json = JSON.stringify(file, null, 2);
    const blob = new Blob([fileToOpen], { type: "application/json" });
    const href = URL.createObjectURL(blob);

    // create "a" HTLM element with href to file
    const link = document.createElement("a");
    link.href = href;
    link.download = `${name}.json`;
    document.body.appendChild(link);
    link.click();

    // clean up "a" element & remove ObjectURL
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
  };

  const deleteTemplateLocally = () => {
    handleMultipleUpdate({
      template: {
        ...template,
        script: null,
        style: null,
        parameters: null,
        file: null,
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
      const compressedString = lz.encodeBase64(lz.compress(script));
      const fileToSave = lz.encodeBase64(
        lz.compress(fileLoadedEvent.target.result)
      );
      //   const fileToSave = lz.compress(fileLoadedEvent.target.result);
      handleMultipleUpdate({
        template: {
          ...template,
          script: compressedString,
          style: result.files["style.css"].content,
          parameters: [...result.files.parameters],
          file: fileToSave,
        },
      });
    };
    fileReader.readAsText(e.target.files[0]);
  };

  return (
    <>
      <StyledForm>
        <DisplayError error={error} />

        <fieldset disabled={loading} aria-busy={loading}>
          <div className="infoPane">
            <label htmlFor="title">
              Template title
              <input
                type="text"
                name="title"
                value={template?.title}
                onChange={handleTemplateChange}
                required
              />
            </label>

            <div>
              <label htmlFor="description">
                Template description
                <textarea
                  id="description"
                  rows="50"
                  name="description"
                  value={template?.description}
                  onChange={handleTemplateChange}
                />
              </label>
            </div>

            <div>
              <h2>lab.js script (JSON file)</h2>
              {template?.file && (
                <p>
                  <a
                    onClick={() =>
                      downloadJSON({
                        file: template?.file,
                        name: template?.title,
                      })
                    }
                  >
                    Download JSON file
                  </a>
                </p>
              )}
              {template?.script ? (
                <div>
                  {template?.createdAt && (
                    <div>
                      Created on{" "}
                      {moment(template?.createdAt).format("MMMM D, YYYY, h:mm")}
                    </div>
                  )}

                  {template?.updatedAt && (
                    <div>
                      Last updated on{" "}
                      {moment(template?.updatedAt).format("MMMM D, YYYY, h:mm")}
                    </div>
                  )}

                  <div>
                    <button onClick={deleteTemplateLocally}>
                      Delete and reupload
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
          </div>
        </fieldset>
      </StyledForm>
      <h2>Collaborators on the template</h2>
      <Collaborators
        collaborators={collaborators}
        handleChange={handleTemplateChange}
      />
      <TemplateParameters template={template} handleChange={handleChange} />
    </>
  );
}
