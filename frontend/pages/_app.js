import NProgress from "nprogress";
import Router from "next/router";
import { useEffect } from "react";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";
import Cookies from "js-cookie";
import { useQuery } from "@apollo/client";
import { CURRENT_USER_QUERY } from "../components/Queries/User";

import "../components/styles/nprogress.css";

import { ApolloProvider } from "@apollo/client";
import withData from "../lib/withData";

import Site from "../components/Global/Site";
import Authorized from "../components/Global/Authorized";
import HelpCenter from "../components/Global/HelpCenter";

Router.events.on("routeChangeStart", () => NProgress.start());
Router.events.on("routeChangeComplete", () => NProgress.done());
Router.events.on("routeChangeError", () => NProgress.done());

function useSyncUserLanguage() {
  const router = useRouter();
  const { lang } = useTranslation();
  const { data } = useQuery(CURRENT_USER_QUERY);
  const user = data?.authenticatedItem;

  useEffect(() => {
    if (user?.language && user.language.toLowerCase() !== lang) {
      Cookies.set("NEXT_LOCALE", user.language.toLowerCase());
      router.push(router.asPath, router.asPath, { locale: user.language.toLowerCase() });
    } else {
      // console.log('useSyncUserLanguage: no sync needed', user?.language, lang);
    }
  }, [user, lang]);
}

function LanguageSyncWrapper({ children }) {
  useSyncUserLanguage();
  return children;
}

function MyApp({ Component, pageProps, apollo }) {
  return (
    <ApolloProvider client={apollo}>
      <Site>
        <Authorized>
          <LanguageSyncWrapper>
            <Component {...pageProps} />
            <HelpCenter />
          </LanguageSyncWrapper>
        </Authorized>
      </Site>
    </ApolloProvider>
  );
}

MyApp.getInitialProps = async function ({ Component, ctx }) {
  let pageProps = {};
  if (Component.getInitialProps) {
    pageProps = await Component.getInitialProps(ctx);
  }
  pageProps.query = ctx.query;
  return { pageProps };
};

export default withData(MyApp);
