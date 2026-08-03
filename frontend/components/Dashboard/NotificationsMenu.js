import { useCallback, useRef, useState } from "react";
import { useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import { GET_MY_UPDATES, GET_MY_ARCHIVED_UPDATES } from "../Queries/Update";
import UpdateCard from "../Account/Updates/UpdateCard";
import UpdatesCount from "../Account/Updates/UpdatesCount";
import Button from "../DesignSystem/Button";
import PanelHeader from "../DesignSystem/PanelHeader";
import Popover from "../DesignSystem/Popover";
import { ArchiveIcon, NotificationsIcon } from "../DesignSystem/Icons";
import { StyledMenuIconButton } from "../styles/StyledMenuBar";

const BODY_STYLE = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  flex: 1,
  minHeight: 0,
  padding: "0 16px 16px",
  overflowY: "auto",
};

const EMPTY_STYLE = {
  margin: 0,
  fontFamily: "Inter, sans-serif",
  fontSize: 14,
  lineHeight: "20px",
  color: "var(--MH-Theme-Neutrals-Dark, #6A6A6A)",
};

/**
 * Bell button in the menu bar and the notifications flyout it opens.
 *
 * Shows the updates the home page used to carry in a strip, so they are
 * reachable from every dashboard page. Archived updates swap into the same
 * list rather than opening a modal, keeping one surface to dismiss.
 */
export default function NotificationsMenu({ user }) {
  const { t } = useTranslation("navigation");
  const { t: tHome } = useTranslation("home");

  const [open, setOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const bellRef = useRef(null);

  const { data, loading } = useQuery(GET_MY_UPDATES, {
    variables: { id: user?.id },
    // The bell's badge has its own lighter count query, so hold this one until
    // there is a panel to fill.
    skip: !open,
  });

  const { data: archivedData, loading: archivedLoading } = useQuery(
    GET_MY_ARCHIVED_UPDATES,
    {
      variables: { id: user?.id },
      skip: !open || !showArchived,
    },
  );

  const rows = (showArchived ? archivedData?.updates : data?.updates) || [];
  const rowsLoading = showArchived ? archivedLoading : loading;

  const close = useCallback(() => {
    setOpen(false);
    // Reopen on the current updates, which is what the bell counts.
    setShowArchived(false);
    bellRef.current?.focus();
  }, []);

  const label = t("notifications", {}, { default: "Notifications" });
  const emptyMessage = showArchived
    ? tHome("updates.archiveEmpty", {}, { default: "No archived updates." })
    : tHome(
        "updates.noUpdate",
        {},
        { default: "There are no updates at the moment." },
      );

  return (
    <>
      <StyledMenuIconButton
        ref={bellRef}
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-label={label}
        title={label}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <NotificationsIcon />
        <UpdatesCount user={user} />
      </StyledMenuIconButton>

      <Popover
        open={open}
        anchorRef={bellRef}
        onClose={close}
        ariaLabel={label}
      >
        <PanelHeader
          title={label}
          onClose={close}
          closeLabel={t(
            "closeNotifications",
            {},
            { default: "Close notifications" },
          )}
          actions={
            <Button
              // Filled when on, so the toggle reads as pressed against the
              // subtle close button beside it.
              variant={showArchived ? "filled" : "subtle"}
              leadingIcon={<ArchiveIcon />}
              aria-pressed={showArchived}
              onClick={() => setShowArchived((wasShown) => !wasShown)}
            >
              {t("archived", {}, { default: "Archived" })}
            </Button>
          }
        />

        <div className="notificationsBody" style={BODY_STYLE}>
          {!rowsLoading && rows.length === 0 ? (
            <p style={EMPTY_STYLE}>{emptyMessage}</p>
          ) : (
            rows.map((update) => (
              <UpdateCard
                key={update.id}
                user={user}
                update={update}
                hideArchiveButton={showArchived}
              />
            ))
          )}
        </div>
      </Popover>
    </>
  );
}
