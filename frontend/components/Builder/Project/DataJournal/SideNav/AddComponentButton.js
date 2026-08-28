import { useCallback, useRef, useState } from "react";
import useTranslation from "next-translate/useTranslation";

import Button from "../../../../DesignSystem/Button";
import Popover from "../../../../DesignSystem/Popover";
import { useDataJournal } from "../Context/DataJournalContext";
import useAddJournalComponent from "../Helpers/useAddJournalComponent";
import ComponentPanel from "../Workspace/Grid/ComponentPanel/Main";

export default function AddComponentButton({
  disabled = false,
  side = "right",
  align = "start",
}) {
  const { t } = useTranslation("builder");
  const { t: tViz } = useTranslation("dataviz");
  const { setActiveComponent } = useDataJournal();
  const handleAddComponent = useAddJournalComponent();
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);

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
  const panelLabel = tViz(
    "dataJournal.components.title",
    {},
    { default: "Component Panel" },
  );

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  const toggle = () => {
    if (disabled) return;
    if (open) {
      close();
      return;
    }
    setActiveComponent(null);
    setOpen(true);
  };

  const onAdd = async (payload) => {
    const created = await handleAddComponent(payload);
    if (created) close();
  };

  return (
    <div className="addComponentBtn" ref={anchorRef}>
      <Button
        variant="subtle"
        leadingIcon={<img src="/assets/icons/plus.svg" alt="" />}
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={toggle}
        disabled={disabled}
      >
        {label}
      </Button>
      <Popover
        open={open}
        anchorRef={anchorRef}
        onClose={close}
        side={side}
        align={align}
        ariaLabel={panelLabel}
      >
        <ComponentPanel handleAddComponent={onAdd} onClose={close} />
      </Popover>
    </div>
  );
}
