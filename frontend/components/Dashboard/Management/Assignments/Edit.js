import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useRouter } from "next/router";

import AssignmentForm from "./Form";

import { GET_TEMPLATE_ASSIGNMENT, GET_TEMPLATE_ASSIGNMENTS } from "../../../Queries/Assignment";
import { EDIT_ASSIGNMENT } from "../../../Mutations/Assignment";

import useForm from "../../../../lib/useForm";
import Button from "../../../DesignSystem/Button";
import useTranslation from "next-translate/useTranslation";

export default function EditAssignment({ user, id }) {
  const router = useRouter();
  const { t } = useTranslation("dashboard");
  const { data, loading, error } = useQuery(GET_TEMPLATE_ASSIGNMENT, { variables: { id } });
  const assignment = data?.assignment || { title: ""};

  const { inputs, handleChange } = useForm({
    title: assignment?.title,
    content: assignment?.content,
    placeholder: assignment?.placeholder,
  });

  const [
    updateAssignment,
    { data: updateData, loading: updateLoading, error: updateError },
  ] = useMutation(EDIT_ASSIGNMENT, {
    variables: { 
      id: id,
      input: { ...inputs } 
    },
    refetchQueries: [
      { query: GET_TEMPLATE_ASSIGNMENT, variables: { id } },
      { query: GET_TEMPLATE_ASSIGNMENTS },
    ],
  });

  async function handleSave(e) {
    e.preventDefault();
    await updateAssignment({
      variables: {},
    });
    router.push({
      pathname: `/dashboard/management/assignments`,
    });
  }

  return (
    <div>
      <AssignmentForm inputs={inputs} handleChange={handleChange} />
      <Button variant="filled" type="button" onClick={handleSave}>
        {t("management.save", {}, { default: "Save" })}
      </Button>
    </div>
  );
}
