import { CreatorWidget } from "./Diagram/widgets/CreatorWidget";

export default function Widget({
  engine,
  studyId,
  openComponentModal,
  openDesignSettings,
  openStudyPreview,
  onBeforeCanvasMutation,
  onAfterCanvasMutation,
  onModelReplaced,
  onTaskNodeAdded,
  onDesignNodeAdded,
  onDuplicateNode,
}) {
  if (engine) {
    return (
      <CreatorWidget
        engine={engine}
        studyId={studyId}
        openComponentModal={openComponentModal}
        openDesignSettings={openDesignSettings}
        openStudyPreview={openStudyPreview}
        onBeforeCanvasMutation={onBeforeCanvasMutation}
        onAfterCanvasMutation={onAfterCanvasMutation}
        onModelReplaced={onModelReplaced}
        onTaskNodeAdded={onTaskNodeAdded}
        onDesignNodeAdded={onDesignNodeAdded}
        onDuplicateNode={onDuplicateNode}
      />
    );
  }
}
