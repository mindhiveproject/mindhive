import { useMemo } from "react";
import useTranslation from "next-translate/useTranslation";

import TipTapEditor from "../../../../../../../TipTap/Main";
import { StyledTipTap } from "../../../../../../../TipTap/StyledTipTap";
import { useDataJournal } from "../../../../Context/DataJournalContext";

const TITLE_TYPO = {
  fontFamily: "Inter, sans-serif",
  fontWeight: 500,
  fontSize: "18px",
  lineHeight: "150%",
  color: "#000000",
};

const EMPTY_DOC = "<p></p>";

export default function ParagraphEditor({ content, onChange, sectionId }) {
  const { t } = useTranslation("builder");
  const { projectId } = useDataJournal();

  const mediaLibrarySource = useMemo(
    () =>
      projectId
        ? {
            sourceType: "proposalBoard",
            sourceId: projectId,
            createdWith: "data_journal_paragraph",
          }
        : {
            sourceType: "vizSection",
            sourceId: sectionId,
            createdWith: "data_journal_paragraph",
          },
    [projectId, sectionId],
  );

  const rawText = content?.text;
  const tiptapContent =
    typeof rawText === "string" && rawText.trim() ? rawText : EMPTY_DOC;

  return (
    <StyledTipTap
      style={{
        boxSizing: "border-box",
        maxWidth: "100%",
        minWidth: 0,
      }}
    >
      <h3 style={{ marginTop: 0, margin: "0.5rem 0 1rem 0", ...TITLE_TYPO }}>
        {t("dataJournal.componentEditor.editParagraph", {}, { default: "Edit Paragraph" })}
      </h3>
      <TipTapEditor
        content={tiptapContent}
        toolbarAlign="left"
        limitedToolbar={true}
        onUpdate={(html) =>
          onChange({
            componentId: sectionId,
            newContent: { text: html },
          })
        }
        mediaLibraryId={projectId || null}
        mediaLibrarySource={mediaLibrarySource}
        usedInVizSectionIds={[sectionId]}
        emptyInvite={t(
          "dataJournal.paragraphEditor.emptyInvite",
          {},
          {
            default:
              "Click here to start writing.",
          },
        )}
      />
    </StyledTipTap>
  );
}
