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
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 1000;
          background: white;
          // padding: 10px;
          // border: 1px solid #d1d5db;
          // border-radius: 6px;
          // box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .print-button {
          width: auto;
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
          display: block;
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