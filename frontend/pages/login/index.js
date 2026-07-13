import Site from "../../components/Global/Site";
import Page from "../../components/Global/Page";
import Form from "../../components/Global/Form";
import Login from "../../components/Auth/Login";

export default function LoginPage({ query }) {
  return (
    <Site>
      <Page>
        <Form>
          <Login {...query} />
        </Form>
      </Page>
    </Site>
  );
}
