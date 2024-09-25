import useForm from "../../../../../lib/useForm";
import UpdateAvatarModal from "../../../../Account/AvatarEditor/AvatarModal";
import { Dropdown, Divider } from "semantic-ui-react";
import { useMutation } from "@apollo/client";

import { GET_PROFILE } from "../../../../Queries/User";
import { UPDATE_PROFILE } from "../../../../Mutations/User";

import { StyledInput } from "../../../../styles/StyledForm";
import { StyledSaveButton } from "../../../../styles/StyledProfile";
import { useState } from "react";

export default function BasicInformation({ query, user }) {
  const [changed, setChanged] = useState(false);

  const { inputs, handleChange } = useForm({
    firstName: user?.firstName,
    lastName: user?.lastName,
    email: user?.email,
    pronouns: user?.pronouns,
    location: user?.location,
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
        <div className="title">Basic Information</div>
        <p>
          Your basic information helps the MindHive community get to know you
          better. It includes who you are, where you’re located, and what you
          look like.
        </p>
      </div>
      <Divider />
      <h3>Profile photo</h3>
      <div>
        {user?.image?.image?.publicUrlTransformed ? (
          <img
            src={user?.image?.image?.publicUrlTransformed}
            alt={user?.name}
          />
        ) : (
          <div>{/* <IdentIcon size="120" value={user?.name} /> */}</div>
        )}
        <UpdateAvatarModal user={user} />
      </div>

      <StyledInput>
        <div className="inputLineBlock">
          <div className="twoColumnsInput">
            <div>
              <h3>First name</h3>
              <input
                type="text"
                name="firstName"
                autoComplete="firstName"
                value={inputs?.firstName}
                onChange={handleUpdate}
              />
            </div>
            <div>
              <h3>Last name</h3>
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
          <h3>Email</h3>
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
              <h3>Preferred pronouns</h3>
              <Dropdown
                fluid
                selection
                options={[
                  {
                    key: "she",
                    text: "she/her/hers",
                    value: "she",
                  },
                  {
                    key: "he",
                    text: "he/him/his",
                    value: "he",
                  },
                  {
                    key: "they",
                    text: "they/them/theirs",
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
              <h3>Location</h3>
              <input
                type="text"
                name="location"
                value={inputs?.location || ""}
                onChange={handleUpdate}
              />
            </div>
          </div>
        </div>

        <StyledSaveButton changed={changed}>
          <button onClick={handleSubmit} disabled={!changed}>
            Save changes
          </button>
        </StyledSaveButton>
      </StyledInput>
    </div>
  );
}
