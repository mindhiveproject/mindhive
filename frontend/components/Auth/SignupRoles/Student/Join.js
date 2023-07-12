import { useMutation, useQuery } from "@apollo/client";
import Link from "next/link";
import { useRouter } from "next/dist/client/router";

import { GET_CLASS } from "../../../Queries/Classes";
import { JOIN_CLASS_MUTATION } from "../../../Mutations/User";

export default function JoinClass({ user, code }) {
  const router = useRouter();
  const { data, loading, error } = useQuery(GET_CLASS, { variables: { code } });

  const [joinClass, { loading: joinClassLoading }] = useMutation(
    JOIN_CLASS_MUTATION,
    {
      variables: {
        id: user?.id,
        classCode: code,
      },
    }
  );

  const myclass = data?.class || undefined;

  if (!myclass) {
    return (
      <div className="classFoundScreen">
        <h1>
          No class found for the code <i>{code}</i>
        </h1>
        <Link href="/signup/student">
          <button className="primaryBtn">Go back</button>
        </Link>
      </div>
    );
  }

  return (
    <div className="classFoundScreen">
      <h1>Do you want to join the following class?</h1>

      <div className="classInformation">
        {myclass.title} - {myclass.creator.username}
      </div>

      <div className="navigationBtns">
        <Link href="/signup/student">
          <button className="secondaryBtn">No, go back</button>
        </Link>

        {user ? (
          <button
            onClick={async () => {
              await joinClass();
              router.push({
                pathname: "/dashboard/classes",
              });
            }}
            className="primaryBtn"
          >
            Yes, continue
          </button>
        ) : (
          <Link
            href={{
              pathname: `/signup/student`,
              query: {
                code: code,
                action: "select",
              },
            }}
          >
            <button className="primaryBtn">Yes, continue</button>
          </Link>
        )}
      </div>
    </div>
  );
}
