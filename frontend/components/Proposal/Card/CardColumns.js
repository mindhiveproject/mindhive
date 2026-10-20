import { Children } from "react";
import useTranslation from "next-translate/useTranslation";

import SplitPane from "../../DesignSystem/SplitPane";
import useStoredSplitFraction from "../../../lib/useStoredSplitFraction";

const SPLIT_STORAGE_KEY = "mh.proposalCard.splitFraction";
const DEFAULT_SPLIT_FRACTION = 0.64;

// The expanded card's two columns (content, then side panel) with a draggable
// divider between them, like the feedback center. A card with only one column
// renders it as is.
export default function CardColumns({ children }) {
  const { t } = useTranslation("builder");
  const [splitFraction, saveSplitFraction] = useStoredSplitFraction(
    SPLIT_STORAGE_KEY,
    DEFAULT_SPLIT_FRACTION
  );
  const [start, end] = Children.toArray(children);

  if (!end) {
    return <div className="proposalCardBoard">{start}</div>;
  }

  return (
    <div className="proposalCardBoard proposalCardBoardSplit">
      {splitFraction !== null ? (
        <SplitPane
          start={start}
          end={end}
          defaultFraction={splitFraction}
          minStart={360}
          minEnd={280}
          onFractionChange={saveSplitFraction}
          ariaLabel={t(
            "reviewDetail.resizeColumns",
            {},
            { default: "Resize columns" }
          )}
        />
      ) : null}
    </div>
  );
}
