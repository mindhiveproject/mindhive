import CreateSection from "../../Document/CreateSection";
import Breadcrumbs from "./Breadcrumbs";

export default function TopNav({
  projectId,
  studyId,
  chapter,
  handleAddWidget,
  part,
}) {
  return (
    <div className="topNav">
      <div className="areaSwitch">
        <div>Journals</div>
        <div>Datasets</div>
      </div>

      <Breadcrumbs part={part} chapter={chapter} />
      <div>
        <button>Export</button>
        <button>Share</button>
        {/* <button>Add a Component</button> */}
        <div className="createSectionButton">
          <CreateSection
            projectId={projectId}
            studyId={studyId}
            chapterId={chapter?.id}
            handleAddWidget={handleAddWidget}
          />
        </div>
      </div>
    </div>
  );
}
