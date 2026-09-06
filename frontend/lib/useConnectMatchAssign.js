import { useCallback } from "react";
import { useMutation } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import { CREATE_MATCH } from "../components/Mutations/ConnectMatch";

export default function useConnectMatchAssign({
  round,
  opportunities,
  matches,
  refetch,
}) {
  const { t } = useTranslation("connect");
  const [createMatch, { loading: assigning }] = useMutation(CREATE_MATCH);

  const handleAssign = useCallback(
    async (studentId, opportunityId) => {
      if (!studentId || !opportunityId || !round?.id) return false;

      const opp = (opportunities || []).find((o) => o.id === opportunityId);
      const cap = opp?.studentCapacity || 1;
      const currentCount = (matches || []).filter(
        (m) => m.opportunity?.id === opportunityId,
      ).length;

      if (currentCount >= cap) {
        window.alert(
          t("matchingRound.capacityFull", {}, {
            default:
              "This opportunity is already at capacity. Remove an existing match first.",
          }),
        );
        return false;
      }

      const duplicate = (matches || []).some(
        (m) =>
          m.student?.id === studentId &&
          m.opportunity?.id === opportunityId,
      );
      if (duplicate) return false;

      await createMatch({
        variables: {
          input: {
            round: { connect: { id: round.id } },
            classNetwork: round.classNetwork?.id
              ? { connect: { id: round.classNetwork.id } }
              : undefined,
            opportunity: { connect: { id: opportunityId } },
            student: { connect: { id: studentId } },
            status: "proposed",
            proposedAt: new Date().toISOString(),
          },
        },
      });

      if (refetch) await refetch();
      return true;
    },
    [round, opportunities, matches, createMatch, refetch, t],
  );

  return { handleAssign, assigning };
}
