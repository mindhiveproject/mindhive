import Site from "../../components/Global/Site";
import Page from "../../components/Global/Page";
import Form from "../../components/Global/Form";
import Sign from "../../components/Auth/Sign";

export default function LoginPage() {
  return (
    <Site>
      <Page>
        <Form>
          <Sign />
        </Form>
      </Page>
    </Site>
  );
}
