import Link from "next/link";
import { useMemo } from "react";
import { useQuery, useMutation } from "@apollo/client";
import absoluteUrl from "next-absolute-url";
import useTranslation from "next-translate/useTranslation";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { AgGridReact } from "ag-grid-react";

import {
  GET_CLASSES,
  GET_CLASS,
  teacherClassesWhere,
  teacherClassesRefetch,
} from "../../../Queries/Classes";
import {
  ASSIGN_STUDENT_TO_CLASS,
  REMOVE_STUDENT_FROM_CLASS,
} from "../../../Mutations/Classes";
import StudyCompletionOverview from "./Overview/StudyCompletion";
import DropdownMenu from "../../../DesignSystem/DropdownMenu";
import Button from "../../../DesignSystem/Button";
import IconButton from "../../../DesignSystem/IconButton";
import CopyButton from "../../../DesignSystem/CopyButton";
import Chip from "../../../DesignSystem/Chip";
import { getClassTemplateBoards } from "../../../../lib/classTemplateBoards";
import { useClassTablePrefs } from "./useClassTablePrefs";

export default function ClassStudents({ myclass, user, query }) {
  const { action } = query;
  const { origin } = absoluteUrl();
  const { t } = useTranslation("classes");
  const students = myclass?.students || [];
  const tablePrefs = useClassTablePrefs(myclass?.id, "students", {
    defaultPageSize: 20,
  });

  const { data } = useQuery(GET_CLASSES, {
    variables: { input: teacherClassesWhere(user?.id) },
  });

  const classes = data?.classes || [];
  const otherClasses = classes.filter((cl) => cl?.id !== myclass?.id);

  const [removeFromClass] = useMutation(REMOVE_STUDENT_FROM_CLASS, {
    variables: {
      classId: myclass?.id,
    },
    refetchQueries: [
      teacherClassesRefetch(user?.id),
      { query: GET_CLASS, variables: { code: myclass?.code } },
    ],
  });

  const [assignStudentToClass] = useMutation(ASSIGN_STUDENT_TO_CLASS, {
    refetchQueries: [
      teacherClassesRefetch(user?.id),
    ],
  });

  const studentSignupLink = `${origin}/signup/student?code=${myclass.code}`;

  const classTemplateBoardsById = useMemo(() => {
    const map = new Map();
    for (const board of getClassTemplateBoards(myclass)) {
      if (board?.id) map.set(board.id, board);
    }
    return map;
  }, [myclass]);

  // Main projects in this class → parent template boards (deduped by template id).
  const getStudentMainProjectTemplates = (student) => {
    const mainProjects = (student?.collaboratorInProposal || []).filter(
      (project) =>
        project?.usedInClass?.id === myclass?.id && project?.isMain
    );

    const byKey = new Map();
    for (const project of mainProjects) {
      const clonedFrom = project?.clonedFrom;
      const templateId = clonedFrom?.id;
      const isAssociatedWithClass = Boolean(
        templateId && classTemplateBoardsById.has(templateId)
      );

      // Prefer the class template title when associated; otherwise the parent
      // board title (or the project title when there is no parent).
      const title = isAssociatedWithClass
        ? classTemplateBoardsById.get(templateId)?.title || clonedFrom?.title
        : clonedFrom?.title || project?.title;

      const key = templateId || `project:${project?.id}`;
      if (byKey.has(key)) continue;

      byKey.set(key, {
        id: key,
        title: title || "",
        isAssociatedWithClass,
        hasParentTemplate: Boolean(templateId),
      });
    }

    return [...byKey.values()];
  };

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
        className="MH-Type-Label-Base"
        style={{ color: "inherit", textDecoration: "none" }}
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
        ariaLabel={t("assignment.action", {}, { default: "Action" })}
        // Portal: AG Grid clips overflow and stacks each row separately, so an
        // in-cell panel gets cut off and painted over by the rows below it.
        portal
        renderTrigger={({ onClick, open, ariaLabel, ariaControls }) => (
          <IconButton
            variant="neutral"
            elevated={false}
            icon={
              <img
                src="/assets/dataviz/three-dots.svg"
                alt=""
                width={16}
                height={16}
                aria-hidden
              />
            }
            ariaLabel={ariaLabel}
            title={ariaLabel}
            aria-expanded={open}
            aria-haspopup="menu"
            aria-controls={ariaControls}
            onClick={onClick}
            style={{ width: 32, height: 32, padding: 4 }}
          />
        )}
        items={getStudentActionItems(student)}
      />
    );
  };

  const TemplateBoardRenderer = (params) => {
    const student = params?.data;
    if (!student) return null;

    const templates = getStudentMainProjectTemplates(student);
    if (!templates.length) return "—";

    return (
      <span
        style={{
          display: "inline-flex",
          flexWrap: "wrap",
          gap: 4,
          alignItems: "center",
          maxWidth: "100%",
        }}
      >
        {templates.map((item) => {
          if (item.isAssociatedWithClass) {
            return (
              <Chip
                key={item.id}
                variant="static"
                tone="neutral"
                label={item.title}
              />
            );
          }

          const label = item.hasParentTemplate && item.title
            ? t(
                "studentsTab.templateNotInClass",
                { title: item.title },
                { default: "{{title}} (not in class)" }
              )
            : t(
                "studentsTab.noTemplateNotInClass",
                {},
                { default: "Not linked to class template" }
              );

          return (
            <Chip
              key={item.id}
              variant="static"
              tone="warning"
              label={label}
            />
          );
        })}
      </span>
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
      colId: "templateBoard",
      headerName: t("studentsTab.templateBoard", {}, {
        default: "Template board",
      }),
      cellRenderer: TemplateBoardRenderer,
      valueGetter: (params) => {
        const templates = getStudentMainProjectTemplates(params?.data);
        return templates
          .map((item) => {
            if (item.isAssociatedWithClass) return item.title;
            if (item.hasParentTemplate && item.title) {
              return t(
                "studentsTab.templateNotInClass",
                { title: item.title },
                { default: "{{title}} (not in class)" }
              );
            }
            return t(
              "studentsTab.noTemplateNotInClass",
              {},
              { default: "Not linked to class template" }
            );
          })
          .filter(Boolean)
          .join(", ");
      },
      filter: "agTextColumnFilter",
      sortable: true,
      flex: 1,
      minWidth: 180,
      cellStyle: {
        display: "flex",
        alignItems: "center",
        overflow: "visible",
      },
    },
    {
      field: "actions",
      headerName: "",
      cellRenderer: ActionsRenderer,
      suppressFilter: true,
      sortable: false,
      width: 72,
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
          <h3>{t("studentsTab.tab", {}, { default: "Student roster" })}</h3>
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
                <CopyButton value={studentSignupLink}>
                  {t("studentsTab.copy")}
                </CopyButton>
              </div>
            </div>
          </div>
          <div className="block">
            <p className="classTabInviteLabel">{t("studentsTab.code")}</p>
            <div className="classTabCopyArea">
              <p className="classTabCodeValue">{myclass.code}</p>
              <CopyButton value={myclass.code}>
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
              paginationPageSizeSelector={[10, 20, 50, 100]}
              defaultColDef={{ resizable: true, sortable: true, filter: true }}
              {...tablePrefs}
            />
          </div>
        )}
      </section>
    </div>
  );
}
