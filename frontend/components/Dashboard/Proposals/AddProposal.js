import Link from "next/link";
import { useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";

import useForm from "../../../lib/useForm";

import ProposalForm from "./ProposalForm";

import { CREATE_NEW_PROPOSAL } from "../../Mutations/Proposal";
import { GET_MY_PROPOSALS } from "../../Queries/Proposal";

export default function AddProposal({ user }) {
  const router = useRouter();
  const { t } = useTranslation("classes");
  const { inputs, handleChange, clearForm } = useForm({
    title: "",
    description: "",
    creatorId: user?.id,
  });

  const [createProposal, { data, loading, error }] = useMutation(
    CREATE_NEW_PROPOSAL,
    {
      variables: inputs,
      refetchQueries: [
        { query: GET_MY_PROPOSALS, variables: { creatorId: user?.id } },
      ],
    }
  );

  async function handleSave(e) {
    e.preventDefault();
    await createProposal();
    router.push({
      pathname: "/dashboard/proposals",
    });
  }

  return (
    <div>
      <div className="goBackBtn">
        <Link href="/dashboard/proposals">
          <span style={{ cursor: "pointer" }}>← Back</span>
        </Link>
      </div>
      <h1>New proposal template</h1>
      <ProposalForm inputs={inputs} handleChange={handleChange} />
      <button onClick={handleSave}>Save</button>
    </div>
  );
}
