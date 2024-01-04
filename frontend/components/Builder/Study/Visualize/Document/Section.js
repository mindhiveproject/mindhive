import useForm from "../../../../../lib/useForm";
import JoditEditor from "../../../../Jodit/Editor";
import DeleteSection from "./DeleteSection";
import SaveSection from "./SaveSection";

export default function Section({ studyId, chapter, section }) {
  const { inputs, handleChange } = useForm({
    ...(section?.content || {}),
  });

  // update content in the local state
  const handleContentChange = async (content) => {
    handleChange({ target: { name: "text", value: content } });
  };

  return (
    <div className="section">
      <h4>{section?.type}</h4>

      <div>
        <JoditEditor
          content={inputs?.text || ""}
          setContent={handleContentChange}
        />
      </div>

      <div>
        <SaveSection
          studyId={studyId}
          sectionId={section?.id}
          inputs={inputs}
        />
      </div>
      <div>
        <DeleteSection studyId={studyId} sectionId={section?.id} />
      </div>
    </div>
  );
}
