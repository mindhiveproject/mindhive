import absoluteUrl from "next-absolute-url";
import moment from "moment";
import { PROPOSAL_QUERY } from "../../../../../Queries/Proposal";
import { RESOLVE_MILESTONES_FOR_BOARD } from "../../../../../Queries/Milestone";
import { getLocalizedField } from "../../../../../../lib/i18nContent";
import {
  cardIncludedInReviewStep,
  resolveMilestonesFromQuery,
} from "../../../../../../lib/milestones";

// Accept t as optional third argument; filters are optional following arguments
export default async function exportPDF(
  proposalId,
  client,
  t,
  selectedStatuses = [],
  selectedReviewSteps = [],
  selectedAssignedUsers = [],
  locale = "en-us"
) {
  if (!proposalId || !client) return;

  const { origin } = absoluteUrl();
  const { data: proposalData } = await client.query({
    query: PROPOSAL_QUERY,
    variables: { id: proposalId },
    fetchPolicy: "network-only"
  });

  // The List View filters by milestone key; resolve the board's milestones so
  // cards that store legacy step names (ACTION_*) still match.
  const { data: milestoneData } = await client.query({
    query: RESOLVE_MILESTONES_FOR_BOARD,
    variables: { boardId: proposalId },
  });
  const milestones = resolveMilestonesFromQuery(milestoneData);

  const proposal = proposalData?.proposalBoard || {};
  const title = proposal?.title || "";
  const description = proposal?.description || "";
  const sections = proposal?.sections || [];
  const study = proposal?.study || {};

  // Submit statuses from proposal (same as PDF/Main.js)
  const submitStatuses = {
    ACTION_SUBMIT: proposal?.submitProposalStatus,
    ACTION_PEER_FEEDBACK: proposal?.peerFeedbackStatus,
    ACTION_PROJECT_REPORT: proposal?.projectReportStatus,
  };

  // Order sections by position
  const orderedSections = [...sections].sort((a, b) => a.position - b.position);
  
  // Generate content for PDF using the same filtering logic as PDF/Main.js
  const allCardsContent = orderedSections.map((section) => {
    const orderedCards = [...section.cards].sort((a, b) => a.position - b.position);
    
    // Find action cards to determine submission stage (same logic as PDF/Main.js)
    const actionCards = orderedCards
      .filter(
        (card) =>
          card?.type === "ACTION_SUBMIT" ||
          card?.type === "ACTION_PEER_FEEDBACK" ||
          card?.type === "ACTION_COLLECTING_DATA" ||
          card?.type === "ACTION_PROJECT_REPORT"
      )
      .map((c) => c?.type);
    const submissionStage = actionCards?.length ? actionCards[0] : undefined;
    const submissionStatus = submitStatuses[submissionStage];
    
    // Filter cards using the same logic as PDF/Main.js
    const filteredCardsWithTitles = orderedCards
      .filter(
        (card) =>
          // Status filter: empty array means show all, otherwise check if status is included
          (selectedStatuses.length === 0 ||
            selectedStatuses.includes(card?.settings?.status)) &&
          // Must be included in report
          card?.settings?.includeInReport &&
          // Milestone filter: empty array means show all, otherwise check if any selected milestone matches
          (selectedReviewSteps.length === 0 ||
            selectedReviewSteps.some((step) =>
              cardIncludedInReviewStep(card, step, milestones)
            )) &&
          // Assigned users filter: empty array means show all, otherwise check if any selected assignee matches
          (selectedAssignedUsers.length === 0 ||
            selectedAssignedUsers.some((userId) =>
              (card?.assignedTo || []).some((u) => u?.id === userId)
            ))
      )
      .map((card) => {
        // Determine if card is locked (same logic as PDF/Main.js)
        const isLocked =
          submissionStatus === "SUBMITTED" ||
          card?.settings?.includeInReviewSteps?.some(
            (step) => submitStatuses[step] === "SUBMITTED"
          );
        // Use revisedContent for locked cards, content for unlocked cards
        const cardContent = isLocked
          ? card?.revisedContent || card?.content
          : card?.content;
        return {
          id: card?.id,
          title: card?.title || "",
          html: cardContent || "",
          tasks: (card?.tasks || [])
            .map((task) => ({
              title: getLocalizedField(task, "title", locale) || task?.title || "",
              taskType: task?.taskType,
            }))
            .filter((task) => task.title),
        };
      });

    return {
      id: section?.id,
      title: section?.title || "",
      cards: filteredCardsWithTitles,
    };
  });

  // Sections left empty by the filters are dropped from the document.
  const visibleSections = allCardsContent.filter((section) => section.cards.length);


  const studyURL = study?.slug ? `${origin}/studies/${study.slug}` : "";
  const date = moment().format("LL");
  generatePDFBrowserPrint({ title, description, studyURL, sections: visibleSections, date, t });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function label(t, key, fallback, params = {}) {
  return typeof t === "function" ? t(key, params, { default: fallback }) : fallback;
}

function generatePDFBrowserPrint({ title, description, studyURL, sections, date, t }) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const docTitle = title || label(t, "proposalPage.untitledBoard", "Project board");
  const downloadLabel = label(t, "proposalPage.downloadPdf", "Download PDF");
  const closeLabel = label(t, "proposalPage.closePdf", "Close");
  const indexLabel = label(t, "proposalPage.pdfIndex", "Index");
  const studyLabel = label(t, "proposalPage.pdfStudyUrl", "Study URL");
  const generatedOn = label(t, "proposalPage.pdfGeneratedOn", `Generated on ${date}`, { date });
  const tasksLabel = label(t, "proposalPage.pdfTasksAndSurveys", "Selected tasks & surveys");
  const typeLabels = {
    TASK: label(t, "proposalPage.pdfTypeTask", "Task"),
    SURVEY: label(t, "proposalPage.pdfTypeSurvey", "Survey"),
    BLOCK: label(t, "proposalPage.pdfTypeBlock", "Block"),
  };
  const emptyLabel = label(
    t,
    "proposalPage.pdfEmpty",
    "No cards match the selected filters, or no card is marked to be included in the report."
  );

  const meta = [
    studyURL
      ? `<div class="metaRow"><span class="metaLabel">${escapeHtml(studyLabel)}</span><a href="${escapeHtml(studyURL)}">${escapeHtml(studyURL)}</a></div>`
      : "",
    `<div class="metaRow generated">${escapeHtml(generatedOn)}</div>`,
  ].join("");

  const index = sections.length > 1 || sections.some((s) => s.cards.length > 1)
    ? `<nav aria-label="${escapeHtml(indexLabel)}">
        <h2>${escapeHtml(indexLabel)}</h2>
        <ol>${sections
          .map(
            (section, si) => `<li>
              <a href="#section-${si}">${escapeHtml(section.title)}</a>
              <ul>${section.cards
                .map((card, ci) => `<li><a href="#card-${si}-${ci}">${escapeHtml(card.title)}</a></li>`)
                .join("")}</ul>
            </li>`
          )
          .join("")}</ol>
      </nav>`
    : "";

  const body = sections.length
    ? sections
        .map(
          (section, si) => `
        <section class="section">
          <h2 id="section-${si}"><span class="sectionNumber">${si + 1}</span>${escapeHtml(section.title)}</h2>
          ${section.cards
            .map(
              (card, ci) => `
            <article class="card" id="card-${si}-${ci}">
              <h3>${escapeHtml(card.title)}</h3>
              <div class="cardBody">${card.html}</div>
              ${card.tasks?.length ? `
              <div class="attachedTasks">
                <h4>${escapeHtml(tasksLabel)}</h4>
                <div class="chips">${card.tasks
                  .map(
                    (task) =>
                      `<span class="chip">${escapeHtml(task.title)}${typeLabels[task.taskType] ? `<span class="chipType">${escapeHtml(typeLabels[task.taskType])}</span>` : ""}</span>`
                  )
                  .join("")}</div>
              </div>` : ""}
            </article>`
            )
            .join("")}
        </section>`
        )
        .join("")
    : `<p class="empty">${escapeHtml(emptyLabel)}</p>`;

  printWindow.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(docTitle)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    body { font-family: Inter, sans-serif; color: #171717; background: #fff; margin: 0; line-height: 1.5; }
    main { max-width: 900px; margin: 0 auto; padding: 24px; }
    h1 { font-size: 32px; font-weight: 600; line-height: 1.25; margin: 24px 0 8px; color: #274E5B; }
    .description { color: #4a4a4a; font-size: 16px; margin: 0 0 16px; }
    .meta { display: flex; flex-direction: column; gap: 4px; padding: 12px 16px; background: #f4f8f7; border-radius: 8px; font-size: 14px; }
    .metaLabel { font-weight: 500; color: #4a4a4a; margin-inline-end: 8px; }
    .generated { color: #6a6a6a; font-size: 13px; }
    a { color: #336F8A; overflow-wrap: anywhere; }
    nav h2, .section > h2 { font-size: 24px; font-weight: 600; margin: 40px 0 16px; color: #274E5B; border-bottom: 2px solid #e6e6e6; padding-bottom: 8px; break-after: avoid; }
    .sectionNumber { display: inline-block; min-width: 28px; color: #9ca3af; font-weight: 500; }
    nav ol { padding-inline-start: 20px; }
    nav ul { list-style: none; padding-inline-start: 16px; }
    nav li { margin: 4px 0; break-inside: avoid; }
    nav ol > li > a { font-weight: 600; }
    .card { margin: 0 0 24px; padding-inline-start: 16px; border-inline-start: 3px solid #d9e7e4; }
    .card h3 { font-size: 18px; font-weight: 600; margin: 0 0 8px; break-after: avoid; }
    .cardBody { font-size: 14px; overflow-wrap: anywhere; }
    .cardBody h1, .cardBody h2, .cardBody h3, .cardBody h4 { color: #171717; font-weight: 600; margin: 16px 0 8px; border: none; padding: 0; }
    .cardBody h1 { font-size: 20px; } .cardBody h2 { font-size: 18px; } .cardBody h3 { font-size: 16px; } .cardBody h4 { font-size: 14px; }
    .cardBody p { margin: 8px 0; }
    .cardBody ul, .cardBody ol { padding-inline-start: 20px; margin: 8px 0; }
    .cardBody li { margin: 2px 0; }
    .cardBody blockquote { margin: 12px 0; padding: 8px 16px; border-inline-start: 3px solid #336F8A; background: #f5f5f5; border-radius: 0 6px 6px 0; }
    .cardBody pre, .cardBody code { font-family: monospace; background: #f0f0f0; padding: 2px 6px; border-radius: 4px; white-space: pre-wrap; }
    .cardBody img { max-width: 100%; height: auto; border-radius: 4px; }
    .cardBody table { width: 100%; border-collapse: collapse; table-layout: fixed; margin: 12px 0; }
    .cardBody th, .cardBody td { border: 1px solid #e6e6e6; padding: 6px 10px; vertical-align: top; text-align: start; }
    .cardBody th { background: #f4f8f7; font-weight: 500; color: #4a4a4a; }
    .cardBody tr { break-inside: avoid; }
    .attachedTasks { margin-top: 16px; }
    .attachedTasks h4 { font-size: 13px; font-weight: 600; text-transform: letter-spacing: 0.04em; color: #6a6a6a; margin: 0 0 8px; }
    .chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .chip { display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 12px; border: 1px solid #d3e0e3; border-radius: 100px; background: #fff; color: #171717; font-size: 13px; font-weight: 500; break-inside: avoid; }
    .chipType { color: #6a6a6a; font-size: 11px; font-weight: 400; }
    .empty { color: #6a6a6a; font-style: italic; margin-top: 32px; }
    .controls { position: sticky; top: 0; z-index: 1; display: flex; gap: 12px; justify-content: flex-end; padding: 12px 24px; background: rgba(255,255,255,0.85); backdrop-filter: blur(8px); border-bottom: 1px solid #e6e6e6; }
    .controls button { height: 40px; padding: 0 24px; border-radius: 100px; font: 500 14px Inter, sans-serif; cursor: pointer; }
    .download { background: #336F8A; color: #fff; border: 1px solid #336F8A; }
    .close { background: #fff; color: #336F8A; border: 1px solid #336F8A; }
    @media print {
      @page { size: A4; margin: 18mm; }
      .controls { display: none; }
      main { padding: 0; max-width: none; }
      h1 { font-size: 24px; margin-top: 0; }
      .description { font-size: 13px; }
      .meta { font-size: 11px; }
      nav h2, .section > h2 { font-size: 18px; margin-top: 28px; }
      .card h3 { font-size: 14px; }
      .cardBody { font-size: 11px; }
      .chip { height: 22px; font-size: 10px; padding: 0 10px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .chipType { font-size: 9px; }
      .cardBody h1 { font-size: 15px; } .cardBody h2 { font-size: 14px; } .cardBody h3, .cardBody h4 { font-size: 12px; }
      a { color: inherit; text-decoration: none; }
      .meta a { color: #336F8A; }
    }
  </style>
</head>
<body>
  <div class="controls">
    <button type="button" class="download" onclick="window.print()">${escapeHtml(downloadLabel)}</button>
    <button type="button" class="close" onclick="window.close()">${escapeHtml(closeLabel)}</button>
  </div>
  <main>
    <h1>${escapeHtml(docTitle)}</h1>
    ${description ? `<p class="description">${escapeHtml(description)}</p>` : ""}
    <div class="meta">${meta}</div>
    ${index}
    ${body}
  </main>
</body>
</html>`);
  printWindow.document.close();
  printWindow.focus();
}
