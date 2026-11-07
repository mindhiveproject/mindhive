import { useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import Chip from "../../../../../DesignSystem/Chip";
import { STUDY_VISUALS } from "../../../../../Queries/YQVisual";
import Card from "../Blocks/Card";

/**
 * Authored visuals offered to studies. Each card is the visual's p5 Task, so
 * adding, previewing and opening one behave like any other block; the chips
 * name the devices the study has to link for the visual to get its data.
 *
 * Like the task bank, "anyone" is what an admin has published plus your own
 * visuals, and "favorite" is the ones you've starred.
 */
export default function VisualBlocks({ user, createdBy, search, addFunctions }) {
  const { t } = useTranslation("builder");
  const byScope =
    createdBy === "favorite"
      ? { likes: { some: { id: { equals: user?.id } } } }
      : {
          OR: [
            { published: { equals: true } },
            { author: { id: { equals: user?.id } } },
            { collaborators: { some: { id: { equals: user?.id } } } },
          ],
        };
  const { data, loading } = useQuery(STUDY_VISUALS, {
    variables: {
      where: {
        AND: [
          {
            includeInStudies: { equals: true },
            participationMode: { equals: "authored" },
            title: { contains: search || "" },
          },
          byScope,
        ],
      },
    },
    fetchPolicy: "cache-and-network",
    skip: !user?.id,
  });

  // A visual saved before its Task existed has nothing a flow node can point at.
  const visuals = (data?.visuals || []).filter((visual) => visual.tasks?.[0]);

  if (!loading && !visuals.length) {
    return (
      <p className="blocksMenuDescription">
        {t("selector.visuals.empty", {}, {
          default: "No visuals to show.",
        })}
      </p>
    );
  }

  return (
    <div>
      {visuals.map((visual) => (
        <Card
          key={visual.id}
          user={user}
          component={{
            ...visual.tasks[0],
            title: visual.title,
            description: visual.description,
          }}
          addFunctions={addFunctions}
          search={search}
          componentType="TASK"
        >
          {visual.dataSources.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {visual.dataSources.map((source) => (
                <Chip
                  key={source.id}
                  variant="static"
                  tone="info"
                  label={source.label || source.block?.title}
                />
              ))}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
