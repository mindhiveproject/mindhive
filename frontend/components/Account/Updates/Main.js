import { useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { Modal } from "semantic-ui-react";
import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";

import {
  GET_MY_UPDATES,
  GET_MY_ARCHIVED_UPDATES,
} from "../../Queries/Update";
import Button from "../../DesignSystem/Button";
import Chip from "../../DesignSystem/Chip";
import UpdateCard from "./UpdateCard";

const Strip = styled.div`
  display: inline-flex;
  flex-direction: column;
  gap: ${({ $collapsed }) => ($collapsed ? "0" : "10px")};
  width: fit-content;
  max-width: 100%;
  justify-self: start;
  padding: 14px 16px;
  margin-bottom: 24px;
  border-radius: 12px;
  background: ${({ $collapsed }) =>
    $collapsed
      ? "linear-gradient(135deg, #f7f8f9 0%, #f3f5f6 100%)"
      : "linear-gradient(135deg, #f7f9f8 0%, #eef5f9 100%)"};
  border: 1px solid ${({ $collapsed }) => ($collapsed ? "#e6eaee" : "#d3dae0")};
  opacity: ${({ $collapsed }) => ($collapsed ? 0.72 : 1)};
  transition: opacity 0.15s ease, border-color 0.15s ease, background 0.15s ease;

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-height: 32px;
  }

  .headerMeta {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: none;
  }

  h2 {
    margin: 0;
    font-family: "Lato", sans-serif;
    font-size: 16px;
    font-weight: ${({ $collapsed }) => ($collapsed ? 500 : 600)};
    color: ${({ $collapsed }) => ($collapsed ? "#5f6871" : "#171717")};
  }

  .headerChip {
    opacity: ${({ $collapsed }) => ($collapsed ? 0.85 : 1)};
  }

  .headerAction {
    display: flex;
    align-items: center;
    gap: 4px;
    opacity: ${({ $collapsed }) => ($collapsed ? 0.85 : 1)};

    button {
      color: ${({ $collapsed }) =>
        $collapsed ? "#5f6871" : "var(--MH-Theme-Primary-Base, #337C84)"};
    }
  }

  .rows {
    display: ${({ $collapsed }) => ($collapsed ? "none" : "flex")};
    flex-direction: column;
    gap: 6px;
    width: max-content;
    max-width: 100%;
  }

  .empty {
    display: ${({ $collapsed }) => ($collapsed ? "none" : "block")};
    margin: 0;
    font-family: "Lato", sans-serif;
    font-size: 14px;
    line-height: 20px;
    color: #5f6871;
  }
`;

const ArchiveModalBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: min(60vh, 480px);
  overflow-y: auto;
  padding-right: 4px;

  .empty {
    margin: 0;
    font-family: "Lato", sans-serif;
    font-size: 14px;
    line-height: 20px;
    color: #5f6871;
  }

  /* Rows in modal can use full modal width */
  > div {
    min-width: 0;
    max-width: 100%;
  }
`;

export default function MyUpdates({ user }) {
  const { t } = useTranslation("home");
  const [archiveOpen, setArchiveOpen] = useState(false);

  const { data, loading } = useQuery(GET_MY_UPDATES, {
    variables: {
      id: user?.id,
    },
  });

  const { data: archivedData, loading: archivedLoading } = useQuery(
    GET_MY_ARCHIVED_UPDATES,
    {
      variables: { id: user?.id },
      skip: !archiveOpen,
    }
  );

  const updates = data?.updates || [];
  const archivedUpdates = archivedData?.updates || [];
  const unreadCount = useMemo(
    () => updates.filter((update) => update?.hasOpen === false).length,
    [updates]
  );

  // undefined = user has not toggled yet; derive from data
  const [userCollapsed, setUserCollapsed] = useState(undefined);
  const defaultCollapsed = !loading && updates.length > 0 && unreadCount === 0;
  const collapsed = userCollapsed ?? defaultCollapsed;

  return (
    <>
      <Strip $collapsed={collapsed}>
        <div className="header">
          <h2>
            {t("updates.latestUpdates", {}, { default: "Latest updates" })}
          </h2>
          <div className="headerMeta">
            {collapsed && unreadCount > 0 ? (
              <div className="headerChip">
                <Chip
                  label={t(
                    "updates.unreadCount",
                    { count: unreadCount },
                    { default: "{{count}} unread" }
                  )}
                  style={{
                    borderColor: "#d3dae0",
                    color: "#5f6871",
                    background: "#f7f8f9",
                    backgroundColor: "#f7f8f9",
                  }}
                />
              </div>
            ) : null}
            <div className="headerAction">
              <Button
                variant="text"
                onClick={() => setArchiveOpen(true)}
                style={{ height: 32, paddingLeft: 12, paddingRight: 12 }}
              >
                {t("updates.archive", {}, { default: "Archive" })}
              </Button>
              <Button
                variant="text"
                onClick={() => setUserCollapsed(!collapsed)}
                style={{ height: 32, paddingLeft: 12, paddingRight: 12 }}
              >
                {collapsed
                  ? t("updates.show", {}, { default: "Show" })
                  : t("updates.dismiss", {}, { default: "Dismiss" })}
              </Button>
            </div>
          </div>
        </div>

        {!loading && updates.length === 0 ? (
          <p className="empty">
            {t("updates.noUpdate", {}, {
              default: "There are no updates at the moment.",
            })}
          </p>
        ) : (
          <div className="rows">
            {updates.map((update) => (
              <UpdateCard key={update.id} user={user} update={update} />
            ))}
          </div>
        )}
      </Strip>

      <Modal
        open={archiveOpen}
        onClose={() => setArchiveOpen(false)}
        size="small"
      >
        <Modal.Header>
          {t("updates.archiveModalTitle", {}, {
            default: "Archived updates",
          })}
        </Modal.Header>
        <Modal.Content scrolling>
          <ArchiveModalBody>
            {archivedLoading ? null : archivedUpdates.length === 0 ? (
              <p className="empty">
                {t("updates.archiveEmpty", {}, {
                  default: "No archived updates.",
                })}
              </p>
            ) : (
              archivedUpdates.map((update) => (
                <UpdateCard
                  key={update.id}
                  user={user}
                  update={update}
                  hideArchiveButton
                />
              ))
            )}
          </ArchiveModalBody>
        </Modal.Content>
      </Modal>
    </>
  );
}
