// Builds the "Tasks and Surveys descriptions" document from the task bank's
// visible set and opens it in a print window, where the browser's print dialog
// saves it as a PDF (same approach as the project board export,
// Builder/Project/ProjectBoard/Board/PDF/exportPDF.js).
//
// Every field is read in the viewer's language and falls back to English
// field by field; fields that are empty in both are left out.

const FALLBACK_LOCALE = "en-us";

const TYPE_GROUPS = [
  { taskType: "TASK", labelKey: "tasks", default: "Tasks" },
  { taskType: "SURVEY", labelKey: "surveys", default: "Surveys" },
  { taskType: "BLOCK", labelKey: "blocks", default: "Blocks" },
];

const SURVEY_ITEM_LABEL_KEYS = [
  "text",
  "vas",
  "likert",
  "freeinput",
  "select",
  "checkbox",
];

// --- HTML safety ------------------------------------------------------------
// Task fields can hold rich text. The print window shares the app's origin, so
// only a small formatting allowlist survives; everything else is unwrapped or,
// for active content, dropped.

const ALLOWED_TAGS = new Set([
  "P",
  "BR",
  "B",
  "STRONG",
  "I",
  "EM",
  "U",
  "S",
  "SUB",
  "SUP",
  "SPAN",
  "DIV",
  "UL",
  "OL",
  "LI",
  "A",
  "BLOCKQUOTE",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
]);
const DROPPED_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "IFRAME",
  "OBJECT",
  "EMBED",
  "TEMPLATE",
  "NOSCRIPT",
  "SVG",
  "MATH",
  "FORM",
  "INPUT",
  "BUTTON",
  "TEXTAREA",
  "SELECT",
  "LINK",
  "META",
]);
const SAFE_HREF = /^(https?:|mailto:)/i;

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function cleanNode(node) {
  [...node.childNodes].forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) return;
    if (child.nodeType !== Node.ELEMENT_NODE) {
      child.remove();
      return;
    }
    if (DROPPED_TAGS.has(child.tagName)) {
      child.remove();
      return;
    }
    cleanNode(child);
    if (!ALLOWED_TAGS.has(child.tagName)) {
      child.replaceWith(...child.childNodes);
      return;
    }
    [...child.attributes].forEach((attr) => {
      const keep =
        child.tagName === "A" &&
        attr.name === "href" &&
        SAFE_HREF.test(attr.value.trim());
      if (!keep) child.removeAttribute(attr.name);
    });
    if (child.tagName === "A") {
      child.setAttribute("target", "_blank");
      child.setAttribute("rel", "noopener noreferrer");
    }
  });
}

// Rich text → sanitized HTML; plain text → escaped, keeping its line breaks.
function formatText(value) {
  const text = String(value).trim();
  if (!/<[a-z!/]/i.test(text)) {
    return escapeHtml(text).replace(/\n/g, "<br>");
  }
  // DOMParser documents are inert: nothing in them loads or runs.
  const doc = new DOMParser().parseFromString(text, "text/html");
  cleanNode(doc.body);
  return doc.body.innerHTML;
}

// --- Field resolution -------------------------------------------------------

function isFilled(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim() !== "";
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function parseJsonList(value) {
  if (Array.isArray(value)) return value;
  if (!isFilled(value)) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// The first filled value among: the viewer's language, English, and the base
// (untranslated) field, which is authored in English.
function makeResolver(task, locale) {
  const sources = [
    task?.i18nContent?.[locale],
    task?.i18nContent?.[FALLBACK_LOCALE],
    task,
  ];
  const pick = (read) => {
    for (const source of sources) {
      const value = source ? read(source) : undefined;
      if (isFilled(value)) return value;
    }
    return undefined;
  };
  return {
    field: (name) => pick((s) => s?.[name]),
    setting: (name) => pick((s) => s?.settings?.[name]),
    list: (name) => pick((s) => parseJsonList(s?.settings?.[name])) || [],
    parameters: () => pick((s) => s?.parameters) || [],
  };
}

function surveyItemsFrom(parameters) {
  return parameters
    .filter((param) => param?.type === "survey")
    .flatMap((param) => {
      try {
        const pages = JSON.parse(param?.value);
        return Array.isArray(pages) ? pages : [];
      } catch {
        return [];
      }
    })
    .flatMap((page) => page?.page || []);
}

// --- Document ---------------------------------------------------------------

function buildRows(task, locale, { t, tBuilder }) {
  const resolve = makeResolver(task, locale);
  const taskType = task?.taskType?.toLowerCase() || "task";
  const rows = [];
  const add = (label, html) => {
    if (isFilled(html)) rows.push({ label, html });
  };
  const text = (value) => (isFilled(value) ? formatText(value) : "");

  add(
    t("taskDescriptionsExport.inBrief", {}, { default: "In brief" }),
    text(resolve.setting("addInfo"))
  );
  add(
    tBuilder("taskPage.duration", {}, { default: "Duration" }),
    text(resolve.setting("duration"))
  );

  const mobile = resolve.setting("mobileCompatible");
  if (typeof mobile === "boolean") {
    add(
      tBuilder(
        "taskPage.mobileCompatible",
        {},
        { default: "Mobile compatible" }
      ),
      mobile
        ? escapeHtml(t("taskDescriptionsExport.yes", {}, { default: "Yes" }))
        : escapeHtml(t("taskDescriptionsExport.no", {}, { default: "No" }))
    );
  }

  add(
    tBuilder(
      "taskPage.before",
      { taskType },
      {
        default: `What participants see before taking the ${taskType}`,
      }
    ),
    text(resolve.setting("descriptionBefore"))
  );
  add(
    tBuilder(
      "taskPage.after",
      { taskType },
      {
        default: `What participants see after taking the ${taskType}`,
      }
    ),
    text(resolve.setting("descriptionAfter"))
  );
  add(
    t("taskDescriptionsExport.description", {}, { default: "Description" }),
    text(resolve.field("description"))
  );
  add(
    t(
      "taskDescriptionsExport.descriptionForParticipants",
      {},
      {
        default: "Description for participants",
      }
    ),
    text(resolve.field("descriptionForParticipants"))
  );
  add(
    tBuilder("taskPage.background", {}, { default: "Background" }),
    text(resolve.setting("background"))
  );

  const parameters = resolve.parameters();
  const tweakable = parameters.filter(
    (p) => p?.type !== "survey" && isFilled(p?.value)
  );
  add(
    tBuilder("taskPage.parameters", {}, { default: "Parameters" }),
    tweakable.length
      ? `<ul>${tweakable
          .map(
            (p) =>
              `<li><strong>${escapeHtml(
                p?.help || p?.name || ""
              )}</strong>: ${formatText(p.value)}</li>`
          )
          .join("")}</ul>`
      : ""
  );

  const surveyItems = surveyItemsFrom(parameters).filter(
    (item) => isFilled(item?.header) || isFilled(item?.text)
  );
  add(
    tBuilder("taskPage.surveyParameters", {}, { default: "Survey parameters" }),
    surveyItems.length
      ? `<ol>${surveyItems
          .map((item) => {
            const typeLabel = SURVEY_ITEM_LABEL_KEYS.includes(item?.type)
              ? `<em>${escapeHtml(tBuilder(`taskPage.${item.type}`))}</em> `
              : "";
            const parts = [item?.header, item?.text]
              .filter(isFilled)
              .map(formatText);
            return `<li>${typeLabel}${parts.join("<br>")}</li>`;
          })
          .join("")}</ol>`
      : ""
  );

  const aggregateVariables = resolve.list("aggregateVariables");
  add(
    tBuilder(
      "taskPage.aggregateVariables",
      {},
      { default: "Aggregate Variables" }
    ),
    aggregateVariables.length
      ? `<ul>${aggregateVariables
          .map((variable) => {
            // Stored either as plain names or as { varName, varDesc }.
            if (typeof variable === "string")
              return `<li>${formatText(variable)}</li>`;
            const name = isFilled(variable?.varName)
              ? `<strong>${formatText(variable.varName)}</strong>`
              : "";
            const desc = isFilled(variable?.varDesc)
              ? formatText(variable.varDesc)
              : "";
            return `<li>${[name, desc].filter(Boolean).join(": ")}</li>`;
          })
          .join("")}</ul>`
      : ""
  );

  add(
    tBuilder("taskPage.scoring", {}, { default: "Scoring" }),
    text(resolve.setting("scoring"))
  );
  add(
    tBuilder("taskPage.format", {}, { default: "Format" }),
    text(resolve.setting("format"))
  );

  const resources = resolve.list("resources").filter(isFilled);
  add(
    tBuilder("taskPage.resources", {}, { default: "Resources" }),
    resources.length
      ? `<ul>${resources.map((r) => `<li>${formatText(r)}</li>`).join("")}</ul>`
      : ""
  );

  return { title: resolve.field("title") || task?.title || "", rows };
}

export function buildTaskDescriptionsHtml({ tasks, locale, t, tBuilder }) {
  const groups = TYPE_GROUPS.map((group) => ({
    ...group,
    label: t(group.labelKey, {}, { default: group.default }),
    entries: tasks
      .filter((task) => task?.taskType === group.taskType)
      .map((task) => ({
        id: task.id,
        ...buildRows(task, locale, { t, tBuilder }),
      }))
      .sort((a, b) => a.title.localeCompare(b.title, locale)),
  })).filter((group) => group.entries.length);

  const title = t(
    "taskDescriptionsExport.title",
    {},
    {
      default: "MindHive Task & Survey Descriptions",
    }
  );
  const intro = t(
    "taskDescriptionsExport.intro",
    {},
    {
      default:
        "Below you will find descriptions of the tasks and surveys available to you on MindHive. Click a title in the index to jump to it.",
    }
  );
  const indexLabel = t(
    "taskDescriptionsExport.index",
    {},
    { default: "Index" }
  );
  const generatedOn = t(
    "taskDescriptionsExport.generatedOn",
    { date: new Date().toLocaleDateString(locale) },
    { default: `Generated on ${new Date().toLocaleDateString(locale)}` }
  );

  const index = groups
    .map(
      (group) => `
        <li>
          <a href="#group-${group.taskType}">${escapeHtml(group.label)}</a>
          <ul>${group.entries
            .map(
              (entry) =>
                `<li><a href="#task-${escapeHtml(entry.id)}">${escapeHtml(
                  entry.title
                )}</a></li>`
            )
            .join("")}</ul>
        </li>`
    )
    .join("");

  const sections = groups
    .map(
      (group) => `
        <section class="group">
          <h2 id="group-${group.taskType}">${escapeHtml(group.label)}</h2>
          ${group.entries
            .map(
              (entry) => `
                <article class="entry" id="task-${escapeHtml(entry.id)}">
                  <h3>${escapeHtml(entry.title)}</h3>
                  <table>
                    <colgroup><col class="labelCol"><col></colgroup>
                    <tbody>${entry.rows
                      .map(
                        (row) =>
                          `<tr><th scope="row">${escapeHtml(
                            row.label
                          )}</th><td>${row.html}</td></tr>`
                      )
                      .join("")}</tbody>
                  </table>
                </article>`
            )
            .join("")}
        </section>`
    )
    .join("");

  return { title, intro, indexLabel, generatedOn, index, sections };
}

export default function exportTaskDescriptions({ tasks, locale, t, tBuilder }) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const doc = buildTaskDescriptionsHtml({ tasks, locale, t, tBuilder });
  const dir = locale?.startsWith("ar") ? "rtl" : "ltr";
  const downloadLabel = t(
    "taskDescriptionsExport.download",
    {},
    { default: "Download PDF" }
  );
  const closeLabel = t(
    "taskDescriptionsExport.close",
    {},
    { default: "Close" }
  );

  printWindow.document.write(`<!DOCTYPE html>
<html lang="${escapeHtml(locale || FALLBACK_LOCALE)}" dir="${dir}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(doc.title)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    body { font-family: Inter, sans-serif; color: #171717; background: #fff; margin: 0; line-height: 1.5; }
    main { max-width: 900px; margin: 0 auto; padding: 24px; }
    h1 { font-size: 32px; font-weight: 600; margin: 24px 0 8px; color: #274E5B; }
    h2 { font-size: 24px; font-weight: 600; margin: 40px 0 16px; color: #274E5B; border-bottom: 2px solid #e6e6e6; padding-bottom: 8px; }
    h3 { font-size: 18px; font-weight: 600; margin: 32px 0 8px; break-after: avoid; }
    p { margin: 8px 0; }
    a { color: #336F8A; }
    .intro { color: #4a4a4a; }
    .generated { color: #6a6a6a; font-size: 13px; }
    nav ul { list-style: none; padding-left: 0; }
    nav ul ul { padding-left: 16px; }
    nav li { margin: 4px 0; break-inside: avoid; }
    nav > ul > li > a { font-weight: 600; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    .labelCol { width: 32%; }
    th, td { border: 1px solid #e6e6e6; padding: 8px 12px; vertical-align: top; text-align: start; font-size: 14px; overflow-wrap: anywhere; }
    th { background: #f4f8f7; font-weight: 500; color: #4a4a4a; }
    tr { break-inside: avoid; }
    td ul, td ol { margin: 0; padding-inline-start: 20px; }
    td li { margin: 2px 0; }
    .controls { position: sticky; top: 0; z-index: 1; display: flex; gap: 12px; justify-content: flex-end; padding: 12px 24px; background: rgba(255,255,255,0.85); backdrop-filter: blur(8px); border-bottom: 1px solid #e6e6e6; }
    .controls button { height: 40px; padding: 0 24px; border-radius: 100px; font: 500 14px Inter, sans-serif; cursor: pointer; }
    .download { background: #336F8A; color: #fff; border: 1px solid #336F8A; }
    .close { background: #fff; color: #336F8A; border: 1px solid #336F8A; }
    @media print {
      @page { size: A4; margin: 18mm; }
      .controls { display: none; }
      main { padding: 0; max-width: none; }
      .group { break-before: page; }
      h1 { font-size: 24px; }
      h2 { font-size: 18px; }
      h3 { font-size: 14px; }
      th, td { font-size: 11px; padding: 6px 8px; }
      a { color: inherit; text-decoration: none; }
    }
  </style>
</head>
<body>
  <div class="controls">
    <button type="button" class="download" onclick="window.print()">${escapeHtml(
      downloadLabel
    )}</button>
    <button type="button" class="close" onclick="window.close()">${escapeHtml(
      closeLabel
    )}</button>
  </div>
  <main>
    <h1>${escapeHtml(doc.title)}</h1>
    <p class="intro">${escapeHtml(doc.intro)}</p>
    <p class="generated">${escapeHtml(doc.generatedOn)}</p>
    <nav aria-label="${escapeHtml(doc.indexLabel)}">
      <h2>${escapeHtml(doc.indexLabel)}</h2>
      <ul>${doc.index}</ul>
    </nav>
    ${doc.sections}
  </main>
</body>
</html>`);
  printWindow.document.close();
  printWindow.focus();
}
