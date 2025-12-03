import { useMutation } from "@apollo/client";
import { GoogleLogin } from "react-google-login";
import { useRouter } from "next/dist/client/router";

const clientID =
  "1042393944588-od9nbqtdfefltmpq8kjnnhir0lbb14se.apps.googleusercontent.com";

import { GOOGLE_LOGIN } from "../Mutations/Auth";
import { SIGNIN_MUTATION } from "../Mutations/User";
import { CURRENT_USER_QUERY } from "../Queries/User";

export default function LoginWithGoogle({}) {
  const router = useRouter();
  const [googleLogin, { loading }] = useMutation(GOOGLE_LOGIN);

  const [signin, { data: signinData, loading: signinLoading }] = useMutation(
    SIGNIN_MUTATION,
    {
      refetchQueries: [{ query: CURRENT_USER_QUERY }],
    }
  );

  const handleSuccess = async (e) => {
    const res = await googleLogin({
      variables: { token: e.tokenId },
    });
    const email = res?.data?.googleLogin?.email;
    // Normalize email to lowercase
    const normalizedEmail = email?.toLowerCase().trim();
    // log in user
    const login = await signin({
      variables: {
        email: normalizedEmail,
        password: e.tokenId,
      },
    });
    if (login?.data?.authenticateProfileWithPassword?.item?.id) {
      router.push({
        pathname: "/dashboard",
      });
    }
  };

  const handleFailure = (e) => {
    alert("There was an error, please try again.");
  };

  return (
    <GoogleLogin
      clientId={clientID}
      render={(renderProps) => (
        <button className="googleButton" onClick={renderProps.onClick}>
          <div>
            <img src="/assets/signup/google.png" alt="icon" height="20" />
          </div>
          <div>Login with Google</div>
        </button>
      )}
      onSuccess={handleSuccess}
      onFailure={handleFailure}
    />
  );
}
