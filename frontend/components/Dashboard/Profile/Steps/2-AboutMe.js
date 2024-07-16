import { useMutation } from "@apollo/client";
import useForm from "../../../../lib/useForm";

import UpdateAvatarModal from "../../../Account/AvatarEditor/AvatarModal";

import { GET_PROFILE } from "../../../Queries/User";
import { UPDATE_PROFILE } from "../../../Mutations/User";

import { StyledForm } from "../../../styles/StyledForm";

export default function About({ query, user }) {
  const { inputs, handleChange } = useForm({
    firstName: user?.firstName,
    lastName: user?.lastName,
    email: user?.email,
    bio: user?.bio,
    profileType: query?.type,
  });

  console.log({ inputs });

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
    <div>
      <div>About me</div>
      <label>Profile photo</label>
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

      <StyledForm method="POST" onSubmit={handleSubmit}>
        <label htmlFor="firstName">
          First name
          <input
            type="firstName"
            name="firstName"
            autoComplete="firstName"
            value={inputs?.firstName}
            onChange={handleChange}
          />
        </label>

        <label htmlFor="firstName">
          Last name
          <input
            type="lastName"
            name="lastName"
            autoComplete="lastName"
            value={inputs?.lastName}
            onChange={handleChange}
          />
        </label>

        <label htmlFor="email">
          Email
          <input
            type="email"
            name="email"
            autoComplete="email"
            value={inputs?.email}
            onChange={handleChange}
            required
          />
        </label>

        <label htmlFor="pronouns">Preferred pronouns</label>

        <label htmlFor="location">
          Location
          <input
            type="name"
            name="location"
            value={inputs?.location || ""}
            onChange={handleChange}
          />
        </label>

        {/* <label htmlFor="bio">
          Bio
          <textarea
            id="bio"
            rows="5"
            name="bio"
            placeholder="I'm ... "
            value={inputs?.bio || ""}
            onChange={handleChange}
          />
        </label> */}
        <button type="submit">Save changes</button>
      </StyledForm>
    </div>
  );
}
