"use client";

import Link from "next/link";
import useTranslation from "next-translate/useTranslation";

import Button from "../../DesignSystem/Button";
import IconButton from "../../DesignSystem/IconButton";
import { ChevronLeftIcon } from "../../DesignSystem/Icons";

const ROOT_STYLE = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexShrink: 0,
  padding: "8px 10px 8px 8px",
  minHeight: 68,
  boxSizing: "border-box",
  background: "var(--MH-Theme-Neutrals-White, #FFFFFF)",
};

const NAME_BLOCK_STYLE = {
  display: "flex",
  flexDirection: "column",
  minWidth: 0,
  flex: "1 1 auto",
};

// MH-Theme/body/base — the eyebrow says what kind of thing this is, which is
// what makes the name below it unambiguous when a visual is opened from a study.
const EYEBROW_STYLE = {
  margin: 0,
  font: "var(--MH-Type-Body-Base)",
  color: "var(--MH-Theme-Neutrals-Dark, #6A6A6A)",
};

// MH-Theme/title/large
const NAME_STYLE = {
  margin: 0,
  font: "var(--MH-Type-Title-Large)",
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

/**
 * The builder's top bar: back out of the editor, what you're editing, and the
 * actions that apply to the visual as a whole.
 */
export default function TopBar({ title, onShare }) {
  const { t } = useTranslation("visuals");

  return (
    <div className="Visuals-TopBar" style={ROOT_STYLE}>
      <Link href="/dashboard/develop/visuals" aria-label={t("back", "Back to visuals")}>
        <IconButton
          variant="text"
          icon={<ChevronLeftIcon />}
          ariaLabel={t("back", "Back to visuals")}
        />
      </Link>
      <div style={NAME_BLOCK_STYLE}>
        <p style={EYEBROW_STYLE}>{t("visualBlock", "Visual Block")}</p>
        <h1 style={NAME_STYLE}>{title}</h1>
      </div>
      <Button variant="filled" onClick={onShare}>
        {t("share", "Share")}
      </Button>
    </div>
  );
}
