import { useMutation } from "@apollo/client";
import { DELETE_CLASS } from "../../../Mutations/Classes";
// import { GET_TEACHER_CLASSES } from "../../../Queries/Classes";

import { useRouter } from "next/router";

export default function Settings({ myclass, user }) {
  const router = useRouter();
  const [deleteClass, { loading }] = useMutation(DELETE_CLASS, {
    variables: { id: myclass?.id },
    // refetchQueries: [{ query: GET_TEACHER_CLASSES }],
  });

  return (
    <div className="settings">
      <h2>Delete your class</h2>
      <p>
        Deleting your class will permanently delete your class within the “My
        Classes” area. This action cannot be undone.
      </p>

      <div className="informationBlock">
        <div className="block">
          <p>You will not have access to:</p>
          <ul>
            <li>Your class</li>
            <li>
              Any studies or results generated from students in your class
            </li>
          </ul>
        </div>

        <div className="block">
          <p>Your students will have access to:</p>
          <ul>
            <li>
              Their workspace and any studies, tasks or surveys they created
              during your class
            </li>
            <li>Note: New students will not be able to join your class</li>
          </ul>
        </div>
      </div>

      <div>
        <button
          disabled={loading}
          onClick={() => {
            if (confirm("Are you sure you want to delete this class?")) {
              // delete it
              deleteClass().catch((err) => alert(err.message));
              router.push({
                pathname: "/dashboard/myclasses",
              });
            }
          }}
        >
          Delete class
        </button>
      </div>
    </div>
  );
}
