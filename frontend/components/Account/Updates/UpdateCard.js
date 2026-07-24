import { useMutation } from "@apollo/client";
import moment from "moment";
import ReactHtmlParser from "react-html-parser";
import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";

import { OPEN_UPDATE, ARCHIVE_UPDATE } from "../../Mutations/Update";
import {
  GET_MY_UPDATES,
  GET_MY_ARCHIVED_UPDATES,
  COUNT_NEW_UPDATES,
} from "../../Queries/Update";
import Button from "../../DesignSystem/Button";
import IconButton from "../../DesignSystem/IconButton";

const Row = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  min-width: min(480px, 100%);
  max-width: 560px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #ffffff;
  border: 1px solid #d3dae0;
  box-sizing: border-box;
  opacity: ${({ $unread }) => ($unread ? 1 : 0.78)};
  box-shadow: ${({ $unread }) =>
    $unread ? "inset 3px 0 0 0 var(--MH-Theme-Primary-Base, #337C84)" : "none"};

  .body {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
    min-width: 0;
  }

  .titleRow {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .unreadDot {
    flex: none;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--MH-Theme-Primary-Base, #337C84);
  }

  .title {
    font-family: "Lato", sans-serif;
    font-weight: 600;
    font-size: 14px;
    line-height: 20px;
    color: #171717;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .message {
    font-family: "Lato", sans-serif;
    font-weight: 400;
    font-size: 13px;
    line-height: 18px;
    color: #5f6871;
  }

  .time {
    font-family: "Lato", sans-serif;
    font-size: 12px;
    line-height: 16px;
    color: #969696;
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 4px;
    flex: none;
    padding-top: 2px;
  }

  @media (max-width: 640px) {
    flex-wrap: wrap;
    min-width: 0;

    .actions {
      width: 100%;
      justify-content: flex-end;
    }
  }
`;

const CLOSE_ICON = (
  <img src="/assets/icons/close.svg" alt="" width={16} height={16} />
);

export default function UpdateCard({
  user,
  update,
  hideArchiveButton = false,
}) {
  const { t } = useTranslation("home");
  const unread = update?.hasOpen === false;

  const refetchQueries = [
    {
      query: GET_MY_UPDATES,
      variables: { id: user?.id },
    },
    {
      query: GET_MY_ARCHIVED_UPDATES,
      variables: { id: user?.id },
    },
    { query: COUNT_NEW_UPDATES, variables: { id: user?.id } },
  ];

  const [openUpdate, { loading: loadingOpen }] = useMutation(OPEN_UPDATE, {
    variables: { id: update?.id },
    refetchQueries,
  });

  const [archiveUpdate, { loading: loadingArchive }] = useMutation(
    ARCHIVE_UPDATE,
    {
      variables: { id: update?.id },
      refetchQueries,
    }
  );

  const openLabel =
    update?.content?.linkTitle ||
    t("updates.open", {}, { default: "Open" });

  const handleOpen = () => {
    openUpdate();
    if (update?.link) {
      window.open(update.link, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Row $unread={unread}>
      <div className="body">
        <div className="titleRow">
          {unread ? <span className="unreadDot" aria-hidden /> : null}
          <div className="title">
            {ReactHtmlParser(update?.content?.title)}
          </div>
        </div>
        {update?.content?.message ? (
          <div className="message">
            {ReactHtmlParser(update.content.message)}
          </div>
        ) : null}
        {update?.createdAt ? (
          <div className="time">{moment(update.createdAt).fromNow()}</div>
        ) : null}
      </div>
      <div className="actions">
        {update?.link ? (
          <Button
            variant="outline"
            disabled={loadingOpen}
            onClick={handleOpen}
            style={{ height: 32, paddingLeft: 12, paddingRight: 12 }}
          >
            {ReactHtmlParser(openLabel)}
          </Button>
        ) : null}
        {!hideArchiveButton ? (
          <IconButton
            variant="text"
            icon={CLOSE_ICON}
            disabled={loadingArchive}
            ariaLabel={t("updates.archiveAria", {}, {
              default: "Archive update",
            })}
            onClick={() => archiveUpdate()}
            style={{ width: 32, height: 32 }}
          />
        ) : null}
      </div>
    </Row>
  );
}
