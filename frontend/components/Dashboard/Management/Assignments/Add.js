import { useState } from "react";
import { useMutation } from "@apollo/client";
import { useRouter } from "next/router";

import NetworkForm from "./Form";

import { GET_TEMPLATE_ASSIGNMENTS } from "../../../Queries/Assignment";
import { CREATE_ASSIGNMENT } from "../../../Mutations/Assignment";

import useForm from "../../../../lib/useForm";

export default function AddNetwork({}) {
  const router = useRouter();

  const { inputs, handleChange } = useForm({ title: "" });

  const [
    createAssignment,
    { data: createData, loading: createLoading, error: createError },
  ] = useMutation(CREATE_ASSIGNMENT, {
    variables: { input: { 
      ...inputs,
      isTemplate: true, 
    } },
    refetchQueries: [{ query: GET_TEMPLATE_ASSIGNMENTS }],
  });

  async function handleSave(e) {
    e.preventDefault();
    await createAssignment({
      variables: {},
    });
    router.push({
      pathname: `/dashboard/management/assignments`,
    });
  }

  return (
    <div>
      <NetworkForm inputs={inputs} handleChange={handleChange} />
      <button onClick={handleSave}>Save</button>
    </div>
  );
}
