import { useState } from "react";
import Link from "next/link";
import { Divider } from "semantic-ui-react";
import { useMutation, useQuery } from "@apollo/client";
import useForm from "../../../lib/useForm";
import useTranslation from "next-translate/useTranslation";

import { CURRENT_USER_QUERY } from "../../Queries/User";
import { UPDATE_USER } from "../../Mutations/User";
import { StyledInput } from "../../styles/StyledForm";
import Button from "../../DesignSystem/Button";
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
          <Button
            variant="filled"
            type="button"
            onClick={handleSave}
            disabled={!changed}
            style={{ width: "100%" }}
          >
            {t("languages.updatePreferences")}
          </Button>

          <Link
            href={{
              pathname: `/dashboard/settings`,
            }}
          >
            <Button variant="text" type="button" style={{ width: "100%" }}>
              {t("languages.backToSettings")}
            </Button>
          </Link>
        </div>
      </div>
    </StyledInput>
  );
}
