import useForm from "../../../../../lib/useForm";
import UpdateAvatarModal from "../../../../Account/AvatarEditor/AvatarModal";
import IdentIcon from "../../../../Account/IdentIcon";
import { Dropdown, Divider } from "semantic-ui-react";
import { useMutation } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import { GET_PROFILE } from "../../../../Queries/User";
import { UPDATE_PROFILE } from "../../../../Mutations/User";

import { StyledInput } from "../../../../styles/StyledForm";
import { StyledSaveButton } from "../../../../styles/StyledProfile";
import { useState } from "react";

export default function BasicInformation({ query, user }) {
  const { t } = useTranslation("connect");
  const [changed, setChanged] = useState(false);

  const { inputs, handleChange } = useForm({
    firstName: user?.firstName,
    lastName: user?.lastName,
    email: user?.email,
    pronouns: user?.pronouns,
    location: user?.location,
    organization: user?.organization,
    tagline: user?.tagline,
    profileType: query?.type || user?.profileType,
  });

  const handleUpdate = (data) => {
    setChanged(true);
    handleChange(data);
  };

  const [updateProfile, { data, loading, error }] = useMutation(
    UPDATE_PROFILE,
    {
      variables: {
        id: user?.id,
        input: { ...inputs },
      },
      refetchQueries: [{ query: GET_PROFILE }],
    }
  );

  async function handleSubmit(e) {
    e.preventDefault();
    await updateProfile();
    setChanged(false);
  }

  return (
    <div className="profileBlock">
      <div>
        <p>{t("basic.description")}</p>
        <div className="title">{t("basic.title")}</div>
        <p>{t("basic.subtitle")}</p>
      </div>
      <Divider />
      <h3>{t("basic.profilePhoto")}</h3>
      <div>
        {user?.image?.image?.publicUrlTransformed ? (
          <div
            style={{
              borderRadius: "50%",
              width: "128px",
              height: "128px",
              padding: "3px",
              background:
                "conic-gradient(from 180deg, #39B7D4 0%, #FDBA32 20%, #ED6B59 45%, #7C66C2 65%, #4183C4 85%, #5E8C9A 100%)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              src={user?.image?.image?.publicUrlTransformed}
              alt={user?.name}
              style={{
                borderRadius: "50%",
                width: "120px",
                height: "120px",
                objectFit: "cover",
                objectPosition: "center",
                border: "none",
              }}
            />
          </div>
        ) : (
          <div>
            <IdentIcon size="120" value={user?.name} />
          </div>
        )}
        <UpdateAvatarModal user={user} />
      </div>

      <StyledInput>
        <div className="inputLineBlock">
          <div className="twoColumnsInput">
            <div>
              <h3>{t("basic.firstName")}</h3>
              <input
                type="text"
                name="firstName"
                autoComplete="firstName"
                value={inputs?.firstName}
                onChange={handleUpdate}
              />
            </div>
            <div>
              <h3>{t("basic.lastName")}</h3>
              <input
                type="text"
                name="lastName"
                autoComplete="lastName"
                value={inputs?.lastName}
                onChange={handleUpdate}
              />
            </div>
          </div>
        </div>
        <div className="inputLineBlock">
          <h3>{t("basic.email")}</h3>
          <input
            type="email"
            name="email"
            autoComplete="email"
            value={inputs?.email}
            onChange={handleUpdate}
            required
          />
        </div>
        <div className="inputLineBlock">
          <div className="twoColumnsInput">
            <div>
              <h3>{t("basic.pronouns")}</h3>
              <Dropdown
                fluid
                selection
                options={[
                  {
                    key: "she",
                    text: t("basic.pronounsOptions.she"),
                    value: "she",
                  },
                  {
                    key: "he",
                    text: t("basic.pronounsOptions.he"),
                    value: "he",
                  },
                  {
                    key: "they",
                    text: t("basic.pronounsOptions.they"),
                    value: "they",
                  },
                ]}
                onChange={(event, data) => {
                  handleUpdate({
                    target: { name: "pronouns", value: data.value },
                  });
                }}
                value={inputs?.pronouns}
                className="createdByDropdown"
              />
            </div>

            <div>
              <h3>{t("basic.location")}</h3>
              <input
                type="text"
                name="location"
                value={inputs?.location || ""}
                onChange={handleUpdate}
              />
            </div>
          </div>

          <div className="inputLineBlock">
            <h3>{t("basic.organization")}</h3>
            <input
              type="text"
              name="organization"
              value={inputs?.organization}
              onChange={handleUpdate}
              required
            />
          </div>

          <div className="inputLineBlock">
            <h3>{t("basic.tagline")}</h3>
            <input
              type="text"
              name="tagline"
              value={inputs?.tagline}
              onChange={handleUpdate}
              required
            />
          </div>
        </div>

        <StyledSaveButton changed={changed}>
          <button onClick={handleSubmit} disabled={!changed}>
            {t("basic.saveChanges")}
          </button>
        </StyledSaveButton>
      </StyledInput>
    </div>
  );
}
