import useTranslation from "next-translate/useTranslation";

import Button from "../../../DesignSystem/Button";
import Chip from "../../../DesignSystem/Chip";
import { getUserRoleOnClassItem } from "./ownedClassItems";

/**
 * Featured list of class studies/projects the current user owns
 * (author or collaborator), shown above the full AG Grid.
 */
export default function OwnedItemsShowcase({
  items = [],
  userId,
  title,
  description,
  getHref,
  actionLabel,
}) {
  const { t } = useTranslation("classes");

  if (!items?.length || !userId) return null;

  return (
    <div className="classTabOwnedShowcase">
      <div className="classTabSubsection">
        <h4 className="classTabSubsectionTitle">{title}</h4>
        {description ? (
          <p className="classTabSubsectionDescription">{description}</p>
        ) : null}
      </div>
      <div className="classTabTemplateList">
        {items.map((item) => {
          const role = getUserRoleOnClassItem(item, userId);
          const href = getHref?.(item);
          const chipLabel =
            role === "author"
              ? t("ownedItems.author", {}, { default: "Author" })
              : t("ownedItems.collaborator", {}, {
                  default: "Collaborator",
                });

          return (
            <div
              key={item.id}
              className="classTabTemplateCard classTabTemplateCardActive"
            >
              <div className="classTabTemplateCardRow">
                <div className="classTabTemplateCardTitleGroup">
                  <p className="classTabTemplateCardTitle">
                    {item?.title ||
                      t("ownedItems.untitled", {}, { default: "Untitled" })}
                  </p>
                  <Chip selected label={chipLabel} />
                </div>
                {href ? (
                  <div className="classTabTemplateCardActions">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() =>
                        window.open(href, "_blank", "noopener,noreferrer")
                      }
                    >
                      {actionLabel}
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
