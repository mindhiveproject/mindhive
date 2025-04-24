import { Dropdown, DropdownMenu } from "semantic-ui-react";
import DeleteSection from "./DeleteSection";
import RenameSection from "./RenameSection";
import { StyledInput } from "../../../../styles/StyledForm";

const sections = {
  PARAGRAPH: {
    title: "Paragraph",
    img: "/assets/icons/visualize/paragraph.svg",
  },
  STATISTICS: {
    title: "Summary Statistics",
    img: "/assets/icons/visualize/table_chart_view.svg",
  },
  TABLE: {
    title: "Data Table",
    img: "/assets/icons/visualize/table_view.svg",
  },
  GRAPH: {
    title: "Graph",
    img: "/assets/icons/visualize/bar_chart.svg",
  },
  STATTEST: {
    title: "Statistical Test",
    img: "/assets/icons/visualize/statisticalTest.svg",
  },
  HYPVIS: {
    title: "Hypothesis Visualizer",
    img: "/assets/icons/visualize/hypothesisVisualizer.svg",
  },
};

export default function SectionHeader({
  projectId,
  studyId,
  section,
  description,
  handleChange,
}) {
  const defaultTitle = sections?.[section?.type]?.title;

  return (
    <>
      <div className="sectionHeader" id={section?.id}>
        <div>
          <img src={sections?.[section?.type]?.img} alt={defaultTitle} />
        </div>
        <div>{defaultTitle}</div>
        {section?.title !== defaultTitle ? (
          <>
            <div>—</div>
            <div>{section?.title}</div>
          </>
        ) : (
          <>
            <div></div>
            <div></div>
          </>
        )}
        <div></div>
        <div>
          <Dropdown direction="left">
            <DropdownMenu>
              <DeleteSection
                projectId={projectId}
                studyId={studyId}
                sectionId={section?.id}
              />
              <RenameSection
                projectId={projectId}
                studyId={studyId}
                sectionId={section?.id}
              />
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>
      <StyledInput>
        <fieldset>
          <label htmlFor="description">
            <textarea
              className="description"
              id="description"
              name="description"
              value={description}
              onChange={handleChange}
            />
          </label>
        </fieldset>
      </StyledInput>
    </>
  );
}
