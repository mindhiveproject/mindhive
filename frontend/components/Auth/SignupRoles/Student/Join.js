import { useMutation, useQuery } from "@apollo/client";
import Link from "next/link";
import { useRouter } from "next/dist/client/router";
import useTranslation from "next-translate/useTranslation";

import { GET_CLASS } from "../../../Queries/Classes";
import { GET_CLASSES } from "../../../Queries/Classes";

import {
  JOIN_CLASS_AS_STUDENT_MUTATION,
  JOIN_CLASS_AS_MENTOR_MUTATION,
} from "../../../Mutations/User";
import { CURRENT_USER_QUERY } from "../../../Queries/User";
import { SignupForm } from "../../../styles/StyledForm";
import Button from "../../../DesignSystem/Button";

export default function JoinClass({ user, role, classCode, invitationCode }) {
  const router = useRouter();
  const { t } = useTranslation("classes");

  const query =
    role === "mentor"
      ? { action: "select", code: classCode, i: invitationCode }
      : { action: "select", code: classCode };

  const { data, loading, error } = useQuery(GET_CLASS, {
    variables: { code: classCode },
  });

  const [joinClassAsStudent, { loading: joinClassAsStudentLoading }] =
    useMutation(JOIN_CLASS_AS_STUDENT_MUTATION, {
      variables: {
        id: user?.id,
        classCode: classCode,
      },
      refetchQueries: [
        { query: CURRENT_USER_QUERY },
        {
          query: GET_CLASSES,
          variables: {
            input: {
              students: { some: { id: { equals: user?.id } } },
            },
          },
        },
      ],
    });

  const [joinClassAsMentor, { loading: joinClassAsMentorLoading }] =
    useMutation(JOIN_CLASS_AS_MENTOR_MUTATION, {
      variables: {
        id: user?.id,
        classCode: classCode,
      },
      refetchQueries: [{ query: CURRENT_USER_QUERY }],
    });

  const myclass = data?.class || undefined;

  if (!myclass) {
    return (
      <SignupForm>
        <div className="classFoundScreen">
          <h1>
            {t("joinClassFlow.noClassFound", { code: classCode }, {
              default: "No class found for the code {{code}}",
            })}
          </h1>
          <Link href="/signup/student">
            <Button variant="outline">
              {t("joinClassFlow.goBack", {}, { default: "Go back" })}
            </Button>
          </Link>
        </div>
      </SignupForm>
    );
  }

  return (
    <SignupForm>
      <div className="classFoundScreen">
        <h1>
          {t("joinClassFlow.wantToJoin", { role }, {
            default: "Do you want to join the following class as a {{role}}?",
          })}
        </h1>

        <div className="classInformation">
          {myclass.title} - {myclass.creator.username}
        </div>

        <div className="navigationBtns">
          <Link href={`/signup/${role}`}>
            <Button variant="outline" style={{ width: "100%" }}>
              {t("joinClassFlow.noGoBack", {}, { default: "No, go back" })}
            </Button>
          </Link>

          {user ? (
            <Button
              variant="filled"
              style={{ width: "100%" }}
              disabled={joinClassAsStudentLoading || joinClassAsMentorLoading}
              onClick={async () => {
                if (role === "mentor") {
                  await joinClassAsMentor();
                  router.push({
                    pathname: "/dashboard/myclasses",
                  });
                }
                if (role === "student") {
                  await joinClassAsStudent();
                  router.push({
                    pathname: "/dashboard/classes",
                  });
                }
              }}
            >
              {t("joinClassFlow.yesContinue", {}, { default: "Yes, continue" })}
            </Button>
          ) : (
            <Link
              href={{
                pathname: `/signup/${role}`,
                query: query,
              }}
            >
              <Button variant="filled" style={{ width: "100%" }}>
                {t("joinClassFlow.yesContinue", {}, { default: "Yes, continue" })}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </SignupForm>
  );
}
