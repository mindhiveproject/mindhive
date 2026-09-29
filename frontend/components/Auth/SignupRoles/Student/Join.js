import { useMutation, useQuery } from "@apollo/client";
import Link from "next/link";
import { useRouter } from "next/dist/client/router";
import useTranslation from "next-translate/useTranslation";

import { CLASS_JOIN_PREVIEW, GET_CLASSES } from "../../../Queries/Classes";

import { JOIN_CLASS_MUTATION } from "../../../Mutations/User";
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

  const { data, loading, error } = useQuery(CLASS_JOIN_PREVIEW, {
    variables: { code: classCode },
  });

  const [joinClassAsStudent, { loading: joinClassAsStudentLoading }] =
    useMutation(JOIN_CLASS_MUTATION, {
      variables: {
        classCode: classCode,
        role: "student",
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
    useMutation(JOIN_CLASS_MUTATION, {
      variables: {
        classCode: classCode,
        role: "mentor",
        invitationCode: invitationCode || null,
      },
      refetchQueries: [{ query: CURRENT_USER_QUERY }],
    });

  const myclass = data?.classJoinPreview || undefined;

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
          {myclass.title} - {myclass.creatorUsername}
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
                try {
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
                } catch (err) {
                  // e.g. a mentor link without a valid invitation code
                  alert(err.message);
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
