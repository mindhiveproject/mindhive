import { Dropdown, DropdownMenu, DropdownItem } from "semantic-ui-react";

import { useMutation } from "@apollo/client";
import { CREATE_VIZSECTION } from "../../../../Mutations/VizSection";
import { GET_VIZJOURNALS } from "../../../../Queries/VizJournal";

export default function CreateSection({
  projectId,
  studyId,
  chapterId,
  handleAddWidget,
}) {
  const [createSection, { data, loading, error }] = useMutation(
    CREATE_VIZSECTION,
    {
      variables: {},
      refetchQueries: [
        {
          query: GET_VIZJOURNALS,
          variables: {
            where:
              projectId && studyId
                ? {
                    OR: [
                      { project: { id: { equals: projectId } } },
                      { study: { id: { equals: studyId } } },
                    ],
                  }
                : projectId
                ? { project: { id: { equals: projectId } } }
                : studyId
                ? { study: { id: { equals: studyId } } }
                : null,
          },
        },
      ],
    }
  );

  const addSection = ({ type, title }) => {
    handleAddWidget("notes");
    // createSection({
    //   variables: {
    //     input: {
    //       title,
    //       type,
    //       vizChapter: {
    //         connect: {
    //           id: chapterId,
    //         },
    //       },
    //     },
    //   },
    // });
  };

  return (
    <Dropdown icon={<img src={`/assets/icons/visualize/add.svg`} />}>
      <DropdownMenu>
        <DropdownItem
          onClick={() => addSection({ type: "PARAGRAPH", title: "Text" })}
        >
          <div className="menuItem">
            <div>
              <img src={`/assets/icons/visualize/paragraph.svg`} />
            </div>
            <div>Note</div>
          </div>
        </DropdownItem>
        <DropdownItem
          onClick={() => addSection({ type: "PARAGRAPH", title: "Text" })}
        >
          <div className="menuItem">
            <div>
              <img src={`/assets/icons/visualize/paragraph.svg`} />
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

        <DropdownItem
          onClick={() =>
            addSection({ type: "HYPVIS", title: "Hypothesis Visualizer" })
          }
        >
          <div className="menuItem">
            <div>
              <img src={`/assets/icons/visualize/hypothesisVisualizer.svg`} />
            </div>
            <div>Hypothesis Visualizer</div>
          </div>
        </DropdownItem>

        <DropdownItem
          onClick={() =>
            addSection({ type: "STATTEST", title: "Statistical Test" })
          }
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
