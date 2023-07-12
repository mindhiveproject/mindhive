import { Dropdown } from "semantic-ui-react";
import Link from "next/link";
import { useQuery, useMutation } from "@apollo/client";

import { GET_CLASSES } from "../../../Queries/Classes";
import {
  ASSIGN_STUDENT_TO_CLASS,
  REMOVE_STUDENT_FROM_CLASS,
} from "../../../Mutations/Classes";
import { GET_CLASS } from "../../../Queries/Classes";

export default function ClassStudents({ myclass, user, query }) {
  const students = myclass?.students || [];

  const { data, error, loading } = useQuery(GET_CLASSES, {
    variables: {
      input: {
        creator: { id: { equals: user?.id } },
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
    const copyLink = `https://mindhive.science/signup/student/${myclass.code}`;
    const temp = document.createElement("input");
    document.body.append(temp);
    temp.value = copyLink;
    temp.select();
    document.execCommand("copy");
    temp.remove();
    alert("The link is copied");
  };

  return (
    <div className="students">
      <div className="topNavigation">
        <div>
          <p>
            Share the link below with your students to invite them to join your
            class
          </p>
          <div className="copyArea">
            <div className="link">
              https://mindhive.science/signup/student/
              {myclass.code}
            </div>
            <div className="copyButton" onClick={() => copyLink()}>
              Copy
            </div>
          </div>
        </div>
        <div>
          <p>Class access code</p>
          <h2>{myclass.code}</h2>
        </div>
      </div>
      <div className="listHeader">
        <div></div>
        <div>Student/Username</div>
        <div>Email address</div>
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
                        "Are you sure you want to remove this student from the class?"
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
                  Remove from this class
                </Dropdown.Item>
                <Dropdown
                  item
                  simple
                  text="Add to class"
                  className="dropdownItem"
                  options={otherClasses.map((myClass) => ({
                    key: myClass.id,
                    text: myClass.title,
                    className: "dropdownItem",
                    onClick: () => {
                      if (
                        confirm(
                          "Are you sure you want to assign this student to the other class?"
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
