import { useMutation } from "@apollo/client";
import { useEffect, useState } from "react";

import { UPDATE_CHAT_SETTINGS } from "../../../Mutations/Chat";

export default function EditTitle({ chat }) {
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
          <button
            className="secondaryBtn"
            onClick={async () => {
              await updateChatSettings();
            }}
          >
            {loading ? "Saving" : "Save"}
          </button>
        </div>
      )}
    </div>
  );
}
