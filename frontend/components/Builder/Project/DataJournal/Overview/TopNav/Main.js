import CreateSection from "../../Document/CreateSection";

export default function TopNav({ projectId, studyId, chapter }) {
  return (
    <div className="topNav">
      <div className="areaSwitch">
        <div>Journals</div>
        <div>Datasets</div>
      </div>

      <div>Breadcrumbs</div>
      <div>
        <button>Export</button>
        <button>Share</button>
        {/* <button>Add a Component</button> */}
        <div className="createSectionButton">
          <CreateSection
            projectId={projectId}
            studyId={studyId}
            chapterId={chapter?.id}
          />
        </div>
      </div>
    </div>
  );
}
