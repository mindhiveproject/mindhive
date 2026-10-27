import { useState } from "react";
import { useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";

import DisplayError from "../../ErrorMessage";
import Button from "../../DesignSystem/Button";
import Modal from "../../DesignSystem/Modal";
import { TrashIcon } from "../../DesignSystem/Icons";
import { DELETE_CONSENT } from "../../Mutations/Consent";
import { GET_MY_CONSENTS } from "../../Queries/Consent";

const DANGER_STYLE = {
  background: "var(--MH-Theme-Danger-Dark, #8f1f14)",
  color: "var(--MH-Theme-Neutrals-White, #ffffff)",
};

// Last card of the settings page: the author deletes the protocol, after
// confirming, and goes back to the list of protocols.
export default function DeleteConsentSection({ consent, user }) {
  const router = useRouter();
  const { t } = useTranslation("dashboard");
  const [confirming, setConfirming] = useState(false);
  const [deleteConsent, { loading, error, reset }] = useMutation(
    DELETE_CONSENT,
    {
      refetchQueries: [
        { query: GET_MY_CONSENTS, variables: { userId: user?.id } },
      ],
      awaitRefetchQueries: true,
    }
  );

  const close = () => {
    setConfirming(false);
    reset();
  };

  async function confirmDelete() {
    try {
      await deleteConsent({ variables: { id: consent?.id } });
      router.push("/dashboard/irb");
    } catch (err) {
      // surfaced through error
    }
  }

  return (
    <section className="consentSettingsCard">
      <div className="consentSettingRow">
        <div>
          <div className="consentSettingTitle">
            <h2>
              {t(
                "consentAdmin.deleteHeading",
                {},
                { default: "Delete protocol" }
              )}
            </h2>
          </div>
          <p>
            {t(
              "consentAdmin.deleteHint",
              {},
              {
                default:
                  "Delete this protocol and all its consent forms. This can’t be undone.",
              }
            )}
          </p>
        </div>
        <Button
          variant="subtle"
          type="button"
          leadingIcon={<TrashIcon />}
          onClick={() => setConfirming(true)}
          style={{ color: "var(--MH-Theme-Danger-Dark, #8f1f14)" }}
        >
          {t("consentAdmin.delete", {}, { default: "Delete" })}
        </Button>
      </div>

      <Modal
        open={confirming}
        onClose={close}
        title={t(
          "consentAdmin.deleteTitle",
          {},
          { default: "Delete this protocol?" }
        )}
        actions={
          <>
            <Button variant="outline" type="button" onClick={close}>
              {t("consentAdmin.cancel", {}, { default: "Cancel" })}
            </Button>
            <Button
              variant="filled"
              type="button"
              disabled={loading}
              onClick={confirmDelete}
              style={DANGER_STYLE}
            >
              {loading
                ? t("consentAdmin.deleting", {}, { default: "Deleting…" })
                : t("consentAdmin.delete", {}, { default: "Delete" })}
            </Button>
          </>
        }
      >
        <p>
          {t(
            "consentAdmin.deleteInfo",
            { title: consent?.title },
            {
              default:
                "“{{title}}” and all its consent forms will be deleted. This can’t be undone.",
            }
          )}
        </p>
        {consent?.studiesCount > 0 && (
          <p>
            {t(
              "consentAdmin.deleteStudies",
              { count: consent.studiesCount },
              {
                default:
                  "Studies using this protocol: {{count}}. They will no longer show these consent forms.",
              }
            )}
          </p>
        )}
        <DisplayError error={error} />
      </Modal>
    </section>
  );
}
