import { useState } from "react";
import Link from "next/link";
import { Divider } from "semantic-ui-react";
import { useMutation, useQuery } from "@apollo/client";
import useForm from "../../../lib/useForm";
import useTranslation from "next-translate/useTranslation";

import { CURRENT_USER_QUERY } from "../../Queries/User";
import { UPDATE_USER } from "../../Mutations/User";
import { StyledInput } from "../../styles/StyledForm";
import { StyledSimpleSaveButton } from "../../styles/StyledProfile";
import LanguageSelector from "../../LanguageSelector";

export default function Languages({ query }) {
  const [changed, setChanged] = useState(false);
  const { t } = useTranslation("common");
  
  // Fetch current user data
  const { data } = useQuery(CURRENT_USER_QUERY);
  const user = data?.authenticatedItem;

  const { inputs, handleChange, clearForm } = useForm({ ...user });
  const [updateProfile, { data: mutationData, loading, error }] = useMutation(UPDATE_USER, {
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
      <h1>{t("languages.title")}</h1>
      <h3>{t("languages.description")}</h3>
      <Divider />

      <div className="content">
        <div className="p24-thin">{t("languages.displayLanguage")}</div>
        <div>
          <LanguageSelector
            handleChange={handleUpdate}
            value={inputs?.language}
          />
        </div>

        <div className="buttons">
          <StyledSimpleSaveButton changed={changed}>
            <button onClick={handleSave}>{t("languages.updatePreferences")}</button>
          </StyledSimpleSaveButton>

          <Link
            href={{
              pathname: `/dashboard/settings`,
            }}
          >
            <button className="back">{t("languages.backToSettings")}</button>
          </Link>
        </div>
      </div>
    </StyledInput>
  );
}
