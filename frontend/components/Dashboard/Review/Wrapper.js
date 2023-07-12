import { useQuery } from "@apollo/client";
import { GET_USER_CLASSES } from "../../Queries/User";

import Link from "next/link";

import Featured from "./Proposals/Featured";
import MyStudies from "./Proposals/MyStudies";
import ClassProposals from "./Proposals/ClassProposals";

export default function Wrapper({ user, page }) {
  // get all classes of a particular user (including classes from the class network)
  const { data, loading, error } = useQuery(GET_USER_CLASSES);
  const us = data?.authenticatedItem || {
    studentIn: [],
    teacherIn: [],
    mentorIn: [],
  };
  const myClasses = [...us?.studentIn, ...us?.teacherIn, ...us?.mentorIn] || [];
  const networkClasses =
    myClasses
      .map((myClass) => {
        if (myClass?.network) {
          return myClass?.network?.map((net) => net.classes).flat();
        }
        return [];
      })
      .flat() || [];
  const allClasses = [...myClasses, ...networkClasses];
  const allClassIds = allClasses.map((theclass) => theclass.id);
  const allUniqueClassIds = [...new Set([...allClassIds])];
  const allUniqueClasses = allUniqueClassIds.map((id) => ({
    id,
    title: allClasses.filter((c) => c.id === id).map((c) => c.title)[0],
    code: allClasses.filter((c) => c.id === id).map((c) => c.code)[0],
  }));

  return (
    <div>
      <h1>Review studies</h1>
      <div>
        <div className="navigationMenu">
          <Link
            href={{
              pathname: `/dashboard/review/featured`,
            }}
            className={
              page === "featured"
                ? "navigationTitle selectedMenuTitle"
                : "navigationTitle"
            }
          >
            <p>Featured studies</p>
          </Link>

          <Link
            href={{
              pathname: `/dashboard/review/my`,
            }}
            className={
              page === "my"
                ? "navigationTitle selectedMenuTitle"
                : "navigationTitle"
            }
          >
            <p>My studies</p>
          </Link>

          {allUniqueClasses.map(({ id, title, code }) => (
            <Link
              key={id}
              href={{
                pathname: `/dashboard/review/${code}`,
              }}
              className={
                page === code
                  ? "navigationTitle selectedMenuTitle"
                  : "navigationTitle"
              }
            >
              <p>{title}</p>
            </Link>
          ))}
        </div>

        {page === "featured" && <Featured />}
        {page === "my" && <MyStudies user={user} />}

        {allUniqueClasses.map((c) => c.code).includes(page) && (
          <ClassProposals code={page} />
        )}
      </div>
    </div>
  );
}
