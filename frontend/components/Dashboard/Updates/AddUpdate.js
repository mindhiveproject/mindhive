import { useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import useForm from "../../../lib/useForm";

import UpdateForm from "./UpdateForm";

import { CREATE_UPDATE } from "../../Mutations/Update";
import { GET_UPDATES } from "../../Queries/Update";

import useEmail from "../../../lib/useEmail";

export default function AddUpdate({ user }) {
  const router = useRouter();
  const { sendEmail } = useEmail();

  const { inputs, handleChange, clearForm } = useForm({
    title: "",
    description: "",
    link: "",
    members: [],
    sendEmail: false,
  });

  const [sendUpdate, { data, loading, error }] = useMutation(CREATE_UPDATE, {
    variables: {
      updateArea: "PLATFORM",
      link: inputs?.link,
      content: {
        title: inputs?.title,
        message: inputs?.description,
      },
    },
    refetchQueries: [
      { query: GET_UPDATES, variables: { updateArea: "PLATFORM" } },
    ],
  });

  async function handleSave(e) {
    e.preventDefault();
    await inputs?.members?.map(async (userId) => {
      await sendUpdate({
        variables: {
          userId,
        },
      });
      if (inputs?.sendEmail) {
        await sendEmail({
          receiverId: userId,
          title: inputs?.title,
          message: inputs?.description,
          link: inputs?.link,
        });
      }
    });
    router.push({
      pathname: "/dashboard/updates",
    });
  }

  return (
    <div>
      <UpdateForm inputs={inputs} handleChange={handleChange} creationMode />
      <button onClick={handleSave}>Save</button>
    </div>
  );
}
