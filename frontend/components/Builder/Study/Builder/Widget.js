import { CreatorWidget } from "./Diagram/widgets/CreatorWidget";

export default function Widget({
  engine,
  openComponentModal,
  openDesignModal,
}) {
  if (engine) {
    return (
      <CreatorWidget
        engine={engine}
        openComponentModal={openComponentModal}
        openDesignModal={openDesignModal}
        openStudyPreview={() => console.log("openStudyPreview")}
      />
    );
  }
}
