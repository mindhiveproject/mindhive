import ChatMain from "../Dashboard/Chat/Main";
import useTranslation from 'next-translate/useTranslation';

export default function Slidebar({ user, chatId, toggleSlidebar }) {
  const { t } = useTranslation('common');
  const query = {
    selector: chatId,
  };

  return (
    <div>
      <button onClick={toggleSlidebar}>{t('close', 'Close')}</button>
      <ChatMain user={user} query={query} />
    </div>
  );
}
