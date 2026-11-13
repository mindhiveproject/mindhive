import { useId, useState } from "react";
import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";

import Button from "../../../DesignSystem/Button";
import { ArrowDropDownIcon } from "../../../DesignSystem/Icons";
import { formatDateTime } from "./labels";

// A filled panel (no outline), like the Versions card's info panel; entries
// are separated by a hairline.
const StyledHistory = styled.div`
  display: grid;
  gap: 8px;
  justify-items: start;

  .historyToggleIcon {
    display: inline-flex;
    transition: transform 0.15s ease;
  }

  .historyToggleIcon--open {
    transform: rotate(180deg);
  }

  .historyPanel {
    justify-self: stretch;
    margin: 0;
    padding: 4px 12px;
    list-style: none;
    background: var(--MH-Theme-Neutrals-Lighter, #f3f3f3);
    border-radius: 8px;
  }

  .historyEntry {
    display: grid;
    gap: 2px;
    padding: 8px 0;
  }

  .historyEntry + .historyEntry {
    border-top: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
  }

  .historyWhat {
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }

  .historyWhen {
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  }
`;

function describe(t, entry) {
  const name =
    entry.by || t("dataCollection.history.someone", {}, { default: "Someone" });
  switch (entry.action) {
    case "SUBMIT":
      if (entry.carriedOver) {
        return t("dataCollection.history.carriedOver", { name }, {
          default:
            "{{name}} turned on the class milestone: the study's Collecting data label was carried over as submitted",
        });
      }
      return t("dataCollection.history.submitted", { name }, {
        default: "{{name}} submitted the study for data collection",
      });
    case "FINISH":
      if (entry.carriedOver) {
        return t("dataCollection.history.carriedOverFinished", { name }, {
          default:
            "{{name}} turned on the class milestone: the study's Finished label was carried over",
        });
      }
      return t("dataCollection.history.finished", { name }, {
        default: "{{name}} marked data collection as finished",
      });
    case "REOPEN":
      return t("dataCollection.history.reopened", { name }, {
        default: "{{name}} reopened the study for editing",
      });
    case "RESUME":
      return t("dataCollection.history.resumed", { name }, {
        default: "{{name}} resumed data collection",
      });
    case "SET_PARTICIPATION":
      return entry.open
        ? t("dataCollection.history.opened", { name }, {
            default: "{{name}} opened participation",
          })
        : t("dataCollection.history.closed", { name }, {
            default: "{{name}} closed participation",
          });
    case "SET_LABEL":
      return t("dataCollection.history.label", { name }, {
        default: "{{name}} changed the status",
      });
    default:
      return name;
  }
}

/**
 * Who submitted, finished, reopened or opened/closed participation of a
 * study, and when (newest first), from the logs setStudyDataCollection
 * writes. Collapsed behind a "See activity" button; `limit` caps the entries.
 */
export default function DataCollectionHistory({ history, limit = 10 }) {
  const { t } = useTranslation("builder");
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const entries = (history || []).slice(0, limit);
  if (!entries.length) return null;

  return (
    <StyledHistory>
      <Button
        variant="text"
        trailingIcon={
          <span
            className={`historyToggleIcon${open ? " historyToggleIcon--open" : ""}`}
          >
            <ArrowDropDownIcon />
          </span>
        }
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
      >
        {open
          ? t("dataCollection.history.hide", {}, { default: "Hide activity" })
          : t("dataCollection.history.see", { count: entries.length }, {
              default: "See activity ({{count}})",
            })}
      </Button>
      {open ? (
        <ol className="historyPanel" id={panelId}>
          {entries.map((entry, index) => (
            <li
              className="historyEntry"
              key={`${entry.action}-${entry.at}-${index}`}
            >
              <span className="MH-Type-Body-Small historyWhat">
                {describe(t, entry)}
                {entry.confirmed && entry.sharedWith?.length
                  ? ` ${t("dataCollection.history.withAgreement", {
                      people: entry.sharedWith.join(", "),
                    }, {
                      default: "(confirmed agreement with {{people}})",
                    })}`
                  : ""}
              </span>
              <span className="MH-Type-Label-Small historyWhen">
                {formatDateTime(entry.at)}
              </span>
            </li>
          ))}
        </ol>
      ) : null}
    </StyledHistory>
  );
}
