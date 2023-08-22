import Site from "../../components/Global/Site";
import FrontMain from "../../components/Front/Main";

export default function MainPage({ query }) {
  return (
    <Site>
      <FrontMain query={{ ...query, selector: "study" }} />
    </Site>
  );
}
