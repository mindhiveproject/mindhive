import { useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";

import { customAlphabet } from "nanoid";
const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 7);

import useForm from "../../../lib/useForm";
import DisplayError from "../../ErrorMessage";

import { StyledForm } from "../../styles/StyledForm";
import ConsentForm from "./ConsentForm";

import { CREATE_CONSENT } from "../../Mutations/Consent";
import { GET_MY_CONSENTS } from "../../Queries/Consent";

export default function AddClass({ user }) {
  const router = useRouter();
  const { t } = useTranslation("classes");
  const { inputs, handleChange, clearForm } = useForm({
    title: "",
    description: "",
    info: [
      {
        name: "regularAdults",
        description: "The consent form for regular adult participants",
      },
      {
        name: "regularMinors",
        description:
          "The consent form for parents of regular participants under 18",
      },
      {
        name: "regularMinorsKids",
        description: "The consent form for regular participants under 18",
      },
      {
        name: "sonaAdults",
        description: "The consent form for SONA adult participants",
      },
      {
        name: "sonaMinors",
        description:
          "The consent form for parents of SONA participants under 18",
      },
      {
        name: "sonaMinorsKids",
        description: "The consent form for SONA participants under 18",
      },
      {
        name: "studentsNYC",
        description:
          "The consent form for adult students in a public school in NYC",
      },
      {
        name: "studentsParentsNYC",
        description:
          "The consent form for parents of students in a public school in NYC under 18",
      },
      {
        name: "studentsMinorsNYC",
        description:
          "The consent form for students in a public school in NYC under 18",
      },
    ],
  });

  console.log({ inputs });

  const [createConsent, { data, loading, error }] = useMutation(
    CREATE_CONSENT,
    {
      refetchQueries: [
        { query: GET_MY_CONSENTS, variables: { userId: user?.id } },
      ],
    }
  );

  async function handleSubmit(e) {
    e.preventDefault();
    await createConsent({
      variables: {
        input: {
          ...inputs,
          collaborators: inputs?.collaborators?.length ? 
            inputs?.collaborators?.map((col) => ({ id: col?.id })) :
            null,
        }
      },
    });
    router.push({
      pathname: "/dashboard/irb",
    });
  }

  return (
    <ConsentForm
      inputs={inputs}
      handleChange={handleChange}
      handleSubmit={handleSubmit}
      headerName="Add new IRB protocol"
      submitBtnName={t("common.create")}
      loading={loading}
      error={error}
    />
  );
}
