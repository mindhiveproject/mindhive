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
 * A declared key spelled from what the author called the parameter —
 * "Particle Size" becomes `particleSize`, which is what `params.particleSize`
 * will read in the sketch.
 *
 * @param {string} name
 * @returns {string} The key, or "" when nothing usable is left of the name.
 */
export function keyFromName(name) {
  const words = String(name).match(/[\p{L}\p{N}]+/gu) || [];
  const key = words
    .map((word, index) => {
      const first = index === 0 ? word[0].toLowerCase() : word[0].toUpperCase();
      return first + word.slice(1);
    })
    .join("");
  return /^[\p{L}_$]/u.test(key) ? key : "";
}

/**
 * Changes fields of one parameter's declaration in place.
 *
 * Works field by field, like `removeParameter` works entry by entry: a field in
 * the patch has its value replaced where it stands, a field that isn't there
 * yet is appended, and a field set to `undefined` is cut out. Every other byte
 * of the entry — comments, expressions like `max: Math.PI * 2` in fields the
 * patch doesn't name — is left as the author wrote it.
 *
 * @param {string} source
 * @param {string} key
 * @param {Record<string, any>} patch - Field → new JSON-able value, or `undefined` to remove it.
 * @returns {string | null} The edited source. `null` when the entry can't be
 *   edited safely: it isn't a plain object literal (a spread, a variable, a
 *   call), or the edit wouldn't leave one that parses. An empty patch is a dry
 *   run that answers exactly that.
 */
export function updateParameter(source, key, patch) {
  const body = findDeclarationBody(source);
  if (!body) return null;

  const innerStart = body.open + 1;
  const inner = source.slice(innerStart, body.close);
  const range = splitTopLevelEntries(inner).find(
    (entry) => topLevelKey(inner.slice(entry.start, entry.end)) === key
  );
  if (!range) return null;

  const text = inner.slice(range.start, range.end);
  const valueStart = entryValueStart(text);
  if (valueStart === -1) return null;

  const literal = text.slice(valueStart).trimEnd();
  if (!literal.startsWith("{") || !literal.endsWith("}")) return null;

  let edited = literal;
  for (const [field, value] of Object.entries(patch)) {
    edited = setField(edited, field, value);
  }

  // Parsed, never run. Anything the splice got wrong, or a literal this scanner
  // misread, shows up here rather than as a syntax error in the author's file.
  try {
    new Function(`return (${edited});`);
  } catch (e) {
    return null;
  }

  const from = innerStart + range.start + valueStart;
  return source.slice(0, from) + edited + source.slice(from + literal.length);
}

/** Where the value begins in one `key: value` entry, past any comment above it. */
function entryValueStart(entry) {
  const match =
    /^(?:\s|\/\/[^\n]*\n|\/\*[\s\S]*?\*\/)*["']?[A-Za-z_$][\w$]*["']?\s*:\s*/.exec(
      entry
    );
  return match ? match[0].length : -1;
}

/** Sets, adds or (for `undefined`) removes one field of an object literal. */
function setField(literal, name, value) {
  const inner = literal.slice(1, -1);
  const fields = splitTopLevelEntries(inner);
  const range = fields.find(
    (field) => topLevelKey(inner.slice(field.start, field.end)) === name
  );

  if (value === undefined) {
    if (!range) return literal;
    const contentEnd = range.start + inner.slice(range.start, range.end).trimEnd().length;
    const hasComma = inner[contentEnd] === ",";
    return `{${inner.slice(0, range.start)}${inner.slice(
      contentEnd + (hasComma ? 1 : 0)
    )}}`;
  }

  const json = JSON.stringify(value);

  if (range) {
    const text = inner.slice(range.start, range.end);
    const valueFrom = range.start + entryValueStart(text);
    const valueTo = range.start + text.trimEnd().length;
    return `{${inner.slice(0, valueFrom)}${json}${inner.slice(valueTo)}}`;
  }

  if (fields.length === 0) return `{ ${name}: ${json} }`;

  // The new field takes the last one's indentation, so it lands on its own line
  // in a multi-line object and beside it in a one-line one. A comment written
  // above the last field is looked past: it is not the indentation.
  const last = fields[fields.length - 1];
  const text = inner.slice(last.start, last.end);
  const blanked = text
    .replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, " "))
    .replace(/\/\/[^\n]*/g, (comment) => " ".repeat(comment.length));
  const gap = /^\s*/.exec(blanked)[0];
  const lead = gap.includes("\n") ? gap.slice(gap.lastIndexOf("\n")) : " ";
  if (inner[last.end] === ",") {
    return `{${inner.slice(0, last.end + 1)}${lead}${name}: ${json},${inner.slice(
      last.end + 1
    )}}`;
  }
  const contentEnd = last.start + text.trimEnd().length;
  return `{${inner.slice(0, contentEnd)},${lead}${name}: ${json}${inner.slice(
    contentEnd
  )}}`;
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
