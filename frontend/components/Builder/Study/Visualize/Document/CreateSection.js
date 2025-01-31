import { Dropdown, DropdownMenu, DropdownItem } from "semantic-ui-react";

import { useMutation } from "@apollo/client";
import { CREATE_VIZSECTION } from "../../../../Mutations/VizSection";
import { STUDY_VIZJOURNAL } from "../../../../Queries/VizJournal";

export default function CreateSection({ 
  user,
  studyId, 
  chapterId }) {
  const [createSection, { data, loading, error }] = useMutation(
    CREATE_VIZSECTION,
    {
      variables: {},
      refetchQueries: [{ query: STUDY_VIZJOURNAL, variables: { id: studyId } }],
    }
  );

  const addSection = ({ type, title }) => {
    createSection({
      variables: {
        input: {
          title,
          type,
          vizChapter: {
            connect: {
              id: chapterId,
            },
          },
        },
      },
    });
  };

  return (
    <Dropdown icon={<img src={`/assets/icons/visualize/add.svg`} />}>
      <DropdownMenu>
        <DropdownItem
          onClick={() => addSection({ type: "PARAGRAPH", title: "Text" })}
        >
          <div className="menuItem">
            <div>
              <img src={`/assets/icons/visualize/segment.svg`} />
            </div>
            <div>Paragraph</div>
          </div>
        </DropdownItem>

        <DropdownItem
          onClick={() =>
            addSection({ type: "STATISTICS", title: "Summary Statistics" })
          }
        >
          <div className="menuItem">
            <div>
              <img src={`/assets/icons/visualize/table_chart_view.svg`} />
            </div>
            <div>Summary statistics</div>
          </div>
        </DropdownItem>

        <DropdownItem
          onClick={() => addSection({ type: "TABLE", title: "Data Table" })}
        >
          <div className="menuItem">
            <div>
              <img src={`/assets/icons/visualize/table_view.svg`} />
            </div>
            <div>Table view</div>
          </div>
        </DropdownItem>

        <DropdownItem
          onClick={() => addSection({ type: "GRAPH", title: "Graph" })}
        >
          <div className="menuItem">
            <div>
              <img src={`/assets/icons/visualize/bar_chart.svg`} />
            </div>
            <div>Graph</div>
          </div>
        </DropdownItem>
        
        {(user?.permissions?.map((p) => p?.name).includes("ADMIN") ||
          user?.permissions?.map((p) => p?.name).includes("TEACHER") ||
          user?.permissions?.map((p) => p?.name).includes("MENTOR")) && (
          <DropdownItem
            onClick={() => addSection({ type: "HYPVIS", title: "Hypothesis Visualizer" })}
          >
            <div className="menuItem">
              <div>
                <img src={`/assets/icons/visualize/bar_chart_color.svg`} />
              </div>
              <div>Hypothesis Visualizer</div>
            </div>
          </DropdownItem>
        )}
        <DropdownItem
          onClick={() => addSection({ type: "STATTEST", title: "Statistical Test" })}
        >
          <div className="menuItem">
            <div>
              <img src={`/assets/icons/visualize/statisticalTest.svg`} />
            </div>
            <div>Statistical Test</div>
          </div>
        </DropdownItem>

      </DropdownMenu>
    </Dropdown>
  );
}