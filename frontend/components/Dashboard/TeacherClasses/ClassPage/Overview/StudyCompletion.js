import Link from "next/link";
import { useQuery } from "@apollo/client";
import { useState } from "react";
import { GET_STUDENTS_DATA } from "../../../../Queries/Classes";

// Mandatory CSS required by the Data Grid
import "ag-grid-community/styles/ag-grid.css";
// Optional Theme applied to the Data Grid
import "ag-grid-community/styles/ag-theme-quartz.css";
// React Data Grid Component
import { AgGridReact } from "ag-grid-react";

export default function StudyCompletionOverview({ myclass, user, query }) {
  const { data, loading, error } = useQuery(GET_STUDENTS_DATA, {
    variables: { classId: myclass?.id },
  });
  const students = data?.profiles || [];

  // get all studies where students participated
  const studiesAll = students
    .map((student) =>
      student?.participantIn.map((study) => ({
        id: study?.id,
        title: study?.title,
        flow: study?.flow,
      }))
    )
    .flat();
  // get unique studies
  const studies = studiesAll.filter(
    (obj, index, self) => index === self.findIndex((t) => t.id === obj.id)
  );

  // re-structure the object with student information
  const studentsProcessed = students.map((student) => {
    const studentCompletions = studies.map((study) => {
      const { flow } = study;
      const path =
        (student?.studiesInfo &&
          student?.studiesInfo[study?.id] &&
          student?.studiesInfo[study?.id]?.info?.path) ||
        [];
      // filter tasks that have a completion timestamp
      const pathTasksCompleted =
        path.filter((c) => c?.type === "task" && !!c?.timestampFinished) || [];
      // count the number of completed tasks
      const numberCompleted = pathTasksCompleted.length;
      return {
        [study?.id]: numberCompleted,
      };
    });

    const studentCompletionsObject = studentCompletions.reduce((acc, item) => {
      return { ...acc, ...item };
    }, {});

    return {
      username: student?.username,
      firstName: student?.firstName,
      lastName: student?.lastName,
      ...studentCompletionsObject,
    };
  });

  const [colDefs, setColDefs] = useState([
    { field: "username" },
    { field: "firstName" },
    { field: "lastName" },
    ...studies.map((a) => ({ field: a?.id, headerName: a?.title })),
  ]);

  return (
    <div className="selector">
      <div className="head">
        <Link
          href={{
            pathname: `/dashboard/myclasses/${myclass?.code}`,
            query: {
              page: "students",
            },
          }}
        >
          <p>← Go back</p>
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
