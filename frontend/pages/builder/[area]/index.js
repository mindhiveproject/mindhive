import Site from "../../../components/Global/Site";
import Builder from "../../../components/Global/Builder";
import BuilderRouter from "../../../components/Builder/Router";

export default function DashboardPage({ query }) {
  return (
    <Site>
      <Builder>
        <BuilderRouter query={query} />
      </Builder>
    </Site>
  );
}
