import Site from "../../../components/Global/Site";
import Dashboard from "../../../components/Global/Dashboard";
import DashboardRouter from "../../../components/Dashboard/Router";

// provide guest context dependent on the value in the query ("guest" -> publicId)
import GuestContext from "../../../components/Global/GuestContext";

export default function DashboardPage({ query }) {
  const { area } = query;
  return (
    <Site>
      <GuestContext query={query}>
        <Dashboard area={area}>
          <DashboardRouter query={query} />
        </Dashboard>
      </GuestContext>
    </Site>
  );
}
