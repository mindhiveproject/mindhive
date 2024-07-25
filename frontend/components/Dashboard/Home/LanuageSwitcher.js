import { useRouter } from "next/router";
import i18nConfig from "../../../i18n.json";

const LanguageSwitcher = () => {
  const router = useRouter();
  const { locales, defaultLocale } = i18nConfig;

  const changeLanguage = (locale) => {
    const { pathname, asPath, query } = router;
    router.push({ pathname, query }, asPath, { locale });
  };

  return (
    <div>
      <h3>Switch languages (only for admin and only for testing)</h3>
      <div>
        {locales.map((locale) => (
          <button key={locale} onClick={() => changeLanguage(locale)}>
            {locale.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSwitcher;
