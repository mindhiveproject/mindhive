import Tabs from "./Tabs";

export default function Preview({
  user,
  study,
  handleChange,
  handleMultipleUpdate,
  captureFile,
}) {
  const infoBlocks =
    study?.info?.reduce((acc, el) => {
      acc[el.name] = el.text || "";
      return acc;
    }, {}) || {};

  const handleParameterChange = (e, classType) => {
    const { name, type, value, className } = e.target;
    const val = type === "number" ? parseFloat(value) : value;
    const currentInfo = study?.info ? [...study?.info] : [];
    if (currentInfo.filter((el) => el.name === name).length === 0) {
      currentInfo.push({ name });
    }
    const info = currentInfo.map((el) =>
      el.name === name ? { ...el, [className]: val } : el
    );
    handleMultipleUpdate({
      info,
      unsavedChanges: true,
    });
  };

  const deleteParameter = (name) => {
    const info = study.info.filter((p) => p.name !== name);
    handleMultipleUpdate({
      info,
      unsavedChanges: true,
    });
  };

  return (
    <div className="preview">
      <div className="studyInformation">
        <div className="uploadImageContainer">
          <div
            className={
              study?.image?.image?.publicUrlTransformed
                ? "upload-btn-wrapper-with-image"
                : "upload-btn-wrapper"
            }
          >
            <button className="btn">
              {study?.image?.image?.publicUrlTransformed
                ? "Update study image"
                : "Upload study image"}
            </button>
            <input
              type="file"
              id="file"
              name="file"
              onChange={(e) => captureFile(e)}
            />
            <div>
              {study?.image?.image?.publicUrlTransformed && (
                <img
                  width="213"
                  src={study?.image?.image?.publicUrlTransformed}
                  alt="Upload preview"
                />
              )}
            </div>
          </div>
        </div>
        <div>
          <label htmlFor="title">
            <textarea
              id="title"
              name="title"
              placeholder="Title"
              value={study.title}
              onChange={handleChange}
              required
              className="title"
            />
          </label>
        </div>

        <div>
          <label htmlFor="description">
            <textarea
              id="description"
              name="description"
              placeholder="Description"
              value={study.description}
              onChange={handleChange}
              rows="7"
              className="description"
            />
          </label>
        </div>
      </div>

      <div className="details">
        <div className="leftPanel">
          <Tabs
            user={user}
            study={study}
            infoBlocks={infoBlocks}
            handleParameterChange={handleParameterChange}
            deleteParameter={deleteParameter}
          />
        </div>

        <div className="rightPanel">
          <div className="timeInformationBlock">
            <div>
              <label htmlFor="time">
                Time to complete
                <div className="completeTimeLine">
                  <img src="/assets/icons/time.svg" alt="icon" width="24" />
                  <input
                    type="text"
                    id="time"
                    name="time"
                    value={infoBlocks.time}
                    onChange={handleParameterChange}
                    className="text"
                  />
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
