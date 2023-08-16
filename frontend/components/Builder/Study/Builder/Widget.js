import { CreatorWidget } from "./Diagram/widgets/CreatorWidget";

export default function Widget({
  engine,
  openComponentModal,
  openModal,
  openStudyPreview,
}) {
  if (engine) {
    return (
      <CreatorWidget
        engine={engine}
        openComponentModal={openComponentModal}
        openModal={openModal}
        openStudyPreview={openStudyPreview}
      />
    );
  }
}
