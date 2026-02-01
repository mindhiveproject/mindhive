import absoluteUrl from "next-absolute-url";
import moment from "moment";
import { PROPOSAL_QUERY } from "../../../../../Queries/Proposal";

// Accept t as optional third argument; filters are optional following arguments
export default async function exportPDF(
  proposalId,
  client,
  t,
  selectedStatuses = [],
  selectedReviewSteps = [],
  selectedAssignedUsers = []
) {
  if (!proposalId || !client) return;

  const { origin } = absoluteUrl();
  const { data: proposalData } = await client.query({
    query: PROPOSAL_QUERY,
    variables: { id: proposalId },
    fetchPolicy: "network-only"
  });

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

  const styles = {
    h1: "color: #171717; font-family: Nunito, sans-serif; font-size: 32px; font-weight: 600; line-height: 44px;",
    h2: "color: #171717; font-family: 'Nunito Sans', sans-serif; font-size: 24px; font-weight: 400; line-height: 28px;",
    h3: "color: #171717; font-family: 'Nunito Sans', sans-serif; font-size: 18px; font-weight: 400; line-height: 24px;"
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
          // Review steps filter: empty array means show all, otherwise check if any selected step matches
          (selectedReviewSteps.length === 0 ||
            selectedReviewSteps.some((step) =>
              card?.settings?.includeInReviewSteps?.includes(step)
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
        return `<h3 style="${styles.h3}">${card?.title}</h3>${cardContent}`;
      });
    
    return `<h2 style="${styles.h2}">${section?.title}</h2>${filteredCardsWithTitles.join("")}`;
  });
  
  const cardsContent = allCardsContent.flat().join("");
  let studyURL = "";
  if (study?.slug) {
    studyURL = `<h3 style="${styles.h3}">Study URL: ${origin}/studies/${study?.slug}</h3>`;
  }
  const content = `<h1 style="${styles.h1}">${title}</h1><h2 style="${styles.h2}">${description}</h2>${studyURL}${cardsContent}`;
  const date = moment().format("MM-D-YYYY");
  generatePDFBrowserPrint(content, title, date, t);
}

function generatePDFBrowserPrint(content, title, date, t) {
  const printWindow = window.open('', '_blank');
  const printLabel = typeof t === 'function' ? t('proposalPage.download') : 'Download';
  const closeLabel = typeof t === 'function' ? t('closeButton') : '✕ Close';
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title || 'Proposal'}</title>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,200..1000;1,200..1000&display=swap" rel="stylesheet">
      <style>
        body {
          font-family: 'Nunito Sans', sans-serif;
          color: #333;
          background: white;
          padding: 20px;
          line-height: 1.6;
        }

        /* Headings */
        h1, h2, h3, h4, h5, h6 {
          font-weight: bold;
          margin: 1rem 0 0.5rem;
          color: #274E5B;
        }

        h1 { font-size: 2.5rem; }
        h2 { font-size: 2rem; }
        h3 { font-size: 1.75rem; }
        h4 { font-size: 1.5rem; }
        h5 { font-size: 1.25rem; }
        h6 { font-size: 1rem; }

        /* Paragraphs */
        p {
          margin: 0.75rem 0;
        }

        /* Blockquote */
        blockquote {
          border-left: 4px solid #274E5B;
          background-color: #f5f5f5;
          margin: 1rem 0;
          padding: 1rem 1.5rem;
          font-style: italic;
          border-radius: 0 8px 8px 0;
        }

        /* Lists */
        ul, ol {
          margin: 1rem 0;
          padding-left: 1.5rem;
        }

        li {
          margin-bottom: 0.5rem;
        }

        ol {
          list-style-type: decimal;
        }

        ol li ol {
          list-style-type: lower-alpha;
        }

        /* Code */
        pre, code {
          font-family: monospace;
          background-color: #f0f0f0;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          white-space: pre-wrap;
          word-break: break-word;
        }

        /* Table */
        table {
          border-collapse: collapse;
          margin: 1rem 0;
          overflow: hidden;
          table-layout: fixed;
          width: 100%;
        }

        td, th {
          border: 2px solid #ced4da;
          box-sizing: border-box;
          padding: 4px 8px;
          position: relative;
          vertical-align: top;
          font-size: 1rem;
        }

        th {
          background-color: #EFEFEF;
          font-weight: bold;
          text-align: left;
        }

        /* Images */
        .editor-image {
          max-width: 100%;
          height: auto;
          border-radius: 4px;
          margin: 1rem 0;
        }

        /* Links */
        a {
          color: #3D85B0;
          text-decoration: underline;
          cursor: pointer;
        }

        a:hover {
          color: #7D70AD;
        }

        .print-controls {
          position: sticky;
          top: 20px;
          right: 20px;
          z-index: 1000;
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          background: rgba(255, 255, 255, 0.6); /* semi-transparent white */
          backdrop-filter: blur(8px); /* applies blur to background content */
            -webkit-backdrop-filter: blur(8px); /* for Safari support */          padding: 10px;
          border-bottom: 1px solid #d1d5db;
          // border-radius: 6px;
          // box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .print-button {
          width: auto;
          height: 40px;
          display: inline-flex;
          align-items: center;
          padding: 0.75rem 1.5rem;
          margin: 1rem 0;
          background: #336F8A;
          color: white;
          border-radius: 100px;
          border: 1px solid #336F8A;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.3s ease;
        }

        .print-button:hover {
          padding: 0.75rem 1.5rem;
          border-radius: 100px;
          border: 1px #F9D978;
          color: #274E5B;
          background: #F9D978;
        }

        .close-button {
          width: auto;
          height: 40px;
          display: inline-flex;
          align-items: center;
          padding: 0.75rem 1.5rem;
          margin: 1rem 0;
          background: white;
          color: #f56565;
          border-radius: 100px;
          border: 1px solid #f56565;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.3s ease;
        }

        .close-button:hover {
          background: #f56565;
          color: white;
        }

        .no-print {
          display: flex;
        }

        @media print {
          body {
            margin: 0;
            padding: 15mm;
            font-size: 11px;
          }

          h1 { font-size: 20px; }
          h2 { font-size: 16px; }
          h3 { font-size: 12px; }
          p { font-size: 11px; }

          @page { margin: 20mm; size: A4; }

          .no-print {
            display: none !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="print-controls no-print">
        <button class="print-button" onclick="window.print()">${printLabel}</button>
        <button class="close-button" onclick="window.close()">${closeLabel}</button>
      </div>
      <div class="content">
        ${content}
      </div>
      <div style="font-size:10px;color:#9ca3af;margin-top:40px;">Generated on ${date}</div>
    </body>
    </html>
  `;
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.focus();
}