import useForm from "../../../../../lib/useForm";
import UpdateAvatarModal from "../../../../Account/AvatarEditor/AvatarModal";
import { Dropdown, Divider } from "semantic-ui-react";
import { useMutation } from "@apollo/client";

import { GET_PROFILE } from "../../../../Queries/User";
import { UPDATE_PROFILE } from "../../../../Mutations/User";

import { StyledInput } from "../../../../styles/StyledForm";

export default function BasicInformation({ query, user }) {
  const { inputs, handleChange } = useForm({
    firstName: user?.firstName,
    lastName: user?.lastName,
    email: user?.email,
    pronouns: user?.pronouns,
    location: user?.location,
    profileType: query?.type || user?.profileType,
  });

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

      <StyledInput method="POST" onSubmit={handleSubmit}>
        <div className="inputLineBlock">
          <div className="twoColumnsInput">
            <div>
              <h3>First name</h3>
              <input
                type="text"
                name="firstName"
                autoComplete="firstName"
                value={inputs?.firstName}
                onChange={handleChange}
              />
            </div>
            <div>
              <h3>Last name</h3>
              <input
                type="text"
                name="lastName"
                autoComplete="lastName"
                value={inputs?.lastName}
                onChange={handleChange}
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
            onChange={handleChange}
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
                  handleChange({
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
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div className="saveButtonBlock">
          <button type="submit">Save changes</button>
        </div>
      </StyledInput>
    </div>
  );
}
