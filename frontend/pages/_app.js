import NProgress from "nprogress";
import Router from "next/router";

import "../components/styles/nprogress.css";

import { ApolloProvider } from "@apollo/client";
import withData from "../lib/withData";

import Site from "../components/Global/Site";
import Authorized from "../components/Global/Authorized";

Router.events.on("routeChangeStart", () => NProgress.start());
Router.events.on("routeChangeComplete", () => NProgress.done());
Router.events.on("routeChangeError", () => NProgress.done());

function MyApp({ Component, pageProps, apollo }) {
  return (
    <ApolloProvider client={apollo}>
      <Site>
        <Authorized>
          <Component {...pageProps} />
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
