import Link from "next/link";
import useTranslation from "next-translate/useTranslation";
import AddChat from "./AddChat";
import ChatPage from "./ChatPage";

import ChatsList from "./ChatsList";
import { StyledChat } from "../../styles/StyledChat";
import Button from "../../DesignSystem/Button";

export default function ChatMain({ query, user }) {
  const { t } = useTranslation("dashboard");
  const { selector } = query;

  if (!selector) {
    return (
      <StyledChat>
        <h1>{t("chat.myGroupChats", {}, { default: "My group chats" })}</h1>
        <Link href="/dashboard/chats/add">
          <Button variant="filled">
            {t("chat.addGroupChat", {}, { default: "Add group chat" })}
          </Button>
        </Link>
        <ChatsList query={query} user={user} />
      </StyledChat>
    );
  }
  if (selector === "add") {
    return (
      <StyledChat>
        <AddChat user={user} />
      </StyledChat>
    );
  }
  return (
    <StyledChat>
      <ChatPage code={selector} user={user} query={query} />
    </StyledChat>
  );
}
