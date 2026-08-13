import NProgress from "nprogress";
import Router from "next/router";
import { useContext, useEffect } from "react";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";
import Cookies from "js-cookie";

import "../components/styles/nprogress.css";

import { ApolloProvider } from "@apollo/client";
import withData from "../lib/withData";

import "../components/styles/global.css";
// Data Journal / Plotly map traces — MapLibre (vendored from maplibre-gl; see next.config.js alias)
import "../components/styles/maplibre-gl-vendor.css";
import Site from "../components/Global/Site";
import Authorized, { UserContext } from "../components/Global/Authorized";
import HelpCenter from "../components/Global/HelpCenter";
import { localeToBcp47 } from "../lib/localeToBcp47";

// The bar is the only route-change signal; the corner spinner duplicated it.
NProgress.configure({ showSpinner: false, minimum: 0.15, trickleSpeed: 120 });

// Hold the bar back until a navigation has actually taken a moment. Most
// dashboard area switches resolve well inside this, and a bar that flickers
// on every instant navigation reads as clutter rather than feedback.
const BAR_DELAY_MS = 150;
let barTimer;

// Navigations overlap: a redirect fired from an effect starts before the route
// change that mounted it reports complete. Clearing on start keeps one timer
// alive at a time — otherwise the second start orphans the first, which then
// fires after the last done() and strands the bar. Finishing is deliberately
// unconditional: Next drops a navigation that another one supersedes without
// emitting either completion event, so anything that tries to pair starts with
// finishes will eventually get stuck holding the bar open.
Router.events.on("routeChangeStart", () => {
  clearTimeout(barTimer);
  barTimer = setTimeout(() => NProgress.start(), BAR_DELAY_MS);
});

const finishBar = () => {
  clearTimeout(barTimer);
  NProgress.done();
};

Router.events.on("routeChangeComplete", finishBar);
Router.events.on("routeChangeError", finishBar);

function useSyncUserLanguage() {
  const router = useRouter();
  const { lang } = useTranslation();
  // Reads the user Authorized already fetched rather than firing
  // CURRENT_USER_QUERY a second time.
  const { user } = useContext(UserContext);

  useEffect(() => {
    if (user?.language && user.language.toLowerCase() !== lang) {
      Cookies.set("NEXT_LOCALE", user.language.toLowerCase());
      router.push(router.asPath, router.asPath, { locale: user.language.toLowerCase() });
    } else {
      // console.log('useSyncUserLanguage: no sync needed', user?.language, lang);
    }
  }, [user, lang]);
}

function useDocumentLang() {
  const router = useRouter();
  const { lang } = useTranslation();

  useEffect(() => {
    document.documentElement.lang = localeToBcp47(router.locale || lang);
  }, [router.locale, lang]);
}

function LanguageSyncWrapper({ children }) {
  useSyncUserLanguage();
  useDocumentLang();
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
