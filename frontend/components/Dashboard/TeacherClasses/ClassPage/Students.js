import Link from "next/link";
import { useQuery, useMutation } from "@apollo/client";
import absoluteUrl from "next-absolute-url";
import useTranslation from "next-translate/useTranslation";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { AgGridReact } from "ag-grid-react";

import { GET_CLASSES, GET_CLASS } from "../../../Queries/Classes";
import {
  ASSIGN_STUDENT_TO_CLASS,
  REMOVE_STUDENT_FROM_CLASS,
} from "../../../Mutations/Classes";
import StudyCompletionOverview from "./Overview/StudyCompletion";
import DropdownMenu from "../../../DesignSystem/DropdownMenu";
import CopyButton from "../../../DesignSystem/CopyButton";

export default function ClassStudents({ myclass, user, query }) {
  const { action } = query;
  const { origin } = absoluteUrl();
  const { t } = useTranslation("classes");
  const students = myclass?.students || [];

  const { data } = useQuery(GET_CLASSES, {
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

  const [removeFromClass] = useMutation(REMOVE_STUDENT_FROM_CLASS, {
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
  });

  const [assignStudentToClass] = useMutation(ASSIGN_STUDENT_TO_CLASS, {
    refetchQueries: [
      {
        query: GET_CLASSES,
        variables: {
          input: {
            creator: { id: { equals: user?.id } },
          },
        },
      },
    ],
  });

  const studentSignupLink = `${origin}/signup/student?code=${myclass.code}`;

  const getStudentActionItems = (student) => {
    const items = [
      {
        key: "remove",
        label: t("studentsTab.removeFromClass"),
        danger: true,
        onClick: () => {
          if (confirm(t("studentsTab.removeStudent"))) {
            removeFromClass({
              variables: { studentId: student?.id },
            }).catch((err) => {
              alert(err.message);
            });
          }
        },
      },
    ];

    if (otherClasses.length > 0) {
      items.push({
        key: "add-header",
        static: true,
        label: t("studentsTab.addToClass"),
      });
      otherClasses.forEach((myClass) => {
        items.push({
          key: `add-${myClass.id}`,
          label: myClass.title,
          onClick: () => {
            if (confirm(t("studentsTab.assignToClass"))) {
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
        });
      });
    }

    return items;
  };

  const UsernameRenderer = (params) => {
    const student = params?.data;
    if (!student) return null;
    return (
      <Link
        href={{ pathname: `/dashboard/students/${student?.publicId}` }}
        style={{ color: "inherit", textDecoration: "none", fontWeight: 500 }}
      >
        {student.username}
      </Link>
    );
  };

  const ActionsRenderer = (params) => {
    const student = params?.data;
    if (!student) return null;
    return (
      <DropdownMenu
        triggerLabel={t("assignment.more", {}, { default: "More" })}
        items={getStudentActionItems(student)}
      />
    );
  };

  const columnDefs = [
    {
      field: "username",
      headerName: t("studentsTab.student"),
      cellRenderer: UsernameRenderer,
      filter: "agTextColumnFilter",
      sortable: true,
      flex: 1,
      minWidth: 160,
    },
    {
      field: "email",
      headerName: t("studentsTab.email"),
      filter: "agTextColumnFilter",
      sortable: true,
      flex: 1,
      minWidth: 200,
    },
    {
      field: "actions",
      headerName: t("assignment.actions", {}, { default: "Actions" }),
      cellRenderer: ActionsRenderer,
      suppressFilter: true,
      sortable: false,
      width: 150,
      pinned: "right",
      cellStyle: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "visible",
      },
    },
  ];

  if (action === "overview") {
    return <StudyCompletionOverview myclass={myclass} user={user} />;
  }

  return (
    <div className="classTabPage students">
      <section className="classTabSection">
        <div className="classTabSectionHeader">
          <h3>{t("studentsTab.tab", {}, { default: "Students" })}</h3>
          <p>{t("studentsTab.shareMessage")}</p>
        </div>
        <div className="classTabInformationBlock">
          <div className="block">
            <div className="classTabInviteBlock">
              <p className="classTabInviteLabel">
                {t("studentsTab.shareMessage")}
              </p>
              <div className="classTabCopyArea">
                <div className="classTabInviteLink">
                  {origin}/signup/student/?code={myclass.code}
                </div>
                <CopyButton value={studentSignupLink} style={{ fontWeight: 500 }}>
                  {t("studentsTab.copy")}
                </CopyButton>
              </div>
            </div>
          </div>
          <div className="block">
            <p className="classTabInviteLabel">{t("studentsTab.code")}</p>
            <div className="classTabCopyArea">
              <p className="classTabCodeValue">{myclass.code}</p>
              <CopyButton value={myclass.code} style={{ fontWeight: 500 }}>
                {t("studentsTab.copy")}
              </CopyButton>
            </div>
          </div>
        </div>
      </section>

      {/* <section className="classTabSection">
        <div className="classTabSectionHeader">
          <h3>
            {t("studentsTab.quickActions", {}, { default: "Quick actions" })}
          </h3>
        </div>
        <div className="classTabActionBar">
          <Link
            href={{
              pathname: `/dashboard/myclasses/${myclass?.code}`,
              query: { page: "students", action: "overview" },
            }}
            style={{ textDecoration: "none" }}
          >
            <Button variant="outline">
              {t("studentsTab.completionOverview")}
            </Button>
          </Link>
          <Link
            href={{
              pathname: `/dashboard/resources`,
              query: { c: myclass?.id },
            }}
            style={{ textDecoration: "none" }}
          >
            <Button variant="outline">{t("studentsTab.classResources")}</Button>
          </Link>
        </div>
      </section> */}

      <section className="classTabSection">
        <div className="classTabSectionHeader">
          <h3>
            {t("studentsTab.roster", {}, { default: "Class roster" })}
          </h3>
          <p>
            {t(
              "studentsTab.rosterDescription",
              { count: students.length },
              {
                default: "{{count}} students enrolled in this class.",
              }
            )}
          </p>
        </div>
        {students.length === 0 ? (
          <div className="classTabEmpty">
            <div>
              {t("studentsTab.noStudentsYet", {}, {
                default:
                  "No students have joined this class yet. Share the invite link above.",
              })}
            </div>
          </div>
        ) : (
          <div className="classTabTable ag-theme-quartz">
            <AgGridReact
              rowData={students}
              columnDefs={columnDefs}
              getRowId={(params) => params.data?.id}
              pagination
              paginationPageSize={20}
              paginationPageSizeSelector={[10, 20, 50, 100]}
              autoSizeStrategy={{ type: "fitGridWidth", defaultMinWidth: 100 }}
              defaultColDef={{ resizable: true, sortable: true, filter: true }}
            />
          </div>
        )}
      </section>
    </div>
  );
}
