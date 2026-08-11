// Quiet review card — same surface as DefinitionForm Card in readOnly mode.
import { Card } from "./styles";

/**
 * @param {string} [title] - Optional card heading (rendered as h2).
 * @param {string} [description] - Optional supporting text under the title.
 * @param {React.ReactNode} children - Review fields / content.
 * @param {string} [className]
 */
export default function ReviewCard({
  title,
  description,
  children,
  className,
}) {
  if (!children) return null;
  return (
    <Card $quiet className={className}>
      {title ? <h2>{title}</h2> : null}
      {description ? <p className="card-description">{description}</p> : null}
      {children}
    </Card>
  );
}
