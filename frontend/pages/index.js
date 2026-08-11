import Site from "../components/Global/Site";
import FrontMain from "../components/Front/Main";

import Router from "next/router";
import { useContext, useEffect } from "react";
import { UserContext } from "../components/Global/Authorized";

/**
 * Bounce signed-in visitors before anything renders.
 *
 * Keystone scopes `keystonejs-session` to `.mindhive.science` in production
 * (keystone/auth.ts), and in dev cookies ignore ports, so `localhost:4444`
 * sets it for `localhost:3000` too — meaning this origin can see it in both
 * environments. Presence is all we check: the cookie is @hapi/iron-sealed and
 * this app has no SESSION_SECRET to unseal it. A stale cookie lands on
 * /dashboard, which shows the login form, which is the right answer anyway.
 */
export async function getServerSideProps({ req }) {
  if (req.cookies["keystonejs-session"]) {
    return {
      redirect: { destination: "/dashboard", permanent: false },
    };
  }
  return { props: {} };
}

export default function MainPage() {
  const { user } = useContext(UserContext);

  // Covers client-side navigations to `/`, which never hit
  // getServerSideProps. In an effect, not during render: reactStrictMode
  // double-invokes render, which fired this push twice.
  useEffect(() => {
    if (user) {
      Router.push({ pathname: "/dashboard" });
    }
  }, [user]);

  // Deliberately not gated on auth loading. This is the public landing page,
  // and holding anonymous visitors behind a spinner costs more than the brief
  // marketing flash a signed-in visitor sees before the redirect.
  return (
    <Site>
      <FrontMain />
    </Site>
  );
}
