import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";

import Button from "../../../../DesignSystem/Button";
import DropdownSelect from "../../../../DesignSystem/DropdownSelect";
import Modal from "../../../../DesignSystem/Modal";
import { MY_CONNECT_ROUNDS } from "../../../../Queries/ConnectRound";
import MatchingRoundCard, {
  MATCHING_ROUND_CREATE_QUERY,
} from "./MatchingRoundCard";

function sortRoundsByRecency(rounds) {
  return [...rounds].sort(
    (a, b) =>
      new Date(b.updatedAt || b.createdAt).getTime() -
      new Date(a.updatedAt || a.createdAt).getTime(),
  );
}

function collectAllRounds(profile) {
  const seen = new Map();
  (profile?.connectRoundsCreated || []).forEach((round) => {
    if (round?.id) seen.set(round.id, round);
  });
  (profile?.connectRoundsReviewing || []).forEach((round) => {
    if (round?.id && !seen.has(round.id)) seen.set(round.id, round);
  });
  return Array.from(seen.values());
}

function firstQueryValue(value) {
  if (Array.isArray(value)) return value[0] || null;
  return typeof value === "string" ? value : null;
}

export default function MatchingRoundsList({
  myclass,
  onPreviewOpportunity,
  onMatchingRoundContextChange,
}) {
  const { t } = useTranslation("classes");
  const router = useRouter();
  const networks = myclass?.networks || [];
  const classCode = myclass?.code;

  const requestedRound = firstQueryValue(router.query?.round);
  const queryNetworkId = firstQueryValue(router.query?.networkId);
  const queryMatchingPanel = firstQueryValue(router.query?.matchingPanel);

  const [networkModalOpen, setNetworkModalOpen] = useState(false);
  const [modalNetworkId, setModalNetworkId] = useState(null);

  const { data: roundsData, loading: loadingRounds } = useQuery(
    MY_CONNECT_ROUNDS,
    { fetchPolicy: "cache-and-network" },
  );

  const classNetworkIds = useMemo(
    () => new Set(networks.map((network) => network.id)),
    [networks],
  );

  const roundsForClass = useMemo(() => {
    const allRounds = collectAllRounds(roundsData?.authenticatedItem);
    return sortRoundsByRecency(
      allRounds.filter(
        (round) =>
          round.classNetwork?.id && classNetworkIds.has(round.classNetwork.id),
      ),
    );
  }, [roundsData?.authenticatedItem, classNetworkIds]);

  const resolvedQueryNetwork = useMemo(() => {
    if (!queryNetworkId) return null;
    return (
      networks.find(
        (network) =>
          network.id === queryNetworkId ||
          network.publicId === queryNetworkId,
      ) || null
    );
  }, [networks, queryNetworkId]);

  const defaultNetworkId = useMemo(() => {
    if (networks.length === 0) return null;
    if (resolvedQueryNetwork) return resolvedQueryNetwork.id;
    return networks[0].id;
  }, [networks, resolvedQueryNetwork]);

  const isCreating = requestedRound === MATCHING_ROUND_CREATE_QUERY;
  const createNetworkId = isCreating ? resolvedQueryNetwork?.id || null : null;
  const showWorkspace = Boolean(requestedRound);
  const activeRoundSummary = useMemo(() => {
    if (!requestedRound || isCreating) return null;
    return (
      roundsForClass.find((round) => round.id === requestedRound) || {
        id: requestedRound,
      }
    );
  }, [requestedRound, isCreating, roundsForClass]);

  const classOpportunitiesHref = useCallback(
    (extra = {}) => ({
      pathname: `/dashboard/myclasses/${classCode}`,
      query: { page: "opportunities", ...extra },
    }),
    [classCode],
  );

  // Create without a network, or a matchingPanel deep-link without a round.
  useEffect(() => {
    if (!router.isReady || !classCode) return;

    if (isCreating && !createNetworkId) {
      router.replace(classOpportunitiesHref());
      return;
    }

    if (requestedRound || loadingRounds) return;
    if (!queryMatchingPanel) return;

    const preferredRound = resolvedQueryNetwork
      ? roundsForClass.find(
          (round) => round.classNetwork?.id === resolvedQueryNetwork.id,
        )
      : null;
    const target = preferredRound || roundsForClass[0];
    if (!target?.id) return;

    router.replace(
      classOpportunitiesHref({
        round: target.id,
        matchingPanel: queryMatchingPanel,
      }),
    );
  }, [
    router,
    router.isReady,
    classCode,
    isCreating,
    createNetworkId,
    requestedRound,
    loadingRounds,
    queryMatchingPanel,
    resolvedQueryNetwork,
    roundsForClass,
    classOpportunitiesHref,
  ]);

  const openRound = useCallback(
    (roundId) => {
      if (!classCode || !roundId) return;
      router.push(classOpportunitiesHref({ round: roundId }));
    },
    [classCode, classOpportunitiesHref, router],
  );

  const openNetworkModal = useCallback(() => {
    if (networks.length === 0) {
      alert(
        t("opportunities.matchingRound.networkRequired", {}, {
          default: "Select a class network for this matching round.",
        }),
      );
      return;
    }
    setModalNetworkId(defaultNetworkId || networks[0].id);
    setNetworkModalOpen(true);
  }, [networks, defaultNetworkId, t]);

  const handleCloseNetworkModal = useCallback(() => {
    setNetworkModalOpen(false);
  }, []);

  const handleConfirmNetwork = useCallback(() => {
    if (!modalNetworkId) {
      alert(
        t("opportunities.matchingRound.networkRequired", {}, {
          default: "Select a class network for this matching round.",
        }),
      );
      return;
    }
    if (!classCode) return;
    setNetworkModalOpen(false);
    router.push(
      classOpportunitiesHref({
        round: MATCHING_ROUND_CREATE_QUERY,
        networkId: modalNetworkId,
      }),
    );
  }, [modalNetworkId, t, classCode, classOpportunitiesHref, router]);

  const handleCreated = useCallback(
    (newRoundId) => {
      if (!classCode || !newRoundId) return;
      const nextQuery = { round: newRoundId };
      if (queryMatchingPanel) nextQuery.matchingPanel = queryMatchingPanel;
      router.replace(classOpportunitiesHref(nextQuery));
    },
    [classCode, classOpportunitiesHref, queryMatchingPanel, router],
  );

  if (loadingRounds && !roundsData) {
    return (
      <div className="classTabEmpty">
        <p>
          {t("opportunities.matchingRound.loading", {}, {
            default: "Loading matching round…",
          })}
        </p>
      </div>
    );
  }

  if (showWorkspace && isCreating) {
    if (!createNetworkId) {
      return (
        <div className="classTabEmpty">
          <p>
            {t("opportunities.matchingRound.loading", {}, {
              default: "Loading matching round…",
            })}
          </p>
        </div>
      );
    }
    return (
      <MatchingRoundCard
        key={`${MATCHING_ROUND_CREATE_QUERY}-${createNetworkId}`}
        myclass={myclass}
        networks={networks}
        roundSummary={null}
        isCreate
        isWorkspace
        initialNetworkId={createNetworkId}
        onPreviewOpportunity={onPreviewOpportunity}
        onMatchingRoundContextChange={onMatchingRoundContextChange}
        onCreated={handleCreated}
      />
    );
  }

  if (showWorkspace && activeRoundSummary?.id) {
    return (
      <MatchingRoundCard
        key={activeRoundSummary.id}
        myclass={myclass}
        networks={networks}
        roundSummary={activeRoundSummary}
        isCreate={false}
        isWorkspace
        onPreviewOpportunity={onPreviewOpportunity}
        onMatchingRoundContextChange={onMatchingRoundContextChange}
      />
    );
  }

  if (queryMatchingPanel && roundsForClass.length > 0) {
    return (
      <div className="classTabEmpty">
        <p>
          {t("opportunities.matchingRound.loading", {}, {
            default: "Loading matching round…",
          })}
        </p>
      </div>
    );
  }

  return (
    <div className="matchingRoundsList">
      {roundsForClass.map((round) => (
        <MatchingRoundCard
          key={round.id}
          myclass={myclass}
          networks={networks}
          roundSummary={round}
          isCreate={false}
          isWorkspace={false}
          onOpen={() => openRound(round.id)}
        />
      ))}

      <div className="matchingRoundsListCreate">
        <Button
          variant="filled"
          type="button"
          onClick={openNetworkModal}
          disabled={networks.length === 0}
        >
          {t("opportunities.matchingRound.createNewRound", {}, {
            default: "Create new round",
          })}
        </Button>
      </div>

      <Modal
        open={networkModalOpen}
        onClose={handleCloseNetworkModal}
        title={t("opportunities.matchingRound.networkModal.title", {}, {
          default: "Connect a class network",
        })}
        actions={
          <>
            <Button
              variant="text"
              type="button"
              onClick={handleCloseNetworkModal}
            >
              {t("opportunities.matchingRound.networkModal.cancel", {}, {
                default: "Cancel",
              })}
            </Button>
            <Button
              variant="filled"
              type="button"
              onClick={handleConfirmNetwork}
              disabled={!modalNetworkId}
            >
              {t("opportunities.matchingRound.networkModal.continue", {}, {
                default: "Continue",
              })}
            </Button>
          </>
        }
      >
        <p style={{ margin: "0 0 12px" }}>
          {t("opportunities.matchingRound.networkModal.description", {}, {
            default:
              "Choose which class network this matching round will use. This cannot be changed after the round is created.",
          })}
        </p>
        <DropdownSelect
          value={modalNetworkId || ""}
          searchableSingle={networks.length > 5}
          options={networks.map((network) => ({
            value: network.id,
            label: network.title,
          }))}
          onChange={(next) => setModalNetworkId(next)}
          placeholder={t("opportunities.matchingRound.pickNetworkLabel", {}, {
            default: "Choose a class network for this round",
          })}
          ariaLabel={t("opportunities.matchingRound.pickNetworkLabel", {}, {
            default: "Choose a class network for this round",
          })}
        />
      </Modal>
    </div>
  );
}
