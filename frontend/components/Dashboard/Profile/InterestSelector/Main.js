import Link from "next/link";
import { useMemo, useState } from "react";
import { Dropdown } from "semantic-ui-react";
import { useQuery, useMutation } from "@apollo/client";
import useForm from "../../../../lib/useForm";
import { useRouter } from "next/dist/client/router";
import useTranslation from "next-translate/useTranslation";

import { GET_PROFILE } from "../../../Queries/User";
import { UPDATE_PROFILE } from "../../../Mutations/User";
import { UPDATE_ORGANIZATION } from "../../../Mutations/Organization";
import { GET_TAGS } from "../../../Queries/Tag";
import {
  profileEditHref,
  resolveProfileType,
} from "../../../../lib/profileEditNavigation";
import {
  confirmLeaveIfDirty,
  useUnsavedChangesGuard,
} from "../../../../lib/useUnsavedChangesGuard";

function interestIdsKey(interests = []) {
  return interests
    .map((i) => i?.id)
    .filter(Boolean)
    .sort()
    .join(",");
}

export default function InterestSelector({ query, user }) {
  const { t } = useTranslation("connect");
  const router = useRouter();
  const profileType = resolveProfileType(query, user);
  const isOrganization = profileType === "organization";
  // For org-type profiles, the interests live on the Organization rather than
  // the Profile ("Where can your organization help?").
  const existingOrg = (user?.organizations || [])[0];
  const sourceInterests = isOrganization
    ? existingOrg?.interests || []
    : user?.interests || [];

  const initialInterestIds = useMemo(
    () => interestIdsKey(sourceInterests),
    [sourceInterests],
  );

  const [syncFrozen, setSyncFrozen] = useState(false);

  const { inputs, handleChange: baseHandleChange } = useForm(
    {
      interests: sourceInterests.map((i) => ({ id: i?.id })),
    },
    { freezeInitialSync: syncFrozen },
  );

  const changed = interestIdsKey(inputs?.interests) !== initialInterestIds;

  const handleChange = (e) => {
    baseHandleChange(e);
    setSyncFrozen(true);
  };

  useUnsavedChangesGuard(changed);

  const { data, loading, error } = useQuery(GET_TAGS);
  const tags = data?.tags || [];
  const tagValues = tags.map((tag) => ({
    key: tag.id,
    text: tag.title,
    value: tag.id,
  }));

  const [updateProfile] = useMutation(UPDATE_PROFILE, {
    refetchQueries: [{ query: GET_PROFILE }],
  });
  const [updateOrganization] = useMutation(UPDATE_ORGANIZATION, {
    refetchQueries: [{ query: GET_PROFILE }],
  });

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

  const tryToLeave = (e) => {
    if (
      changed &&
      !confirmLeaveIfDirty(
        t("createProfileFlow.unsavedChangesWarning", {}, {
          default:
            "Your unsaved changes will be lost. Click Cancel to return and save your changes.",
        }),
      )
    ) {
      e.preventDefault();
    }
  };

  const complete = async () => {
    try {
      if (isOrganization && existingOrg?.id) {
        // Use `set` so the org's interests are replaced with the current
        // selection (handles both adds and removes).
        await updateOrganization({
          variables: {
            id: existingOrg.id,
            input: { interests: { set: inputs?.interests } },
          },
        });
      } else if (!isOrganization) {
        await updateProfile({
          variables: {
            id: user?.id,
            input: {
              interests:
                user?.interests && user?.interests.length
                  ? { set: inputs?.interests }
                  : { connect: inputs?.interests },
            },
          },
        });
      }
      router.push({
        pathname: "/dashboard",
      });
    } catch {
      alert(
        t("createProfileFlow.saveError", {}, {
          default: "Something went wrong while saving. Please try again.",
        }),
      );
    }
  };

  return (
    <div className="interestsSelector">
      <div>
        <div className="titleIcon">
          <h2>{t("interestSelector.searchTitle")}</h2>
          <div>{t("interestSelector.minMax")}</div>
        </div>

        <Dropdown
          placeholder={t("interestSelector.placeholder")}
          fluid
          multiple
          search
          selection
          options={tagValues}
          onChange={(e, data) => handleTagsUpdate(data.value)}
          value={inputs?.interests.map((tag) => tag?.id) || []}
        />
      </div>

      {tags.length ? (
        <div>
          <h2>{t("interestSelector.suggestedTitle")}</h2>
          <div className="suggestedInterests">
            {tags
              .filter(
                (tag) =>
                  !inputs?.interests.map((tag) => tag?.id).includes(tag?.id)
              )
              .sort((a, b) => {
                const titleA = a.title.toLowerCase();
                const titleB = b.title.toLowerCase();

                if (titleA < titleB) {
                  return -1;
                }
                if (titleA > titleB) {
                  return 1;
                }
                return 0;
              })
              .map((tag) => (
                <div className="interest">
                  <div>{tag.title}</div>
                  <img
                    src="/assets/icons/add.svg"
                    alt={t("interestSelector.add")}
                    onClick={() => addInterest({ tag })}
                  />
                </div>
              ))}
          </div>
        </div>
      ) : (
        <></>
      )}

      <div className="navButtons">
        <Link
          href={profileEditHref({ page: "about", type: profileType })}
          onClick={tryToLeave}
        >
          <button className="secondary">{t("interestSelector.navButtons.previous")}</button>
        </Link>
        <button onClick={complete}>{t("interestSelector.navButtons.complete")}</button>
      </div>
    </div>
  );
}
