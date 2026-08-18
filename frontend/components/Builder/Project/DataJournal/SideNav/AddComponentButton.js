import useTranslation from "next-translate/useTranslation";
import Button from "../../../../DesignSystem/Button";

export default function AddComponentButton({ disabled = false, onClick }) {
  const { t } = useTranslation("builder");

  const label = t(
    "dataJournal.sideNav.addComponent",
    {},
    { default: "Component" },
  );
  const ariaLabel = t(
    "dataJournal.sideNav.addComponentAria",
    {},
    { default: "Add a component to this workspace" },
  );

  return (
    <div className="addComponentBtn">
      <Button
        variant="subtle"
        leadingIcon={<img src="/assets/icons/plus.svg" alt="Add Component" />}
        type="button"
        aria-label={ariaLabel}
        onClick={onClick}
        disabled={disabled}
      >
        {label}
      </Button>
    </div>
  );
}
