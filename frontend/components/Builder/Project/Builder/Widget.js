import { CreatorWidget } from "./Diagram/widgets/CreatorWidget";

export default function Widget({
  engine,
  openComponentModal,
  openModal,
  openStudyPreview,
  onBeforeCanvasMutation,
  onAfterCanvasMutation,
  onModelReplaced,
}) {
  if (engine) {
    return (
      <CreatorWidget
        engine={engine}
        openComponentModal={openComponentModal}
        openModal={openModal}
        openStudyPreview={openStudyPreview}
        onBeforeCanvasMutation={onBeforeCanvasMutation}
        onAfterCanvasMutation={onAfterCanvasMutation}
        onModelReplaced={onModelReplaced}
      />
    );
  }
}
