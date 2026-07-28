import { useState } from "react";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";

import DesignSystemButton from "../../../../DesignSystem/Button";
import MatchingRoundsList from "./MatchingRoundsList";
import OpportunityPreviewModal from "../Modals/OpportunityPreviewModal";

export default function ClassOpportunities({ myclass }) {
  const { t } = useTranslation("classes");
  const router = useRouter();
  const networks = myclass?.networks || [];

  const [previewOpportunityId, setPreviewOpportunityId] = useState(null);
  const [matchingRoundContext, setMatchingRoundContext] = useState(null);

  const handleOpenSettings = () => {
    if (!myclass?.code) return;
    router.push({
      pathname: `/dashboard/myclasses/${myclass.code}`,
      query: { page: "settings" },
    });
  };

  return (
    <div className="classTabPage opportunities">
      {networks.length === 0 ? (
        <div className="classTabEmpty">
          <p>
            {t("opportunities.noNetworks", {}, {
              default:
                "This class is not linked to any class networks yet. A network admin can add this class to a network.",
            })}
          </p>
          <DesignSystemButton
            variant="outline"
            type="button"
            onClick={handleOpenSettings}
          >
            {t("opportunities.openSettings", {}, {
              default: "Open settings",
            })}
          </DesignSystemButton>
        </div>
      ) : (
        <MatchingRoundsList
          myclass={myclass}
          onPreviewOpportunity={setPreviewOpportunityId}
          onMatchingRoundContextChange={setMatchingRoundContext}
        />
      )}

      <OpportunityPreviewModal
        open={!!previewOpportunityId}
        opportunityId={previewOpportunityId}
        onClose={() => setPreviewOpportunityId(null)}
        matchingRoundContext={matchingRoundContext}
      />
    </div>
  );
}
