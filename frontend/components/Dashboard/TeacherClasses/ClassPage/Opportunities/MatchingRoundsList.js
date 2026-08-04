import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";

import Button from "../../../../DesignSystem/Button";
import DropdownSelect from "../../../../DesignSystem/DropdownSelect";
import Modal from "../../../../DesignSystem/Modal";
import { MY_CONNECT_ROUNDS } from "../../../../Queries/ConnectRound";
import MatchingRoundCard from "./MatchingRoundCard";

const CREATE_KEY = "new";

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

export default function MatchingRoundsList({
  myclass,
  onPreviewOpportunity,
  onMatchingRoundContextChange,
}) {
  const { t } = useTranslation("classes");
  const router = useRouter();
  const networks = myclass?.networks || [];

  const queryNetworkId = useMemo(() => {
    const raw = router.query?.networkId;
    return typeof raw === "string" ? raw : null;
  }, [router.query?.networkId]);

  const [expandedKey, setExpandedKey] = useState(null);
  const [hasAppliedInitialExpand, setHasAppliedInitialExpand] = useState(false);
  const [networkModalOpen, setNetworkModalOpen] = useState(false);
  const [modalNetworkId, setModalNetworkId] = useState(null);
  const [createNetworkId, setCreateNetworkId] = useState(null);
  const dirtyGuardRef = useRef(null);

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

  const defaultNetworkId = useMemo(() => {
    if (networks.length === 0) return null;

    if (createNetworkId && networks.some((n) => n.id === createNetworkId)) {
      return createNetworkId;
    }

    const expandedRound = roundsForClass.find(
      (round) => round.id === expandedKey,
    );
    if (expandedRound?.classNetwork?.id) {
      const fromExpanded = networks.find(
        (network) => network.id === expandedRound.classNetwork.id,
      );
      if (fromExpanded) return fromExpanded.id;
    }

    if (queryNetworkId) {
      const fromQuery = networks.find(
        (network) =>
          network.id === queryNetworkId ||
          network.publicId === queryNetworkId,
      );
      if (fromQuery) return fromQuery.id;
    }

    return networks[0].id;
  }, [
    networks,
    createNetworkId,
    roundsForClass,
    expandedKey,
    queryNetworkId,
  ]);

  useEffect(() => {
    if (loadingRounds || hasAppliedInitialExpand) return;

    if (networks.length === 0) {
      setExpandedKey(null);
      setHasAppliedInitialExpand(true);
      return;
    }

    const preferredFromQuery = queryNetworkId
      ? networks.find(
          (network) =>
            network.id === queryNetworkId ||
            network.publicId === queryNetworkId,
        )
      : null;

    if (roundsForClass.length > 0) {
      const preferredRound = preferredFromQuery
        ? roundsForClass.find(
            (round) => round.classNetwork?.id === preferredFromQuery.id,
          )
        : null;
      setExpandedKey((preferredRound || roundsForClass[0]).id);
    } else {
      setExpandedKey(null);
    }

    setHasAppliedInitialExpand(true);
  }, [
    loadingRounds,
    hasAppliedInitialExpand,
    networks,
    roundsForClass,
    queryNetworkId,
  ]);

  // If the expanded round was deleted / unlinked, fall back.
  useEffect(() => {
    if (!hasAppliedInitialExpand || loadingRounds) return;
    if (expandedKey == null || expandedKey === CREATE_KEY) return;
    const stillExists = roundsForClass.some((round) => round.id === expandedKey);
    if (!stillExists) {
      setExpandedKey(roundsForClass[0]?.id || null);
    }
  }, [
    hasAppliedInitialExpand,
    loadingRounds,
    expandedKey,
    roundsForClass,
  ]);

  const handleRegisterDirtyGuard = useCallback((guard) => {
    dirtyGuardRef.current = guard;
  }, []);

  const discardCreateDraft = useCallback(() => {
    setCreateNetworkId(null);
    if (expandedKey === CREATE_KEY) {
      setExpandedKey(null);
    }
  }, [expandedKey]);

  const requestExpand = useCallback(
    (nextKey) => {
      if (nextKey === expandedKey) {
        const guard = dirtyGuardRef.current;
        if (guard && !guard()) return;
        if (expandedKey === CREATE_KEY) {
          discardCreateDraft();
          return;
        }
        setExpandedKey(null);
        return;
      }
      const guard = dirtyGuardRef.current;
      if (guard && !guard()) return;
      if (expandedKey === CREATE_KEY) {
        setCreateNetworkId(null);
      }
      setExpandedKey(nextKey);
    },
    [expandedKey, discardCreateDraft],
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
    const guard = dirtyGuardRef.current;
    if (guard && !guard()) return;
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
    dirtyGuardRef.current = null;
    setCreateNetworkId(modalNetworkId);
    setExpandedKey(CREATE_KEY);
    setNetworkModalOpen(false);
  }, [modalNetworkId, t]);

  const handleCreated = useCallback((newRoundId) => {
    setCreateNetworkId(null);
    dirtyGuardRef.current = null;
    if (newRoundId) setExpandedKey(newRoundId);
  }, []);

  const isCreating = expandedKey === CREATE_KEY && !!createNetworkId;

  if (loadingRounds && !hasAppliedInitialExpand) {
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
          expanded={expandedKey === round.id}
          onToggleExpand={() => requestExpand(round.id)}
          onRegisterDirtyGuard={
            expandedKey === round.id ? handleRegisterDirtyGuard : undefined
          }
          onPreviewOpportunity={onPreviewOpportunity}
          onMatchingRoundContextChange={
            expandedKey === round.id ? onMatchingRoundContextChange : undefined
          }
        />
      ))}

      {isCreating ? (
        <MatchingRoundCard
          key={`${CREATE_KEY}-${createNetworkId}`}
          myclass={myclass}
          networks={networks}
          roundSummary={null}
          isCreate
          initialNetworkId={createNetworkId}
          expanded
          onToggleExpand={() => requestExpand(CREATE_KEY)}
          onRegisterDirtyGuard={handleRegisterDirtyGuard}
          onPreviewOpportunity={onPreviewOpportunity}
          onMatchingRoundContextChange={onMatchingRoundContextChange}
          onCreated={handleCreated}
        />
      ) : (
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
      )}

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
