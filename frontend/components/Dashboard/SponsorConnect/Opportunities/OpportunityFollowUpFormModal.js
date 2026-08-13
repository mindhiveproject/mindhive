import { useRef, useState } from "react";
import useTranslation from "next-translate/useTranslation";

import Button from "../../../DesignSystem/Button";
import Modal from "../../../DesignSystem/Modal";
import OpportunityFollowUpFormPanel from "./OpportunityFollowUpFormPanel";

export default function OpportunityFollowUpFormModal({
  open,
  onClose,
  opportunity,
  formMeta,
}) {
  const { t } = useTranslation("connect");
  const formRef = useRef(null);
  const [saving, setSaving] = useState(false);

  const formTitle =
    formMeta?.title ||
    t("opportunityEditor.tabs.followUpFallback", {}, {
      default: "Follow-up form",
    });

  const title = opportunity?.title
    ? t(
        "myOpportunitiesList.modals.formTitleNamed",
        { form: formTitle, title: opportunity.title },
        { default: "{{form}} · {{title}}" },
      )
    : formTitle;

  const handleSave = async () => {
    setSaving(true);
    try {
      await formRef.current?.save?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="large"
      maxWidth={880}
      title={title}
      actions={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            {t("myOpportunitiesList.modals.close", {}, { default: "Close" })}
          </Button>
          <Button
            type="button"
            variant="filled"
            onClick={handleSave}
            disabled={saving || !opportunity?.id || !formMeta?.id}
          >
            {saving
              ? t("opportunityEditor.saving", {}, { default: "Saving…" })
              : t("opportunityEditor.save", {}, { default: "Save changes" })}
          </Button>
        </>
      }
    >
      {opportunity && formMeta ? (
        <OpportunityFollowUpFormPanel
          ref={formRef}
          opportunity={opportunity}
          formMeta={formMeta}
          hideSaveButton
        />
      ) : null}
    </Modal>
  );
}
