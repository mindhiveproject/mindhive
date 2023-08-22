import Site from "../../components/Global/Site";
import Page from "../../components/Global/Page";
import Form from "../../components/Global/Form";
import RequestReset from "../../components/Auth/RequestReset";

export default function LoginPage() {
  return (
    <Site>
      <Page>
        <Form>
          <RequestReset />
        </Form>
      </Page>
    </Site>
  );
}
