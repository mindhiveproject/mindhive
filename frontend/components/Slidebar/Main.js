import ChatMain from "../Dashboard/Chat/Main";
import useTranslation from "next-translate/useTranslation";
import Button from "../DesignSystem/Button";

export default function Slidebar({ user, chatId, toggleSlidebar }) {
  const { t } = useTranslation('common');
  const query = {
    selector: chatId,
  };

  return (
    <div>
      <Button variant="text" onClick={toggleSlidebar}>
        {t("close", {}, { default: "Close" })}
      </Button>
      <ChatMain user={user} query={query} />
    </div>
  );
}
