import {
  BreadcrumbSection,
  BreadcrumbDivider,
  Breadcrumb,
} from "semantic-ui-react";

import { StyledTopNavigation } from "../styles/StyledDataJournal";
import SaveWorkspace from "../Workspace/Save";

export default function TopNavigation({
  journalId,
  workspace,
  activeComponentId,
  handleAddComponent,
}) {
  return (
    <StyledTopNavigation>
      <div>Journals - Datasets</div>
      <div>
        <Breadcrumb size="massive">
          <BreadcrumbSection link>{journalId}</BreadcrumbSection>
          <BreadcrumbDivider icon="right angle" />
          <BreadcrumbSection link>{workspace?.title}</BreadcrumbSection>
          <BreadcrumbDivider icon="right angle" />
          <BreadcrumbSection active>{activeComponentId}</BreadcrumbSection>
        </Breadcrumb>
      </div>
      <div className="buttons">
        <div>
          <button onClick={async () => await handleAddComponent("PARAGRAPH")}>
            Add PARAGRAPH
          </button>
          <button onClick={async () => await handleAddComponent("TABLE")}>
            Add TABLE
          </button>
          <button onClick={async () => await handleAddComponent("GRAPH")}>
            Add GRAPH
          </button>
        </div>
        <SaveWorkspace workspace={workspace} />
      </div>
    </StyledTopNavigation>
  );
}
