// Renders one FormCard. Handles role and entity-status gating. The
// special card types (members_panel, interest_selector) are rendered
// by parent-supplied components — they have too much custom UI to live
// in the field registry, but their position in the card order is still
// admin-controlled.
import { Card } from "./styles";
import { cardTitle, cardDescription } from "./i18n";
import { getFieldComponent } from "./fields";
import {
  hasRenderableFieldValue,
  isCardVisible,
  rolesIntersect,
} from "./visibility";

/** Simple field types that support 1/3–2/3 inline review layout. */
const INLINE_REVIEW_FIELD_TYPES = new Set([
  "text",
  "textarea",
  "number",
  "date",
  "checkbox",
  "select",
  "multiselect",
]);

export default function CardRenderer({
  card,
  locale,
  viewerRoles,
  entityStatus,
  values,
  errors,
  onFieldChange,
  disabled,
  readOnly = false,
  specialCardComponents,
  hideUnansweredFields = false,
  readOnlyLayout = null,
  quiet = false,
}) {
  if (!isCardVisible(card, { viewerRoles, entityStatus })) return null;

  if (card.cardType !== "fields") {
    // Review mode: skip editor-only special chrome (members panels, etc.).
    if (hideUnansweredFields) return null;
    const SpecialComponent = specialCardComponents?.[card.cardType];
    if (!SpecialComponent) {
      // Unknown special type: render nothing rather than crash.
      return null;
    }
    return (
      <Card $quiet={quiet}>
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
    .filter((f) => rolesIntersect(f.visibilityRoles, viewerRoles))
    .filter((f) => {
      if (!hideUnansweredFields) return true;
      if (f.fieldType === "read_only_html") return false;
      return hasRenderableFieldValue(values?.[f.name], f.fieldType);
    });

  if (fields.length === 0) return null;

  return (
    <Card $quiet={quiet}>
      {title ? <h2>{title}</h2> : null}
      {desc ? <p className="card-description">{desc}</p> : null}
      {fields.map((field) => {
        const Component = getFieldComponent(field.fieldType);
        const readOnlyInline =
          Boolean(disabled) &&
          readOnlyLayout === "inline" &&
          INLINE_REVIEW_FIELD_TYPES.has(field.fieldType);
        return (
          <Component
            key={field.id}
            field={field}
            value={values[field.name]}
            onChange={(v) => onFieldChange(field.name, v)}
            error={errors[field.name]}
            locale={locale}
            disabled={disabled}
            readOnly={readOnly}
            readOnlyInline={readOnlyInline}
          />
        );
      })}
    </Card>
  );
}
