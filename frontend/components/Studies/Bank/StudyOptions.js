import { useCallback, useRef, useState } from "react";
import { Dropdown } from "semantic-ui-react";
import useTranslation from "next-translate/useTranslation";

import Authorship from "./Options/Authorship";
import Archive from "./Options/Archive";
import Delete from "./Options/Delete";
import StudyDropdown from "../../Projects/StudyConnector/StudyDropdown";
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
  variant = "dropdown",
}) {
  const { t } = useTranslation("common");
  const { t: tBuilder } = useTranslation("builder");
  const [open, setOpen] = useState(false);
  const settingsRef = useRef(null);

  const close = useCallback(() => {
    setOpen(false);
    settingsRef.current?.querySelector("button")?.focus();
  }, []);

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
            {study?.id && (
              <>
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
            {project?.id && (
              <StudyDropdown user={user} project={project} />
            )}
          </div>
        </Popover>
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
