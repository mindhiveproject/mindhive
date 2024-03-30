import { Dropdown, DropdownMenu } from "semantic-ui-react";
import DeleteSection from "./DeleteSection";
import { StyledInput } from "../../../../styles/StyledForm";

const sections = {
  PARAGRAPH: {
    title: "Paragraph",
    img: "/assets/icons/visualize/segment.svg",
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
};

export default function SectionHeader({
  studyId,
  section,
  description,
  handleChange,
}) {
  return (
    <>
      <div className="sectionHeader" id={section?.id}>
        <div>
          <img src={sections?.[section?.type]?.img} />
        </div>
        <div>{sections?.[section?.type]?.title}</div>
        <div>
          <Dropdown direction="left">
            <DropdownMenu>
              <DeleteSection studyId={studyId} sectionId={section?.id} />
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
