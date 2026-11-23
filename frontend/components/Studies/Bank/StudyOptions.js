import { useCallback, useEffect, useRef, useState } from "react";
import { Dropdown } from "semantic-ui-react";
import useTranslation from "next-translate/useTranslation";

import Authorship from "./Options/Authorship";
import Archive from "./Options/Archive";
import Delete from "./Options/Delete";
import { LinkedBoardClass, LinkedClass } from "./Options/Links";
import LinksSummaryRow from "../../Builder/shared/StudyBoardLinks/SummaryRow";
import StudyBoardLinksModal from "../../Builder/shared/StudyBoardLinks/Modal";
import Button from "../../DesignSystem/Button";
import IconButton from "../../DesignSystem/IconButton";
import PanelHeader from "../../DesignSystem/PanelHeader";
import Popover from "../../DesignSystem/Popover";
import { SettingsIcon, TrashIcon, ArrowOutwardIcon, ArchiveIcon } from "../../DesignSystem/Icons";

const BODY_STYLE = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  padding: "0 16px 16px",
  overflowY: "auto",
};

export default function StudyOptions({
  user,
  study,
  project,
  studiesInfo,
  // "study": the board's linked study (project board tab);
  // "class": the study's linked class (study tabs); null: neither.
  linkSection = null,
  // Builder only: the URL area ("projects" | "studies") and unsaved edits,
  // for the project board section's switch (it reloads the builder).
  area,
  hasStudyChanged = false,
  // Builder: open Settings on the class row in edit mode (the study's
  // "Connect to class" prompt); `onClassEditHandled` runs when it closes.
  classEditRequest = false,
  onClassEditHandled,
  variant = "dropdown",
}) {
  const { t } = useTranslation("common");
  const { t: tBuilder } = useTranslation("builder");
  const [open, setOpen] = useState(false);
  // The Links panel ({ boardId } or { studyId }), opened from a Settings row.
  // Rendered outside the popover so closing the popover keeps it open.
  const [links, setLinks] = useState(null);
  const openLinks = (context) => {
    setOpen(false);
    setLinks(context);
  };
  const settingsRef = useRef(null);

  useEffect(() => {
    if (classEditRequest) setOpen(true);
  }, [classEditRequest]);

  const close = useCallback(() => {
    setOpen(false);
    onClassEditHandled?.();
    settingsRef.current?.querySelector("button")?.focus();
  }, [onClassEditHandled]);

  const settingsLabel = tBuilder("navigation.settings", {}, {
    default: "Settings",
  });

  if (variant === "popover") {
    return (
      <>
        <div ref={settingsRef}>
          <IconButton
            variant="subtle"
            elevated={false}
            ariaLabel={settingsLabel}
            title={settingsLabel}
            icon={<SettingsIcon style={{ width: "20px", height: "20px"}} />}
            aria-expanded={open}
            aria-haspopup="dialog"
            onClick={() => (open ? close() : setOpen(true))}
          />
        </div>
        <Popover
          open={open}
          anchorRef={settingsRef}
          onClose={close}
          side="bottom"
          align="end"
          width={360}
          ariaLabel={settingsLabel}
        >
          <PanelHeader
            title={settingsLabel}
            onClose={close}
            closeLabel={tBuilder("connectModal.close", {}, { default: "Close" })}
          />
          <div style={BODY_STYLE}>
            {linkSection === "study" && project?.id && (
              <>
                <LinksSummaryRow
                  boardId={project.id}
                  onManage={() => openLinks({ boardId: project.id })}
                />
                <LinkedBoardClass user={user} project={project} />
                <hr style={{ border: 0, borderTop: "1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6)", margin: "4px 0", width: "100%" }} />
              </>
            )}
            {study?.id && (
              <>
                {linkSection === "class" && (
                  <>
                    <LinkedClass study={study} autoEdit={classEditRequest} />
                    <LinksSummaryRow
                      boardId={area === "projects" ? project?.id : undefined}
                      studyId={study.id}
                      onManage={() =>
                        openLinks(
                          area === "projects" && project?.id
                            ? { boardId: project.id }
                            : { studyId: study.id }
                        )
                      }
                    />
                    <hr style={{ border: 0, borderTop: "1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6)", margin: "4px 0", width: "100%" }} />
                  </>
                )}
                <Authorship
                  user={user}
                  study={study}
                  trigger={
                    <Button variant="subtle" leadingIcon={<ArrowOutwardIcon style={{ width: "20px", height: "20px"}} />}>
                      {t("study.transferAuthorship", {}, {
                        default: "Transfer the authorship",
                      })}
                    </Button>
                  }
                />
                <Archive
                  user={user}
                  study={study}
                  studiesInfo={studiesInfo}
                  trigger={
                    <Button variant="subtle" leadingIcon={<ArchiveIcon style={{ width: "20px", height: "20px"}} />}>
                      {studiesInfo && studiesInfo[study?.id]?.hideInDevelop
                        ? t("study.unarchive", {}, { default: "Unarchive study" })
                        : t("study.archive", {}, { default: "Archive Study" })}
                    </Button>
                  }
                />
                <Delete
                  user={user}
                  study={study}
                  trigger={
                    <Button variant="subtle" style={{ background:"var(--MH-Theme-Danger-Light)", color: "var(--MH-Theme-Danger-Dark)"}} leadingIcon={<TrashIcon style={{ color: "var(--MH-Theme-Danger-Dark)", width: "20px", height: "20px"}} />}>
                      {t("study.delete", {}, { default: "Delete Study" })}
                    </Button>
                  }
                />
              </>
            )}
          </div>
        </Popover>
        <StudyBoardLinksModal
          open={!!links}
          onClose={() => setLinks(null)}
          user={user}
          boardId={links?.boardId}
          studyId={links?.studyId}
          hasUnsavedChanges={hasStudyChanged}
          // The builder shows the board's study: reload on the new one.
          onContextBoardChanged={() => window.location.reload()}
        />
      </>
    );
  }

  return (
    <div className="optionsIcon">
      <Dropdown
        className="archiveDeleteIcon"
        direction="left"
        upward={false}
        icon={null}
        trigger={<img src="/assets/icons/settings.svg" alt="" />}
        scrolling
      >
        <Dropdown.Menu className="archiveDropdown">
          <Authorship user={user} study={study} />
          <Archive user={user} study={study} studiesInfo={studiesInfo} />
          <Delete user={user} study={study} />
        </Dropdown.Menu>
      </Dropdown>
    </div>
  );
}
