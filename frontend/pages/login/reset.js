import Site from "../../components/Global/Site";
import Page from "../../components/Global/Page";
import Form from "../../components/Global/Form";
import Reset from "../../components/Auth/Reset";

export default function LoginPage({ query }) {
  return (
    <Site>
      <Page>
        <Form>
          <Reset query={query} />
        </Form>
      </Page>
    </Site>
  );
}
