// Strip HTML tags from text (shared across LinkedItems, PreviewSection, Resources)
export function stripHtml(html) {
  if (!html) return "";
  return String(html).replace(/<[^>]*>/g, "").trim();
}

// Design system typography (Figma Design System node 1-706 / StyledProposal alignment)
// Full set for LinkedItems; PreviewSection uses a subset (bodySemibold, label, labelSemibold).
export const TYPO = {
  fontFamily: "Inter, sans-serif",
  // Body
  body: { fontFamily: "Inter, sans-serif", fontSize: "16px", lineHeight: "24px", fontWeight: 400 },
  bodyMedium: { fontFamily: "Inter, sans-serif", fontSize: "16px", lineHeight: "24px", fontWeight: 500 },
  bodySemibold: { fontFamily: "Inter, sans-serif", fontSize: "16px", lineHeight: "24px", fontWeight: 600 },
  // Body small / Label
  label: { fontFamily: "Inter, sans-serif", fontSize: "14px", lineHeight: "20px", fontWeight: 400 },
  labelSemibold: { fontFamily: "Inter, sans-serif", fontSize: "14px", lineHeight: "20px", fontWeight: 600 },
  // Caption
  caption: { fontFamily: "Inter, sans-serif", fontSize: "12px", lineHeight: "16px", fontWeight: 400 },
  // Titles
  titleS: { fontFamily: "Inter, sans-serif", fontSize: "18px", lineHeight: "24px", fontWeight: 600 },
  titleM: { fontFamily: "Inter, sans-serif", fontSize: "22px", lineHeight: "28px", fontWeight: 600 },
  titleL: { fontFamily: "Inter, sans-serif", fontSize: "24px", lineHeight: "32px", fontWeight: 600 },
  // Section label (e.g. modal section headings)
  sectionLabel: { fontFamily: "Inter, sans-serif", fontSize: "24px", lineHeight: "32px", fontWeight: 600, color: "#274E5B" },
};
