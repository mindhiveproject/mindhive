import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

import Button from "../../../../DesignSystem/Button";
import Chip from "../../../../DesignSystem/Chip";
import { ROUND_MATCH_VIEW } from "../../../../Queries/ConnectMatch";
import { DELETE_MATCH } from "../../../../Mutations/ConnectMatch";
import {
  displayName,
  getMatchStudents,
  isStudentInActiveMatch,
} from "../../../../../lib/connectBallotUtils";
import MatchingRoundCreateMatchModal from "./MatchingRoundCreateMatchModal";

const Shell = styled.div`
  display: grid;
  gap: 16px;
  width: 100%;
  min-width: 0;
`;

const List = styled.div`
  display: grid;
  gap: 12px;
  width: 100%;
  min-width: 0;
`;

const ItemCard = styled.section`
  display: grid;
  gap: 10px;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
  background: var(--MH-Theme-Neutrals-White, #ffffff);
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
`;

const CardHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px 12px;
`;

const ItemTitle = styled.h4`
  margin: 0;
  font: var(--MH-Type-Title-Base);
  color: var(--MH-Theme-Neutrals-Black, #171717);
  min-width: 0;
  flex: 1 1 auto;
`;

const CardActions = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`;

const MemberRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const EmptyNote = styled.p`
  margin: 0;
  font: var(--MH-Type-Body-Base);
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
`;

/**
 * List of placed matches: one card per ConnectMatch with static student chips
 * and subtle butt / delete actions.
 */
export default function MatchingRoundMatchesPanel({
  roundId,
  students = [],
  enabled = true,
}) {
  const { t } = useTranslation("classes");
  const [editingMatch, setEditingMatch] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const { data, loading, refetch } = useQuery(ROUND_MATCH_VIEW, {
    variables: { roundId },
    skip: !roundId || !enabled,
    fetchPolicy: "cache-and-network",
  });

  const [deleteMatch] = useMutation(DELETE_MATCH);

  const round = data?.connectRound;
  const opportunities = round?.opportunities || [];
  const preferences = round?.preferences || [];
  const matches = round?.matches || [];

  const opportunityById = useMemo(() => {
    const map = new Map();
    opportunities.forEach((opportunity) => {
      if (opportunity?.id) map.set(opportunity.id, opportunity);
    });
    return map;
  }, [opportunities]);

  const cards = useMemo(() => {
    return (matches || [])
      .filter((match) => isStudentInActiveMatch(match))
      .map((match) => {
        const studentsOnMatch = getMatchStudents(match)
          .filter((s) => s?.id)
          .slice()
          .sort((a, b) => displayName(a).localeCompare(displayName(b)));
        if (studentsOnMatch.length === 0) return null;
        const opportunity =
          opportunityById.get(match.opportunity?.id) || match.opportunity;
        return {
          match,
          title: opportunity?.title || "—",
          students: studentsOnMatch,
        };
      })
      .filter(Boolean)
      .sort((a, b) =>
        a.title.localeCompare(b.title, undefined, { sensitivity: "base" }),
      );
  }, [matches, opportunityById]);

  const rosterStudents = useMemo(() => {
    const ids = new Set();
    const list = [];
    (students || []).forEach((student) => {
      if (student?.id && !ids.has(student.id)) {
        ids.add(student.id);
        list.push(student);
      }
    });
    preferences.forEach((preference) => {
      const student = preference.submitter;
      if (student?.id && !ids.has(student.id)) {
        ids.add(student.id);
        list.push(student);
      }
    });
    return list;
  }, [students, preferences]);

  const handleDelete = async (match) => {
    if (!match?.id || deletingId) return;
    const title =
      opportunityById.get(match.opportunity?.id)?.title ||
      match.opportunity?.title ||
      "this opportunity";
    const confirmed = window.confirm(
      t(
        "opportunities.matchingRound.placedMatches.deleteConfirm",
        { title },
        {
          default:
            "Delete the match for \"{{title}}\"? This cannot be undone.",
        },
      ),
    );
    if (!confirmed) return;
    setDeletingId(match.id);
    try {
      await deleteMatch({ variables: { id: match.id } });
      await refetch();
    } catch (error) {
      // eslint-disable-next-line no-alert
      window.alert(
        error?.graphQLErrors?.[0]?.message ||
          error?.message ||
          t(
            "opportunities.matchingRound.placedMatches.deleteFailed",
            {},
            { default: "Could not delete the match. Try again." },
          ),
      );
    } finally {
      setDeletingId(null);
    }
  };

  if (loading && !round) {
    return (
      <Shell className="classTabMatchingRoundPanel">
        <EmptyNote>
          {t(
            "opportunities.matchingRound.placedMatches.loading",
            {},
            { default: "Loading matches…" },
          )}
        </EmptyNote>
      </Shell>
    );
  }

  return (
    <Shell className="classTabMatchingRoundPanel">
      {cards.length === 0 ? (
        <EmptyNote>
          {t(
            "opportunities.matchingRound.placedMatches.empty",
            {},
            { default: "No matches yet. Create matches in the Matching tab." },
          )}
        </EmptyNote>
      ) : (
        <List>
          {cards.map(({ match, title, students: matchStudents }) => (
            <ItemCard key={match.id}>
              <CardHeader>
                <ItemTitle>{title}</ItemTitle>
                <CardActions>
                  <Button
                    variant="subtle"
                    onClick={() => setEditingMatch(match)}
                    disabled={Boolean(deletingId)}
                    aria-label={t(
                      "opportunities.matchingRound.placedMatches.editAria",
                      {},
                      { default: "Edit match" },
                    )}
                  >
                    {t(
                      "opportunities.matchingRound.placedMatches.edit",
                      {},
                      { default: "Edit" },
                    )}
                  </Button>
                  <Button
                    variant="tonal"
                    style={{ background: "var(--MH-Theme-Status-Danger-Default, #FFEFEF)", color: "var(--MH-Theme-Status-Danger-OnDefault, #7F1D1D  )" }}
                    onClick={() => handleDelete(match)}
                    disabled={deletingId === match.id}
                    aria-label={t(
                      "opportunities.matchingRound.placedMatches.deleteAria",
                      {},
                      { default: "Delete match" },
                    )}
                  >
                    {deletingId === match.id
                      ? t(
                          "opportunities.matchingRound.placedMatches.deleting",
                          {},
                          { default: "Deleting…" },
                        )
                      : t(
                          "opportunities.matchingRound.placedMatches.delete",
                          {},
                          { default: "Delete" },
                        )}
                  </Button>
                </CardActions>
              </CardHeader>
              <MemberRow>
                {matchStudents.map((student) => (
                  <Chip
                    key={student.id}
                    variant="static"
                    tone="neutral"
                    label={displayName(student)}
                  />
                ))}
              </MemberRow>
            </ItemCard>
          ))}
        </List>
      )}

      <MatchingRoundCreateMatchModal
        open={Boolean(editingMatch)}
        onClose={() => setEditingMatch(null)}
        round={round}
        students={rosterStudents}
        opportunities={opportunities}
        preferences={preferences}
        matches={matches}
        existingMatch={editingMatch}
        onUpdated={async () => {
          await refetch();
          setEditingMatch(null);
        }}
      />
    </Shell>
  );
}
