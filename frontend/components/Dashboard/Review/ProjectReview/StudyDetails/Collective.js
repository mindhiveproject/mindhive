import ReactHtmlParser from "react-html-parser";
import useTranslation from "next-translate/useTranslation";

import { StyledActionPage } from "../../../../styles/StyledReview";
import {
  allowsStudentTaskSelection,
  getStudentPickedTasks,
} from "../../../../../lib/studentTaskSelection";
import StudentTaskChips from "../../StudentTaskChips";
import { cardIncludedInReviewStep } from "../../../../../lib/milestones";

export default function CollectivePresentation({
  project,
  actionCardType,
  milestone,
}) {
  const { t } = useTranslation("builder");
  const proposal = project || { sections: [] };

  // Show the cards included in this review step. includeInReviewSteps mixes
  // legacy ACTION_* values and milestone keys, so match on the milestone's
  // aliases like the student's submit page does (Card/Actions/Proposal.js).
  // The includeInReport flag is for the final project report, not for intermediate review steps
  const stepKey = milestone?.key || actionCardType;
  const stepMilestones = milestone ? [milestone] : [];
  const cards = [...proposal?.sections]
    ?.sort((a, b) => a?.position - b?.position)
    .map((section) =>
      section?.cards.filter((card) =>
        cardIncludedInReviewStep(card, stepKey, stepMilestones)
      )
    )
    .flat();

  return (
    <StyledActionPage>
      <div className="proposal">
        <div className="cards">
          {cards?.map((card) => (
            <div key={card?.id} className="card">
              <div className="cardTitleIcon">
                <div className="cardTitle">{card?.title}</div>
              </div>
              <div className="cardText">{ReactHtmlParser(card?.content)}</div>
              {/* Only the students' picks; tasks from the template don't show. */}
              {allowsStudentTaskSelection(card) ? (
                <div className="cardStudentTasks">
                  <div className="cardStudentTasksLabel">
                    {t("review.studentPickedTasks", {}, {
                      default: "Tasks and surveys picked by students",
                    })}
                  </div>
                  <StudentTaskChips
                    tasks={getStudentPickedTasks(card)}
                    showEmpty
                  />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </StyledActionPage>
  );
}
