import { Dropdown } from "semantic-ui-react";
import Link from "next/link";
import { useQuery, useMutation } from "@apollo/client";
import absoluteUrl from "next-absolute-url";
import useTranslation from "next-translate/useTranslation";
import { GET_CLASSES } from "../../../Queries/Classes";
import {
  ASSIGN_STUDENT_TO_CLASS,
  REMOVE_STUDENT_FROM_CLASS,
} from "../../../Mutations/Classes";
import { GET_CLASS } from "../../../Queries/Classes";
import StudyCompletionOverview from "./Overview/StudyCompletion";

export default function ClassStudents({ myclass, user, query }) {
  const { action } = query;
  const { origin } = absoluteUrl();
  const { t } = useTranslation("classes");
  const students = myclass?.students || [];

  const { data, error, loading } = useQuery(GET_CLASSES, {
    variables: {
      input: {
        OR: [
          {
            creator: {
              id: { equals: user?.id },
            },
          },
          {
            mentors: {
              some: { id: { equals: user?.id } },
            },
          },
        ],
      },
    },
  });

  const classes = data?.classes || [];
  const otherClasses = classes.filter((cl) => cl?.id !== myclass?.id);

  const [removeFromClass, { loading: removeLoading }] = useMutation(
    REMOVE_STUDENT_FROM_CLASS,
    {
      variables: {
        classId: myclass?.id,
      },
      refetchQueries: [
        {
          query: GET_CLASSES,
          variables: {
            input: {
              creator: { id: { equals: user?.id } },
            },
          },
        },
        { query: GET_CLASS, variables: { code: myclass?.code } },
      ],
    }
  );

  const [assignStudentToClass, { loading: assignLoading }] = useMutation(
    ASSIGN_STUDENT_TO_CLASS,
    {
      refetchQueries: [
        {
          query: GET_CLASSES,
          variables: {
            input: {
              creator: { id: { equals: user?.id } },
            },
          },
        },
        // { query: GET_CLASS },
      ],
    }
  );

  const copyLink = () => {
    const copyLink = `${origin}/signup/student?code=${myclass.code}`;
    const temp = document.createElement("input");
    document.body.append(temp);
    temp.value = copyLink;
    temp.select();
    document.execCommand("copy");
    temp.remove();
    alert(t("studentsTab.copiedLink"));
  };

  if (action === "overview") {
    return <StudyCompletionOverview myclass={myclass} user={user} />;
  }

  return (
    <div className="students">
      <div className="topNavigation">
        <div>
          <p>
            {t("studentsTab.shareMessage")}
          </p>
          <div className="copyArea">
            <div className="link">
              {origin}/signup/student/?code={myclass.code}
            </div>
            <div className="copyButton" onClick={() => copyLink()}>
              {t("studentsTab.copy")}
            </div>
          </div>
        </div>
        <div>
          <p>{t("studentsTab.code")}</p>
          <h2>{myclass.code}</h2>
        </div>
      </div>

      <div className="buttons">
        <Link
          href={{
            pathname: `/dashboard/myclasses/${myclass?.code}`,
            query: {
              page: "students",
              action: "overview",
            },
          }}
        >
          <button className="secondary">{t("studentsTab.completionOverview")}</button>
        </Link>

        <Link
          href={{
            pathname: `/dashboard/resources`,
            query: {
              c: myclass?.id,
            },
          }}
        >
          <button className="secondary">{t("studentsTab.classResources")}</button>
        </Link>
      </div>

      <div className="listHeader">
        <div></div>
        <div>{t("studentsTab.student")}</div>
        <div>{t("studentsTab.email")}</div>
      </div>
      {students.map((student, i) => {
        return (
          <div key={i} className="listWrapper">
            <Dropdown className="dropdownMenu" simple>
              <Dropdown.Menu>
                <Dropdown.Item
                  className="dropdownItem"
                  name="remove"
                  onClick={() => {
                    if (
                      confirm(
                        t("studentsTab.removeStudent")
                      )
                    ) {
                      removeFromClass({
                        variables: { studentId: student?.id },
                      }).catch((err) => {
                        alert(err.message);
                      });
                    }
                  }}
                >
                  {t("studentsTab.removeFromClass")}
                </Dropdown.Item>
                <Dropdown
                  item
                  simple
                  text={t("studentsTab.addToClass")}
                  className="dropdownItem"
                  options={otherClasses.map((myClass) => ({
                    key: myClass.id,
                    text: myClass.title,
                    className: "dropdownItem",
                    onClick: () => {
                      if (
                        confirm(
                          t("studentsTab.assignToClass")
                        )
                      ) {
                        assignStudentToClass({
                          variables: {
                            studentId: student?.id,
                            classId: myClass?.id,
                          },
                        }).catch((err) => {
                          alert(err.message);
                        });
                      }
                    },
                  }))}
                />
              </Dropdown.Menu>
            </Dropdown>

            <Link
              href={{
                pathname: `/dashboard/students/${student?.publicId}`,
              }}
            >
              <div className="listRow" style={{ cursor: "pointer" }}>
                <div>{student.username}</div>
                <div>{student?.email}</div>
              </div>
            </Link>
          </div>
        );
      })}
    </div>
  );
}
