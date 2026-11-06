import Chip from "../../../../../DesignSystem/Chip";

// The creator first, then the collaborators, each once.
export const getPeople = (item) => {
  const seen = new Set();
  return [item?.author, ...(item?.collaborators || [])].filter((p) => {
    if (!p?.username || seen.has(p.id || p.username)) return false;
    seen.add(p.id || p.username);
    return true;
  });
};

/**
 * Dropdown option for a project or study: its title with a chip per person
 * (creator and collaborators). The search field matches the title and the
 * people's usernames.
 */
export function peopleOption(item, untitled) {
  const title = item?.title || untitled;
  const people = getPeople(item);
  return {
    value: item.id,
    labelText: title,
    searchText: people.map((p) => p.username).join(" "),
    label: (
      <span
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 6,
          minWidth: 0,
          padding: "2px 0",
        }}
      >
        <span style={{ overflowWrap: "anywhere" }}>{title}</span>
        {people.length > 0 && (
          <span style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {people.map((p) => (
              <Chip key={p.id || p.username} variant="static" label={p.username} />
            ))}
          </span>
        )}
      </span>
    ),
  };
}
