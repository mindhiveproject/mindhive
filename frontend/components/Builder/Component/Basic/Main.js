import DisplayError from "../../../ErrorMessage";

import useTranslation from "next-translate/useTranslation";

export default function Basic({
  user,
  task,
  handleChange,
  handleMultipleUpdate,
  submitBtnName,
  loading,
  error,
}) {
  const { t } = useTranslation("classes");

  return (
    <>
      <DisplayError error={error} />

      <fieldset disabled={loading} aria-busy={loading}>
        <div className="block">
          <label htmlFor="title">
            {t("common.title")}
            <input
              type="title"
              name="title"
              value={task?.title}
              onChange={handleChange}
              required
            />
          </label>
        </div>

        <div className="block">
          <label htmlFor="description">
            Description (for Develop mode)
            <textarea
              id="description"
              rows="50"
              name="description"
              value={task?.description}
              onChange={handleChange}
            />
          </label>
          <span>
            This is visible to researchers, teachers, and students when choosing
            tasks or surveys in the Develop mode.
          </span>
        </div>

        <div className="block">
          <label htmlFor="descriptionForParticipants">
            Description (for Discover mode)
            <textarea
              id="descriptionForParticipants"
              name="descriptionForParticipants"
              value={task?.descriptionForParticipants}
              onChange={handleChange}
              rows="5"
            />
          </label>
          <span>
            This is visible to all platform users when choosing tasks or surveys
            in the Discover mode.
          </span>
        </div>

        {task?.isExternal && (
          <div className="block">
            <label htmlFor="link">
              Link
              <input
                type="text"
                id="link"
                name="link"
                value={task.link || ""}
                onChange={handleChange}
              />
            </label>
            <span>The data will not be saved to the MH database</span>
          </div>
        )}
      </fieldset>
    </>
  );
}
