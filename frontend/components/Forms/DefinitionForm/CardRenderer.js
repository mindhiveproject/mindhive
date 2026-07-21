// Renders one FormCard. Handles role and entity-status gating. The
// special card types (members_panel, interest_selector) are rendered
// by parent-supplied components — they have too much custom UI to live
// in the field registry, but their position in the card order is still
// admin-controlled.
import { Card } from "./styles";
import { cardTitle, cardDescription } from "./i18n";
import { getFieldComponent } from "./fields";
import { isCardVisible, rolesIntersect } from "./visibility";

export default function CardRenderer({
  card,
  locale,
  viewerRoles,
  entityStatus,
  values,
  errors,
  onFieldChange,
  disabled,
  specialCardComponents,
}) {
  if (!isCardVisible(card, { viewerRoles, entityStatus })) return null;

  if (card.cardType !== "fields") {
    const SpecialComponent = specialCardComponents?.[card.cardType];
    if (!SpecialComponent) {
      // Unknown special type: render nothing rather than crash.
      return null;
    }
    return (
      <Card>
        {cardTitle(card, locale) ? <h2>{cardTitle(card, locale)}</h2> : null}
        {cardDescription(card, locale) ? (
          <p className="card-description">{cardDescription(card, locale)}</p>
        ) : null}
        <SpecialComponent card={card} locale={locale} disabled={disabled} />
      </Card>
    );
  }

  const title = cardTitle(card, locale);
  const desc = cardDescription(card, locale);
  const fields = (card.fields || [])
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .filter((f) => rolesIntersect(f.visibilityRoles, viewerRoles));

  if (fields.length === 0) return null;

  return (
    <Card>
      {title ? <h2>{title}</h2> : null}
      {desc ? <p className="card-description">{desc}</p> : null}
      {fields.map((field) => {
        const Component = getFieldComponent(field.fieldType);
        return (
          <Component
            key={field.id}
            field={field}
            value={values[field.name]}
            onChange={(v) => onFieldChange(field.name, v)}
            error={errors[field.name]}
            locale={locale}
            disabled={disabled}
          />
        );
      })}
    </Card>
  );
}
