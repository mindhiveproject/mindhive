import { useState } from "react";
import { useMutation } from "@apollo/client";
import { useRouter } from "next/router";

import NetworkForm from "./Form";

import { GET_ALL_NETWORKS } from "../../../Queries/ClassNetwork";
import { CREATE_NETWORK } from "../../../Mutations/ClassNetwork";

import useForm from "../../../../lib/useForm";

export default function AddNetwork({}) {
  const router = useRouter();

  const { inputs, handleChange } = useForm({ classes: [] });

  const [
    createNetwork,
    { data: createData, loading: createLoading, error: createError },
  ] = useMutation(CREATE_NETWORK, {
    variables: inputs,
    refetchQueries: [{ query: GET_ALL_NETWORKS }],
  });

  async function handleSave(e) {
    e.preventDefault();
    await createNetwork({
      variables: {
        classes: inputs.classes.map((cl) => ({
          id: cl?.id,
        })),
      },
    });
    router.push({
      pathname: `/dashboard/management/networks`,
    });
  }

  return (
    <div>
      <h3>Add a class network</h3>
      <NetworkForm inputs={inputs} handleChange={handleChange} />
      <button onClick={handleSave}>Save</button>
    </div>
  );
}
