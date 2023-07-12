import Link from "next/link";
import AddChat from "./AddChat";
import ChatPage from "./ChatPage";

import ChatsList from "./ChatsList";
import { StyledChat } from "../../styles/StyledChat";

export default function ChatMain({ query, user }) {
  const { selector } = query;

  if (!selector) {
    return (
      <StyledChat>
        <h1>My group chats</h1>
        <Link href="/dashboard/chats/add">
          <button>Add group chat</button>
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
