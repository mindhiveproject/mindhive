// get all proposals of the featured studies, and all proposals of the studies in the class network
import { useQuery } from "@apollo/client";
import { STUDIES_TO_REVIEW } from "../../../Queries/Study";
import { GET_USER_CLASSES } from "../../../Queries/User";

import Board from "./Board";

export default function Overview({}) {
  // get all classes of a particular user (including classes from the class network)
  const { data: classesData } = useQuery(GET_USER_CLASSES);
  const us = classesData?.authenticatedItem || {
    studentIn: [],
    teacherIn: [],
    mentorIn: [],
  };
  const myClasses = [...us?.studentIn, ...us?.teacherIn, ...us?.mentorIn] || [];

  const networkClasses =
    myClasses
      .map((myClass) => {
        if (myClass?.networks) {
          return myClass?.networks?.map((net) => net.classes).flat();
        }
        return [];
      })
      .flat() || [];
  const allClasses = [...myClasses, ...networkClasses];
  const allClassIds = allClasses.map((theclass) => theclass.id);
  const allUniqueClassIds = [...new Set([...allClassIds])];

  const { data, loading, error } = useQuery(STUDIES_TO_REVIEW, {
    variables: {
      classIds: allUniqueClassIds,
    },
  });

  const studies = data?.studies || [];

  return (
    <div className="overview">
      <div className="h40">Feedback Center</div>
      <div className="h24">
        Whether you're starting your study or collecting participants, use this
        page to give feedback to your fellow peers on their proposals and
        finalized studies
      </div>
      <Board studies={studies} myClassesIds={myClasses.map((cl) => cl?.id)} />
    </div>
  );
}
