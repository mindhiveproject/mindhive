import ChatMain from "../Dashboard/Chat/Main";

export default function Slidebar({ user, chatId, toggleSlidebar }) {
  const query = {
    selector: chatId,
  };

  return (
    <div>
      <button onClick={toggleSlidebar}>Close</button>
      <ChatMain user={user} query={query} />
    </div>
  );
}
