import Link from "next/link";

// import SaveStudy from "./Save";
// import UpdateStudy from "./Update";

const itemsInternalTask = [
  {
    value: "template",
    name: "Template",
    icon: "collect",
  },
  {
    value: "basic",
    name: "Basic",
    icon: "proposal",
  },
  {
    value: "parameters",
    name: "Parameters",
    icon: "builder",
  },
  {
    value: "sharing",
    name: "Sharing",
    icon: "review",
  },
];

const itemsExternalTask = [
  {
    value: "basic",
    name: "Basic",
    icon: "proposal",
  },
  {
    value: "sharing",
    name: "Sharing",
    icon: "review",
  },
];

export default function Navigation({
  tab,
  setTab,
  task,
  user,
  handleSubmit,
  submitBtnName,
  openFullscreenPreview,
  isTemplateAuthor,
  close,
  isInStudyBuilder,
}) {
  // decide whether include the template tab based on whether the user is the author or a collaborator on the template
  const itemsInternalTaskSelected = isTemplateAuthor
    ? itemsInternalTask
    : itemsInternalTask.filter((item) => item.value !== "template");
  // decide whether to show only tabs for an external task
  const items = task?.isExternal
    ? itemsExternalTask
    : itemsInternalTaskSelected;

  return (
    <div className="navigation">
      <div className="firstLine">
        <div className="leftPanel">
          {close ? (
            <div className="goBackBtn" onClick={close}>
              ←
            </div>
          ) : (
            <div className="goBackBtn">
              <Link
                href={{
                  pathname: `/dashboard/develop/studies`,
                }}
              >
                ←
              </Link>
            </div>
          )}

          <div>
            <span className="studyTitle">{task?.title}</span>
          </div>
        </div>
        <div className="rightPanel">
          {false && (
            <div className="icon">
              <img src="/assets/icons/chat.svg" />
            </div>
          )}

          {task?.template?.script && (
            <button onClick={() => openFullscreenPreview()}>
              Fullscreen Preview
            </button>
          )}

          <div className="submitButton">
            <button onClick={() => handleSubmit()}>{submitBtnName}</button>
          </div>
        </div>
      </div>

      <div className="secondLine">
        <div className="menu">
          {items.map((item, i) => (
            <div key={i} onClick={() => setTab(item?.value)}>
              <div
                key={i}
                className={
                  tab === item?.value
                    ? "menuTitle selectedMenuTitle"
                    : "menuTitle"
                }
              >
                <div className="titleWithIcon">
                  <img src={`/assets/icons/builder/${item?.icon}.svg`} />
                  <p>{item?.name}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
