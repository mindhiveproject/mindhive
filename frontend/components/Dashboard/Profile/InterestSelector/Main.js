import Link from "next/link";
import { Dropdown } from "semantic-ui-react";
import { useQuery, useMutation } from "@apollo/client";
import useForm from "../../../../lib/useForm";
import { useRouter } from "next/dist/client/router";

import { GET_PROFILE } from "../../../Queries/User";
import { UPDATE_PROFILE } from "../../../Mutations/User";
import { GET_TAGS } from "../../../Queries/Tag";

export default function InterestSelector({ user }) {
  const router = useRouter();
  const { inputs, handleChange } = useForm({
    interests: user?.interests.map((i) => ({ id: i?.id })) || [],
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

  const addInterest = ({ tag }) => {
    const selectedInterests =
      inputs?.interests.map((i) => {
        return {
          id: i?.id,
        };
      }) || [];
    if (!selectedInterests.map((interest) => interest?.id).includes(tag?.id)) {
      const updatedInterests = [...selectedInterests, { id: tag?.id }] || [];
      handleChange({
        target: { name: "interests", value: updatedInterests },
      });
    }
  };

  const complete = async () => {
    await updateProfile();
    router.push({
      pathname: "/dashboard",
    });
  };

  return (
    <div className="interestsSelector">
      <div>
        <div className="titleIcon">
          <h2>Search interests</h2>
          <div>Min 3, Max 10</div>
        </div>

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
      </div>

      {tags.length && (
        <div>
          <h2>Suggested interests</h2>
          <div className="suggestedInterests">
            {tags
              .filter(
                (tag) =>
                  !inputs?.interests.map((tag) => tag?.id).includes(tag?.id)
              )
              .sort((a, b) => {
                // Convert titles to lowercase to ensure case-insensitive sorting
                const titleA = a.title.toLowerCase();
                const titleB = b.title.toLowerCase();

                if (titleA < titleB) {
                  return -1; // a comes before b
                }
                if (titleA > titleB) {
                  return 1; // a comes after b
                }
                return 0; // a and b are equal
              })
              .map((tag) => (
                <div className="interest">
                  <div>{tag.title}</div>
                  <img
                    src="/assets/icons/add.svg"
                    alt="add"
                    onClick={() => addInterest({ tag })}
                  />
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="navButtons">
        <Link
          href={{
            pathname: `/dashboard/profile/edit`,
            query: {
              page: "about",
            },
          }}
        >
          <button className="secondary">Previous</button>
        </Link>
        <button onClick={complete}>Complete</button>
      </div>
    </div>
  );
}
