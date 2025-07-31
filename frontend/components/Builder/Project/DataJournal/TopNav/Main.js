import {
  BreadcrumbSection,
  BreadcrumbDivider,
  Breadcrumb,
} from "semantic-ui-react";

import { StyledTopNavigation } from "../styles/StyledDataJournal";
import SaveWorkspace from "../Workspace/Save";

export default function TopNavigation({
  journal,
  workspace,
  activeComponent,
  handleAddComponent,
  toggleComponentPanel,
}) {
  return (
    <StyledTopNavigation>
      <div className="leftIconNav">
        <div className="icon active">
          <img src="/assets/dataviz/journals.png" />
        </div>
        <div className="icon">
          <img src="/assets/dataviz/dataset.png" />
        </div>
      </div>

      <div>
        <Breadcrumb size="massive">
          <BreadcrumbSection link>{journal?.title}</BreadcrumbSection>
          <BreadcrumbDivider icon="right angle" />
          <BreadcrumbSection link>{workspace?.title}</BreadcrumbSection>
          <BreadcrumbDivider icon="right angle" />
          <BreadcrumbSection active>{activeComponent?.title}</BreadcrumbSection>
        </Breadcrumb>
      </div>
      <div className="buttons">
        <div>
          <button
            className="custonBtn"
            onClick={() => toggleComponentPanel(true)}
          >
            Add a Component
          </button>
          {/* <button onClick={async () => await handleAddComponent("PARAGRAPH")}>
            Add PARAGRAPH
          </button>
          <button onClick={async () => await handleAddComponent("TABLE")}>
            Add TABLE
          </button>
           */}
          {/* <button
            onClick={async () => await handleAddComponent({ type: "GRAPH" })}
          >
            Add GRAPH
          </button> */}
        </div>
        {/* <SaveWorkspace workspace={workspace} /> */}
      </div>
    </StyledTopNavigation>
  );
}
