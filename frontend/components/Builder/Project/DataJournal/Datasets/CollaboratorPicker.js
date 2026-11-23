import { useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import { GET_DATASOURCE_COLLABORATOR_CANDIDATES } from "../../../../Queries/Datasource";

/**
 * Pick a dataset's collaborators from its study's and board's team (the server
 * refuses anyone else: keystone/lib/datasourceTeam.ts). People already on the
 * list who are no longer on the team stay listed, so they can be removed.
 *
 * @param {{
 *   datasourceId: string,
 *   current: Array<{ id: string, username?: string | null }>,
 *   selected: string[],
 *   onChange: (ids: string[]) => void,
 *   disabled?: boolean,
 *   linked?: boolean,
 * }} props — `linked`: the dataset belongs to a study, board or journal
 */
export default function CollaboratorPicker({
  datasourceId,
  current = [],
  selected,
  onChange,
  disabled = false,
  linked = false,
}) {
  const { t } = useTranslation("builder");
  const { data, loading, error } = useQuery(
    GET_DATASOURCE_COLLABORATOR_CANDIDATES,
    {
      variables: { id: datasourceId },
      skip: !datasourceId || disabled,
      fetchPolicy: "cache-and-network",
    },
  );

  const team = data?.datasourceCollaboratorCandidates || [];
  const teamIds = new Set(team.map((p) => p.id));
  const formerMembers = current.filter((p) => p?.id && !teamIds.has(p.id));
  const people = [...team, ...formerMembers];
  const selectedSet = new Set(selected);

  const toggle = (id) => {
    if (disabled) return;
    onChange(
      selectedSet.has(id)
        ? selected.filter((x) => x !== id)
        : [...selected, id],
    );
  };

  const allTeamSelected = team.length > 0 && team.every((p) => selectedSet.has(p.id));
  const addWholeTeam = () => {
    if (disabled) return;
    onChange([...new Set([...selected, ...team.map((p) => p.id)])]);
  };

  const muted = { color: "#a0aec0", margin: 0 };

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "6px",
        }}
      >
        <span className="MH-Type-Label-Base" style={{ color: "#2d3748" }}>
          {t("dataJournal.datasets.collaborators.title", {}, {
            default: "Collaborators",
          })}
        </span>
        {!disabled && team.length > 0 ? (
          <button
            type="button"
            className="MH-Type-Label-Base"
            onClick={addWholeTeam}
            disabled={allTeamSelected}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              color: allTeamSelected ? "#a0aec0" : "#336F8A",
              cursor: allTeamSelected ? "default" : "pointer",
            }}
          >
            {t("dataJournal.datasets.collaborators.addWholeTeam", {}, {
              default: "Add the whole team",
            })}
          </button>
        ) : null}
      </div>
      <p className="MH-Type-Body-Base" style={{ ...muted, marginBottom: "8px" }}>
        {t("dataJournal.datasets.collaborators.help", {}, {
          default:
            "Collaborators can see and edit this dataset. Only people working on its study or project board can be added.",
        })}
      </p>
      {loading && !data ? (
        <p className="MH-Type-Body-Base" style={muted}>
          {t("dataJournal.datasets.collaborators.loading", {}, {
            default: "Loading the team…",
          })}
        </p>
      ) : null}
      {error ? (
        <p className="MH-Type-Body-Base" style={{ color: "#c53030", margin: 0 }}>
          {error.message}
        </p>
      ) : null}
      {!loading && !error && people.length === 0 ? (
        <p className="MH-Type-Body-Base" style={muted}>
          {linked
            ? t("dataJournal.datasets.collaborators.noOneElse", {}, {
                default:
                  "Nobody else works on this dataset's study or project board yet, so there is no one to add.",
              })
            : t("dataJournal.datasets.collaborators.noTeam", {}, {
                default:
                  "This dataset is not linked to a study or project board, so it stays private to you.",
              })}
        </p>
      ) : null}
      {people.length > 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            maxHeight: "200px",
            overflowY: "auto",
          }}
        >
          {people.map((person) => {
            const isFormer = !teamIds.has(person.id);
            return (
              <label
                key={person.id}
                className="MH-Type-Body-Base"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: disabled ? "not-allowed" : "pointer",
                  color: "#2d3748",
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedSet.has(person.id)}
                  disabled={disabled || (isFormer && !selectedSet.has(person.id))}
                  onChange={() => toggle(person.id)}
                />
                <span>{person.username || person.id}</span>
                {isFormer ? (
                  <span style={{ color: "#a0aec0" }}>
                    {t("dataJournal.datasets.collaborators.notOnTeam", {}, {
                      default: "(no longer on the team)",
                    })}
                  </span>
                ) : null}
              </label>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
