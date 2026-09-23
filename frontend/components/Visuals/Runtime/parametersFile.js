// Scoped text edits on the parameter declaration file.
//
// The declaration is the single source of truth: the Parameters tab renders it,
// and Add New / Delete Parameter write back into it. That means these edits have
// to be surgical — locate the object literal passed to `declareParameters`,
// splice inside it, leave every other byte of the author's file alone. Anything
// that regenerates the file from a parsed model would put a second source of
// truth back in play, which is exactly what declaring-in-code removed.
//
// A brace match is enough here, but only if it ignores braces inside strings
// and comments — hence the small scanner rather than a regex.

/**
 * Finds the object literal argument of the first `declareParameters(` call.
 *
 * @param {string} source
 * @returns {{ open: number, close: number, indent: string } | null}
 *   `open` is the index of `{`, `close` the index of its matching `}`.
 */
export function findDeclarationBody(source) {
  const call = source.indexOf("declareParameters");
  if (call === -1) return null;

  const open = source.indexOf("{", call);
  if (open === -1) return null;

  let depth = 0;
  let i = open;
  let mode = "code"; // code | line-comment | block-comment | ' | " | `

  while (i < source.length) {
    const c = source[i];
    const next = source[i + 1];

    if (mode === "code") {
      if (c === "/" && next === "/") {
        mode = "line-comment";
        i += 2;
        continue;
      }
      if (c === "/" && next === "*") {
        mode = "block-comment";
        i += 2;
        continue;
      }
      if (c === "'" || c === '"' || c === "`") {
        mode = c;
        i += 1;
        continue;
      }
      if (c === "{") depth += 1;
      if (c === "}") {
        depth -= 1;
        if (depth === 0) {
          return { open, close: i, indent: indentOf(source, open) };
        }
      }
    } else if (mode === "line-comment") {
      if (c === "\n") mode = "code";
    } else if (mode === "block-comment") {
      if (c === "*" && next === "/") {
        mode = "code";
        i += 2;
        continue;
      }
    } else {
      // Inside a string of some kind.
      if (c === "\\") {
        i += 2;
        continue;
      }
      if (c === mode) mode = "code";
    }
    i += 1;
  }

  return null; // Unbalanced — leave the file alone.
}

function indentOf(source, index) {
  const lineStart = source.lastIndexOf("\n", index) + 1;
  const match = /^[ \t]*/.exec(source.slice(lineStart, index));
  return match ? match[0] : "";
}

/** Renders one declaration entry the way the template writes them. */
function entryLine(key, declaration) {
  const fields = Object.entries(declaration)
    .map(([field, value]) => `${field}: ${JSON.stringify(value)}`)
    .join(", ");
  return `  ${key}: { ${fields} },`;
}

/**
 * Appends a parameter to the declaration.
 *
 * @param {string} source - Current file contents.
 * @param {string} key - Declared key; must be a valid identifier.
 * @param {object} declaration - e.g. `{ type: "number", label: "Size", default: 0, min: 0, max: 1 }`
 * @returns {string} The edited source, or the original when it can't be parsed.
 */
export function addParameter(source, key, declaration) {
  const body = findDeclarationBody(source);
  if (!body) return source;

  const inner = source.slice(body.open + 1, body.close);
  const line = entryLine(key, declaration);

  // An empty `{}` needs the newlines the existing entries would have supplied.
  if (inner.trim() === "") {
    return `${source.slice(0, body.open + 1)}\n${line}\n${body.indent}${source.slice(
      body.close
    )}`;
  }

  const trimmedEnd = inner.replace(/\s*$/, "");
  const needsComma = !trimmedEnd.endsWith(",");
  return `${source.slice(0, body.open + 1)}${trimmedEnd}${
    needsComma ? "," : ""
  }\n${line}\n${body.indent}${source.slice(body.close)}`;
}

/**
 * Removes a parameter from the declaration.
 *
 * Matches the key at the top level of the object only, so a nested `label:
 * "size"` inside another entry can't be mistaken for the entry itself.
 *
 * @param {string} source
 * @param {string} key
 * @returns {string} The edited source, or the original when the key isn't found.
 */
export function removeParameter(source, key) {
  const body = findDeclarationBody(source);
  if (!body) return source;

  const innerStart = body.open + 1;
  const inner = source.slice(innerStart, body.close);
  const entries = splitTopLevelEntries(inner);
  const index = entries.findIndex(
    (range) => topLevelKey(inner.slice(range.start, range.end)) === key
  );
  if (index === -1) return source;

  // Cut the entry out by range rather than rebuilding the object from its
  // parts: an entry carries its own leading whitespace and any comment written
  // above it, and re-emitting the survivors would quietly reformat them.
  const entry = entries[index];
  const hasComma = inner[entry.end] === ",";
  const remaining =
    inner.slice(0, entry.start) + inner.slice(entry.end + (hasComma ? 1 : 0));

  // Nothing but whitespace left — close the braces up rather than leaving a
  // hollow block, so the file round-trips with what `addParameter` writes.
  const collapsed = remaining.trim() === "" ? "" : remaining;

  return `${source.slice(0, innerStart)}${collapsed}${source.slice(body.close)}`;
}

/**
 * Splits an object literal's interior on top-level commas, as `{start, end}`
 * ranges into `inner`. `end` is the index of the comma that terminates the
 * entry, or the end of the interior for a final entry with no trailing comma.
 */
function splitTopLevelEntries(inner) {
  const entries = [];
  let depth = 0;
  let start = 0;
  let mode = "code";

  for (let i = 0; i < inner.length; i += 1) {
    const c = inner[i];
    const next = inner[i + 1];

    if (mode === "code") {
      if (c === "/" && next === "/") {
        mode = "line-comment";
        i += 1;
      } else if (c === "/" && next === "*") {
        mode = "block-comment";
        i += 1;
      } else if (c === "'" || c === '"' || c === "`") {
        mode = c;
      } else if (c === "{" || c === "[" || c === "(") {
        depth += 1;
      } else if (c === "}" || c === "]" || c === ")") {
        depth -= 1;
      } else if (c === "," && depth === 0) {
        entries.push({ start, end: i });
        start = i + 1;
      }
    } else if (mode === "line-comment") {
      if (c === "\n") mode = "code";
    } else if (mode === "block-comment") {
      if (c === "*" && next === "/") {
        mode = "code";
        i += 1;
      }
    } else {
      if (c === "\\") i += 1;
      else if (c === mode) mode = "code";
    }
  }

  if (inner.slice(start).trim() !== "") {
    entries.push({ start, end: inner.length });
  }
  return entries;
}

/** The declared key of one entry, ignoring any comment lines above it. */
function topLevelKey(entry) {
  const withoutComments = entry
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")
    .trim();
  const match = /^["']?([A-Za-z_$][\w$]*)["']?\s*:/.exec(withoutComments);
  return match ? match[1] : null;
}
