// Strip HTML tags from text (shared across LinkedItems, PreviewSection, Resources)
export function stripHtml(html) {
  if (!html) return "";
  return String(html).replace(/<[^>]*>/g, "").trim();
}

// Design system typography (Figma Design System node 1-706 / StyledProposal alignment)
// Full set for LinkedItems; PreviewSection uses a subset (bodySemibold, label, labelSemibold).
export const TYPO = {
  fontFamily: "Inter, sans-serif",
  // Body — MH-Type/body/base, /label/large, /title/base
  body: { font: 'var(--MH-Type-Body-Base)', letterSpacing: 0 },
  bodyMedium: { font: 'var(--MH-Type-Label-Large)', letterSpacing: 0 },
  bodySemibold: { font: 'var(--MH-Type-Title-Base)', letterSpacing: 0 },
  // Body small / Label — MH-Type/label/base, /title/small
  label: { font: 'var(--MH-Type-Label-Base)', letterSpacing: 0 },
  labelSemibold: { font: 'var(--MH-Type-Title-Small)', letterSpacing: 0 },
  // Caption — MH-Type/body/small
  caption: { font: 'var(--MH-Type-Body-Base)', letterSpacing: 0 },
  // Titles — MH-Type/title/base, /title/large
  titleS: { font: 'var(--MH-Type-Title-Base)', letterSpacing: 0 },
  titleM: { font: 'var(--MH-Type-Title-Large)', letterSpacing: 0 },
  titleL: { font: 'var(--MH-Type-Heading-Small)', letterSpacing: 0 },
  // Section label (e.g. modal section headings) — MH-Type/heading/small
  sectionLabel: { font: 'var(--MH-Type-Heading-Small)', letterSpacing: 0, color: "#274E5B" },
};
