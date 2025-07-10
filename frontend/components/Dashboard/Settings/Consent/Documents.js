import { useState } from "react";
import Link from "next/link";
import { Divider } from "semantic-ui-react";
import { useMutation } from "@apollo/client";
import useForm from "../../../../lib/useForm";
import useTranslation from "next-translate/useTranslation";

import { CURRENT_USER_QUERY } from "../../../Queries/User";
import { UPDATE_USER } from "../../../Mutations/User";
import { StyledInput } from "../../../styles/StyledForm";
import { StyledSimpleSaveButton } from "../../../styles/StyledProfile";

export default function Documents({ query, user }) {
  const { t } = useTranslation("common");
  const [changed, setChanged] = useState(false);

  const { inputs, handleChange, clearForm } = useForm({ ...user });
  const [updateProfile, { data, loading, error }] = useMutation(UPDATE_USER, {
    variables: inputs,
    refetchQueries: [{ query: CURRENT_USER_QUERY }],
  });

  const handleUpdate = (data) => {
    setChanged(true);
    handleChange(data);
  };

  async function handleSave(e) {
    e.preventDefault();
    await updateProfile();
    setChanged(false);
  }

  return (
    <StyledInput>
      <h1>{t("documents.title")}</h1>
      <h3>{t("documents.description")}</h3>
      <p>{t("documents.uploadNotice")}</p>
      <Divider />

      <div className="content">
        <div className="buttons">
          <Link
            href={{
              pathname: `/dashboard/settings/consent`,
            }}
          >
            <button className="back">{t("activity.backToConsent")}</button>
          </Link>
        </div>
      </div>
    </StyledInput>
  );
}
