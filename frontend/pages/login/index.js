import Site from "../../components/Global/Site";
import Page from "../../components/Global/Page";
import Form from "../../components/Global/Form";
import RequestReset from "../../components/Auth/RequestReset";
import Login from "../../components/Auth/Login";

export default function LoginPage() {
  return (
    <Site>
      <Page>
        <Form>
          <Login />
          <RequestReset />
        </Form>
      </Page>
    </Site>
  );
}
