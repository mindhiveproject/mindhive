import { Dropdown } from "semantic-ui-react";
import { useQuery, useMutation } from "@apollo/client";
import useForm from "../../../../lib/useForm";

import { GET_PROFILE } from "../../../Queries/User";
import { UPDATE_PROFILE } from "../../../Mutations/User";
import { GET_TAGS } from "../../../Queries/Tag";

export default function InterestSelector({ user }) {
  const { inputs, handleChange } = useForm({
    interests: user?.interests || [],
  });

  const { data, loading, error } = useQuery(GET_TAGS);
  const tags = data?.tags || [];
  const tagValues = tags.map((tag) => ({
    key: tag.id,
    text: tag.title,
    value: tag.id,
  }));

  const [updateProfile, { data: updateProfileData }] = useMutation(
    UPDATE_PROFILE,
    {
      variables: {
        id: user?.id,
        input: {
          interests:
            user?.interests && user?.interests.length
              ? {
                  set: inputs?.interests,
                }
              : {
                  connect: inputs?.interests,
                },
        },
      },
      refetchQueries: [{ query: GET_PROFILE }],
    }
  );

  const handleTagsUpdate = (value) => {
    handleChange({
      target: { name: "interests", value: value.map((tag) => ({ id: tag })) },
    });
  };

  return (
    <div>
      <h2>Search interests</h2>
      <Dropdown
        placeholder="Begin typing to search for interests"
        fluid
        multiple
        search
        selection
        options={tagValues}
        onChange={(e, data) => handleTagsUpdate(data.value)}
        value={inputs?.interests.map((tag) => tag?.id) || []}
      />
      <h2>Suggested interests</h2>
      <button onClick={async () => await updateProfile()}>Save changes</button>
    </div>
  );
}
