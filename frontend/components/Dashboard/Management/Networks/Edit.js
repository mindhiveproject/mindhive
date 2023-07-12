import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useRouter } from "next/router";

import NetworkForm from "./Form";

import { GET_NETWORK } from "../../../Queries/ClassNetwork";
import { UPDATE_NETWORK } from "../../../Mutations/ClassNetwork";
import useForm from "../../../../lib/useForm";

export default function EditNetwork({ user, id }) {
  const router = useRouter();
  const { data, loading, error } = useQuery(GET_NETWORK, { variables: { id } });
  const network = data?.classNetwork || {};

  const { inputs, handleChange } = useForm({
    ...network,
  });

  const [
    updateNetwork,
    { data: updateData, loading: updateLoading, error: updateError },
  ] = useMutation(UPDATE_NETWORK, {
    variables: inputs,
    refetchQueries: [{ query: GET_NETWORK, variables: { id } }],
  });

  async function handleSave(e) {
    e.preventDefault();
    await updateNetwork({
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
      <NetworkForm inputs={inputs} handleChange={handleChange} />
      <button onClick={handleSave}>Save</button>
    </div>
  );
}
