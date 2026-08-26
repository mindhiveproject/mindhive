import { useEffect } from "react";
import { useQuery, gql } from "@apollo/client";
import { useRouter } from "next/router";

import MessageCard from "../../DesignSystem/MessageCard";
import { classHasNyuCusp } from "../../../lib/curriculumTypes";

const PARTICIPATE_REDIRECT = gql`
  query PARTICIPATE_REDIRECT($roundId: ID!) {
    connectRound(where: { id: $roundId }) {
      id
      classNetwork {
        id
        classes {
          id
          code
          settings
        }
      }
    }
    authenticatedItem {
      ... on Profile {
        id
        studentIn {
          id
          code
          settings
        }
      }
    }
  }
`;

function pickClass(classes, studentIn) {
  const studentIds = new Set((studentIn || []).map((c) => c?.id).filter(Boolean));
  const onNetwork = (classes || []).filter((c) => c?.code);
  const enrolled = onNetwork.filter((c) => studentIds.has(c.id));
  const pool = enrolled.length ? enrolled : onNetwork;

  const withOpportunities = pool.filter((c) => classHasNyuCusp(c.settings));
  return withOpportunities[0] || pool[0] || null;
}

/**
 * Legacy /dashboard/connect/participate[?round=] → class Opportunities.
 */
export default function ParticipateRedirect({ query }) {
  const router = useRouter();
  const roundId = query?.round || null;

  const { data, loading } = useQuery(PARTICIPATE_REDIRECT, {
    variables: { roundId },
    skip: !roundId,
    fetchPolicy: "cache-and-network",
  });

  useEffect(() => {
    if (!roundId) {
      router.replace("/dashboard/classes");
      return;
    }
    if (loading) return;

    const preferred = pickClass(
      data?.connectRound?.classNetwork?.classes,
      data?.authenticatedItem?.studentIn,
    );

    if (preferred?.code) {
      router.replace({
        pathname: `/dashboard/classes/${preferred.code}`,
        query: { page: "opportunities", round: roundId },
      });
      return;
    }

    router.replace("/dashboard/classes");
  }, [roundId, loading, data, router]);

  return (
    <MessageCard
      variant="information"
      message="Redirecting to class opportunities…"
    />
  );
}
