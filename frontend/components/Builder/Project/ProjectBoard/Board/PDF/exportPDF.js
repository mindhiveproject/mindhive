import absoluteUrl from "next-absolute-url";
import moment from "moment";
import { PROPOSAL_QUERY } from "../../../../../Queries/Proposal";

// Accept t as an optional third argument
export default async function exportPDF(proposalId, client, t) {
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

  const styles = {
    h1: "color: #171717; font-family: Nunito, sans-serif; font-size: 32px; font-weight: 600; line-height: 44px;",
    h2: "color: #171717; font-family: 'Nunito Sans', sans-serif; font-size: 24px; font-weight: 400; line-height: 28px;",
    h3: "color: #171717; font-family: 'Nunito Sans', sans-serif; font-size: 18px; font-weight: 400; line-height: 24px;"
  };

  const orderedSections = [...sections].sort((a, b) => a.position - b.position);
  const allCardsContent = orderedSections.map((section) => {
    const orderedCards = [...section.cards].sort((a, b) => a.position - b.position);
    const completedCardsWithTitles = orderedCards
      .filter(card => card?.settings?.status === "Completed" && card?.settings?.includeInReport)
      .map(card => `<h3 style="${styles.h3}">${card?.title}</h3>${card?.content}`);
    return `<h2 style="${styles.h2}">${section?.title}</h2>${completedCardsWithTitles.join("")}`;
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
  const printLabel = typeof t === 'function' ? t('printButton') : 'Print/Save as PDF';
  const closeLabel = typeof t === 'function' ? t('closeButton') : '✕ Close';
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title || 'Proposal'}</title>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&family=Nunito+Sans:wght@400;600;700&display=swap" rel="stylesheet">
      <style>
        body {
          font-family: 'Nunito Sans', sans-serif;
          color: #171717;
          background: white;
          padding: 20px;
        }
        .content h1 {
          font-size: 32px;
          font-weight: 600;
          margin: 30px 0 15px 0;
        }
        .content h2 {
          font-size: 24px;
          font-weight: 600;
          margin: 25px 0 12px 0;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 5px;
        }
        .content h3 {
          font-size: 18px;
          font-weight: 600;
          margin: 20px 0 8px 0;
        }
        .content p {
          margin-bottom: 12px;
          font-size: 12px;
        }
        .print-controls {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 1000;
          background: white;
          padding: 10px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .print-button {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-family: 'Nunito Sans', sans-serif;
          font-size: 14px;
          margin-right: 8px;
        }
        .print-button:hover {
          background: #2563eb;
        }
        .close-button {
          background: #6b7280;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-family: 'Nunito Sans', sans-serif;
          font-size: 14px;
        }
        .close-button:hover {
          background: #4b5563;
        }
        .no-print {
          display: block;
        }
        @media print {
          body {
            margin: 0;
            padding: 15mm;
            font-size: 11px;
          }
          .content h1 { font-size: 20px; }
          .content h2 { font-size: 16px; }
          .content h3 { font-size: 12px; }
          .content p { font-size: 11px; }
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