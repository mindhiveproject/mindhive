import { useApolloClient, useMutation } from "@apollo/client";
import { GoogleLogin } from "react-google-login";
import { useRouter } from "next/dist/client/router";
import useTranslation from "next-translate/useTranslation";

const clientID =
  "1042393944588-od9nbqtdfefltmpq8kjnnhir0lbb14se.apps.googleusercontent.com";

import { GOOGLE_LOGIN } from "../Mutations/Auth";
import { SIGNIN_MUTATION } from "../Mutations/User";
import { CURRENT_USER_QUERY } from "../Queries/User";
import {
  acceptNetworkInviteAfterAuth,
  completeClassNetworkInviteAfterAuth,
} from "../../lib/joinClassNetwork";

export default function LoginWithGoogle({
  classNetwork,
  networkInvite,
  redirectType,
  redirectTo,
  onInviteError,
  disabled = false,
}) {
  const router = useRouter();
  const apolloClient = useApolloClient();
  const { t } = useTranslation("common");
  const [googleLogin, { loading }] = useMutation(GOOGLE_LOGIN);

  const [signin] = useMutation(SIGNIN_MUTATION, {
    refetchQueries: [{ query: CURRENT_USER_QUERY }],
  });

  const handleSuccess = async (e) => {
    if (disabled) return;

    const res = await googleLogin({
      variables: { token: e.tokenId },
    });
    const email = res?.data?.googleLogin?.email;
    const normalizedEmail = email?.toLowerCase().trim();
    const login = await signin({
      variables: {
        email: normalizedEmail,
        password: e.tokenId,
      },
    });

    if (!login?.data?.authenticateProfileWithPassword?.item?.id) return;

    if (networkInvite) {
      const result = await acceptNetworkInviteAfterAuth({
        apolloClient,
        token: networkInvite,
        router,
      });
      if (!result.ok) {
        onInviteError?.(
          t(
            "auth.networkInvite.acceptFailed",
            {},
            {
              default:
                "We could not accept this network invitation. Check that you are using the invited account.",
            }
          ),
          "joinFailed"
        );
      }
      return;
    }

    if (classNetwork) {
      const result = await completeClassNetworkInviteAfterAuth({
        apolloClient,
        classNetworkId: classNetwork,
        redirectType,
        redirectTo,
        router,
      });
      if (!result.ok && result.error === "wrongRole") {
        onInviteError?.(
          t(
            "auth.classNetworkInvite.wrongRole",
            {},
            {
              default:
                "Class-network membership is available to teachers, mentors, sponsors, and scientists.",
            }
          ),
          "wrongRole"
        );
      } else if (!result.ok) {
        onInviteError?.(
          t(
            "auth.classNetworkInvite.joinFailed",
            {},
            {
              default:
                "We could not add you to this class network. Please try again.",
            }
          ),
          "joinFailed"
        );
      }
      return;
    }

    if (redirectType === "JoinStudyFlow" && redirectTo) {
      router.push({
        pathname: "/join/details",
        query: { id: redirectTo, guest: false },
      });
      return;
    }

    router.push({ pathname: "/dashboard" });
  };

  const handleFailure = () => {
    alert("There was an error, please try again.");
  };

  return (
    <GoogleLogin
      clientId={clientID}
      render={(renderProps) => (
        <button
          type="button"
          className="googleButton"
          onClick={renderProps.onClick}
          disabled={disabled || loading}
        >
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
