import Site from "../../../components/Global/Site";
import Dashboard from "../../../components/Global/Dashboard";
import DashboardRouter from "../../../components/Dashboard/Router";

export default function DashboardPage({ query }) {
  return (
    <Site>
      <Dashboard>
        <DashboardRouter query={query} />
      </Dashboard>
    </Site>
  );
}
