import {
  StyledReviewSection,
  StyledReviewBoard,
  StyledReviewCard,
} from "../../../styles/StyledReview";

import Feedback from "./Reviews/Main";
import useTranslation from "next-translate/useTranslation";

export default function Proposal({ user, query, project }) {
  const proposal = project || {};
  const { t } = useTranslation("builder");

  return (
    <StyledReviewSection>
      <StyledReviewBoard>
        <StyledReviewCard className="submit">
          <h2>{t("reviewProposal.feedback", "Feedback")}</h2>
          <p>
            {t(
              "reviewProposal.instruction",
              "Once you submit your proposal or study, your reviews will appear here."
            )}
          </p>
          <Feedback user={user} query={query} proposal={proposal} />
        </StyledReviewCard>
      </StyledReviewBoard>
    </StyledReviewSection>
  );
}
