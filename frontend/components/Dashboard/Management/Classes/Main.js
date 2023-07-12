import { useQuery } from "@apollo/client";
import moment from "moment";

import { GET_ALL_CLASSES } from "../../../Queries/Classes";

export default function Classes({}) {
  const { data, loading, error } = useQuery(GET_ALL_CLASSES);

  const classes = data?.classes || [];

  return (
    <div>
      <div className="classHeader">
        <div>Class name</div>
        <div>Teacher</div>
        <div>Number of students</div>
        <div>Date created</div>
      </div>

      {classes.map((myclass) => (
        <div className="classRow" key={myclass.id}>
          <div>{myclass?.title}</div>
          <div>{myclass?.creator?.username}</div>
          <div>{myclass?.students?.length}</div>
          <div>{moment(myclass?.createdAt).format("MMMM D, YYYY")}</div>
        </div>
      ))}
    </div>
  );
}
