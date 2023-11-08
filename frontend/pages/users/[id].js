import Site from "../../components/Global/Site";
import Dashboard from "../../components/Global/Dashboard";
import DashboardRouter from "../../components/Dashboard/Router";

// provide guest context dependent on the value in the query ("guest" -> publicId)
import GuestContext from "../../components/Global/GuestContext";

import PublicUserPage from "../../components/User/Main";

export default function UserPublicPage({ query }) {
  return (
    <Site>
      <GuestContext query={query}>
        <Dashboard>
          <PublicUserPage id={query?.id} />
        </Dashboard>
      </GuestContext>
    </Site>
  );
}
