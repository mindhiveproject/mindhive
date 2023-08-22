import Site from "../components/Global/Site";
import Page from "../components/Global/Page";
import TeachersInformation from "../components/Front/Teachers/Main";

const FrontPage = () => (
  <Site>
    <Page fullScreen>
      <TeachersInformation />
    </Page>
  </Site>
);

export default FrontPage;
