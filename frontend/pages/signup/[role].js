import Site from "../../components/Global/Site";
import Page from "../../components/Global/Page";
import Form from "../../components/Global/Form";
import RoleSignup from "../../components/Auth/SignupRoles/Role";

const RoleSignupPage = ({ query }) => (
  <Site>
    <Page>
      <Form>
        <RoleSignup {...query} />
      </Form>
    </Page>
  </Site>
);

export default RoleSignupPage;
