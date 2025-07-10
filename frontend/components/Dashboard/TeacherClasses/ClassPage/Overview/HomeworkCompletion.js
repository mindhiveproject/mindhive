import Link from "next/link";
import { useQuery } from "@apollo/client";
import { useState } from "react";
import useTranslation from "next-translate/useTranslation";
import { GET_STUDENTS_DATA } from "../../../../Queries/Classes";

// Mandatory CSS required by the Data Grid
import "ag-grid-community/styles/ag-grid.css";
// Optional Theme applied to the Data Grid
import "ag-grid-community/styles/ag-theme-quartz.css";
// React Data Grid Component
import { AgGridReact } from "ag-grid-react";

export default function HomeworkCompletion({
  myclass,
  user,
  query,
  assignments,
}) {
  const { t } = useTranslation("classes");
  const assignmentsPublic = assignments.filter((a) => a?.public);

  const { data, loading, error } = useQuery(GET_STUDENTS_DATA, {
    variables: { classId: myclass?.id },
  });

  const students = data?.profiles || [];
  const studentsProcessed = students.map((student) => {
    const studentAssignments = assignmentsPublic.map((a) => {
      const statuses = student?.authorOfHomework
        .filter((homework) => homework?.assignment?.id === a?.id)
        .map((homework) => homework?.settings?.status);
      const [status] = statuses;
      return {
        [a.title]: status,
      };
    });

    const studentAssignmentsObject = studentAssignments.reduce((acc, item) => {
      return { ...acc, ...item };
    }, {});

    return {
      username: student?.username,
      firstName: student?.firstName,
      lastName: student?.lastName,
      ...studentAssignmentsObject,
    };
  });

  const [colDefs, setColDefs] = useState([
    { field: "username" },
    { field: "firstName" },
    { field: "lastName" },
    ...assignmentsPublic.map((a) => ({ field: a?.title })),
  ]);

  return (
    <div className="selector">
      <div className="head">
        <Link
          href={{
            pathname: `/dashboard/myclasses/${myclass?.code}`,
            query: {
              page: "assignments",
            },
          }}
        >
          <p>{t("assignment.goBack")}</p>
        </Link>
        <p></p>
      </div>

      <div
        className="ag-theme-quartz" // applying the Data Grid theme
        style={{ height: 500 }} // the Data Grid will fill the size of the parent container
      >
        <AgGridReact rowData={studentsProcessed} columnDefs={colDefs} />
      </div>
    </div>
  );
}
