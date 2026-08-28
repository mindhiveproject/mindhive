import { useMutation } from "@apollo/client";
import { useEffect, useState } from "react";
import useTranslation from "next-translate/useTranslation";
import Button from "../../../DesignSystem/Button";

import { UPDATE_CHAT_SETTINGS } from "../../../Mutations/Chat";

export default function EditTitle({ chat }) {
  const { t } = useTranslation("dashboard");
  const [title, setTitle] = useState("");

  useEffect(() => {
    setTitle(chat?.settings?.title);
  }, [chat]); // Only re-run the effect if chat changes

  const [updateChatSettings, { loading }] = useMutation(UPDATE_CHAT_SETTINGS, {
    variables: {
      id: chat?.id,
      settings: { ...chat?.settings, title },
    },
  });

  return (
    <div className="chatTitle">
      <label htmlFor="title">
        <input
          type="text"
          id="chatTitle"
          name="title"
          value={title}
          onChange={({ target }) => {
            setTitle(target?.value);
          }}
          required
          className="title"
        />
      </label>
      {title !== chat?.settings?.title && (
        <div>
          <Button
            variant="filled"
            onClick={async () => {
              await updateChatSettings();
            }}
          >
            {loading
              ? t("chat.saving", {}, { default: "Saving" })
              : t("chat.save", {}, { default: "Save" })}
          </Button>
        </div>
      )}
    </div>
  );
}
