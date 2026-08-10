import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";

import DesignSystemButton from "../../../DesignSystem/Button";
import DropdownSelect from "../../../DesignSystem/DropdownSelect";
import { CREATE_ORGANIZATION } from "../../../Mutations/Organization";
import {
  CURRENT_USER_QUERY,
  GET_PROFILE,
  SPONSOR_ONBOARDING_STATE,
} from "../../../Queries/User";
import { GET_TAGS } from "../../../Queries/Tag";
import { manageOrganizationHref } from "../../../../lib/profileEditNavigation";

const MAX_LOGO_BYTES = 10 * 1024 * 1024;

const PRIMARY_DOMAIN_KEYS = [
  "academic",
  "government",
  "industry",
  "nonprofit",
  "other",
];

const Card = styled.section`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  text-align: left;

  ${({ $embedded }) =>
    !$embedded &&
    `
    padding: 24px;
    border-radius: 16px;
    background: var(--MH-Theme-Neutrals-White, #ffffff);
    box-shadow: 0px 4px 24px rgba(0, 0, 0, 0.05);
    max-width: 720px;
  `}

  h2 {
    margin: 0;
    font-family: "Inter", sans-serif;
    font-size: 18px;
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }

  .helper {
    margin: 0;
    color: var(--MH-Theme-Neutrals-Dark, #5f6871);
    font-family: "Inter", sans-serif;
    font-size: 14px;
    line-height: 22px;
  }
`;

const FormGrid = styled.div`
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(2, minmax(0, 1fr));

  @media (max-width: 759px) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;

  &.full {
    grid-column: 1 / -1;
  }

  .label {
    color: var(--MH-Theme-Neutrals-Black, #171717);
    font-family: "Inter", sans-serif;
    font-size: 13px;
    font-weight: 600;
    line-height: 20px;
  }

  input,
  textarea {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid #cccccc;
    border-radius: 8px;
    padding: 10px 12px;
    font-family: "Inter", sans-serif;
    font-size: 14px;
    line-height: 20px;
    color: var(--MH-Theme-Neutrals-Black, #171717);
    background: var(--MH-Theme-Neutrals-White, #ffffff);

    &:focus {
      outline: 0;
      border-color: var(--MH-Theme-Primary-Dark, #336f8a);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  textarea {
    min-height: 100px;
    resize: vertical;
  }

  .hint {
    margin: 0;
    color: var(--MH-Theme-Neutrals-Dark, #5f6871);
    font-size: 12px;
    line-height: 18px;
  }
`;

const LogoRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;

  .preview {
    width: 72px;
    height: 72px;
    border-radius: 12px;
    border: 1px solid #d3dae0;
    background: #eef1f2;
    overflow: hidden;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .placeholder {
      color: #5f6871;
      font-weight: 700;
      font-size: 28px;
    }
  }

  .controls {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
`;

const Feedback = styled.p`
  margin: 0;
  font-family: "Inter", sans-serif;
  font-size: 13px;
  line-height: 18px;
  color: ${({ $error }) =>
    $error
      ? "var(--MH-Theme-Error, #b42318)"
      : "var(--MH-Theme-Primary-Dark, #336f8a)"};
`;

const emptyDraft = () => ({
  name: "",
  tagline: "",
  department: "",
  location: "",
  website: "",
  primaryDomain: "",
  mission: "",
  interestIds: [],
});

export default function CreateOrganizationForm({
  user,
  onCancel,
  showHeader = true,
  embedded = false,
}) {
  const router = useRouter();
  const { t } = useTranslation("connect");
  const [draft, setDraft] = useState(emptyDraft);
  const [logoUpload, setLogoUpload] = useState(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const { data: tagsData } = useQuery(GET_TAGS);
  const tags = tagsData?.tags || [];

  const [createOrganization, { loading: creating }] = useMutation(
    CREATE_ORGANIZATION,
    {
      refetchQueries: [
        { query: CURRENT_USER_QUERY },
        { query: GET_PROFILE },
        { query: SPONSOR_ONBOARDING_STATE },
      ],
      awaitRefetchQueries: true,
    },
  );

  useEffect(() => {
    return () => {
      if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
    };
  }, [logoPreviewUrl]);

  const domainOptions = useMemo(
    () =>
      PRIMARY_DOMAIN_KEYS.map((key) => ({
        value: key,
        label: t(`organizationsList.domains.${key}`, {}, { default: key }),
      })),
    [t],
  );

  const interestOptions = useMemo(
    () =>
      tags.map((tag) => ({
        value: tag.id,
        label: tag.title,
      })),
    [tags],
  );

  const previewLetter = (draft.name || "?").charAt(0).toUpperCase();

  const setField = (key, value) => {
    setFeedback(null);
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleLogoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_LOGO_BYTES) {
      setFeedback({
        kind: "error",
        text: t("organizationsDetail.editProfile.logoTooLarge", {}, {
          default: "Logo must be 10 MB or smaller.",
        }),
      });
      event.target.value = "";
      return;
    }
    if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
    setLogoUpload(file);
    setLogoPreviewUrl(URL.createObjectURL(file));
    setFeedback(null);
  };

  const handleCreate = async () => {
    const name = draft.name.trim();
    if (!user?.id) {
      setFeedback({
        kind: "error",
        text: t("manageOrganization.create.notSignedIn", {}, {
          default: "You must be signed in to create an organization.",
        }),
      });
      return;
    }
    if (!name) {
      setFeedback({
        kind: "error",
        text: t("organizationsDetail.editProfile.nameRequired", {}, {
          default: "Organization name is required.",
        }),
      });
      return;
    }

    const input = {
      name,
      tagline: draft.tagline.trim(),
      department: draft.department.trim(),
      location: draft.location.trim(),
      website: draft.website.trim(),
      primaryDomain: draft.primaryDomain || null,
      mission: draft.mission.trim(),
      members: { connect: [{ id: user.id }] },
      createdBy: { connect: { id: user.id } },
    };
    if ((draft.interestIds || []).length > 0) {
      input.interests = {
        connect: draft.interestIds.map((id) => ({ id })),
      };
    }
    if (logoUpload) {
      input.logo = { upload: logoUpload };
    }

    try {
      const { data } = await createOrganization({ variables: { input } });
      const newId = data?.createOrganization?.id;
      if (!newId) {
        throw new Error(
          t("manageOrganization.create.createError", {}, {
            default: "Failed to create organization.",
          }),
        );
      }
      router.push(manageOrganizationHref(newId));
    } catch (err) {
      setFeedback({
        kind: "error",
        text:
          err?.message ||
          t("manageOrganization.create.createError", {}, {
            default: "Failed to create organization.",
          }),
      });
    }
  };

  return (
    <Card $embedded={embedded}>
      {showHeader ? (
        <div>
          <h2>
            {t("manageOrganization.create.title", {}, {
              default: "Create organization",
            })}
          </h2>
          <p className="helper">
            {t("manageOrganization.create.helper", {}, {
              default:
                "Add the public details for your organization. You can invite teammates and refine this profile after creating.",
            })}
          </p>
        </div>
      ) : (
        <p className="helper">
          {t("manageOrganization.create.helper", {}, {
            default:
              "Add the public details for your organization. You can invite teammates and refine this profile after creating.",
          })}
        </p>
      )}

      <Field className="full">
        <span className="label">
          {t("organizationsDetail.editProfile.logoLabel", {}, {
            default: "Logo",
          })}
        </span>
        <LogoRow>
          <div className="preview">
            {logoPreviewUrl ? (
              <img src={logoPreviewUrl} alt="" />
            ) : (
              <span className="placeholder" aria-hidden>
                {previewLetter}
              </span>
            )}
          </div>
          <div className="controls">
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              disabled={creating}
              aria-label={t("organizationsDetail.editProfile.logoChoose", {}, {
                default: "Choose logo image",
              })}
            />
            <p className="hint">
              {t("organizationsDetail.editProfile.logoHint", {}, {
                default: "PNG or JPG, up to 10 MB.",
              })}
            </p>
          </div>
        </LogoRow>
      </Field>

      <FormGrid>
        <Field className="full">
          <span className="label">
            {t("organizationsDetail.editProfile.nameLabel", {}, {
              default: "Name",
            })}
          </span>
          <input
            type="text"
            value={draft.name}
            onChange={(e) => setField("name", e.target.value)}
            disabled={creating}
            required
          />
        </Field>

        <Field className="full">
          <span className="label">
            {t("organizationsDetail.editProfile.taglineLabel", {}, {
              default: "Tagline",
            })}
          </span>
          <input
            type="text"
            value={draft.tagline}
            onChange={(e) => setField("tagline", e.target.value)}
            disabled={creating}
          />
        </Field>

        <Field>
          <span className="label">
            {t("organizationsDetail.editProfile.departmentLabel", {}, {
              default: "Department",
            })}
          </span>
          <input
            type="text"
            value={draft.department}
            onChange={(e) => setField("department", e.target.value)}
            disabled={creating}
          />
        </Field>

        <Field>
          <span className="label">
            {t("organizationsDetail.editProfile.locationLabel", {}, {
              default: "Location",
            })}
          </span>
          <input
            type="text"
            value={draft.location}
            onChange={(e) => setField("location", e.target.value)}
            disabled={creating}
          />
        </Field>

        <Field>
          <span className="label">
            {t("organizationsDetail.editProfile.websiteLabel", {}, {
              default: "Website",
            })}
          </span>
          <input
            type="url"
            value={draft.website}
            onChange={(e) => setField("website", e.target.value)}
            disabled={creating}
            placeholder="https://"
          />
        </Field>

        <Field>
          <span className="label">
            {t("organizationsDetail.editProfile.domainLabel", {}, {
              default: "Primary domain",
            })}
          </span>
          <DropdownSelect
            value={draft.primaryDomain || ""}
            onChange={(next) => setField("primaryDomain", next)}
            options={domainOptions}
            placeholder={t(
              "organizationsDetail.editProfile.domainPlaceholder",
              {},
              { default: "Select a domain" },
            )}
            ariaLabel={t("organizationsDetail.editProfile.domainLabel", {}, {
              default: "Primary domain",
            })}
            disabled={creating}
          />
        </Field>

        <Field className="full">
          <span className="label">
            {t("organizationsDetail.editProfile.missionLabel", {}, {
              default: "Mission",
            })}
          </span>
          <textarea
            value={draft.mission}
            onChange={(e) => setField("mission", e.target.value)}
            disabled={creating}
          />
        </Field>

        <Field className="full">
          <span className="label">
            {t("organizationsDetail.editProfile.interestsLabel", {}, {
              default: "Interests",
            })}
          </span>
          <DropdownSelect
            multiple
            value={draft.interestIds}
            onChange={(next) => setField("interestIds", next)}
            options={interestOptions}
            placeholder={t(
              "organizationsDetail.editProfile.interestsPlaceholder",
              {},
              { default: "Select interests" },
            )}
            ariaLabel={t(
              "organizationsDetail.editProfile.interestsLabel",
              {},
              { default: "Interests" },
            )}
            disabled={creating}
          />
        </Field>
      </FormGrid>

      <Actions>
        <DesignSystemButton
          variant="filled"
          type="button"
          disabled={creating}
          onClick={handleCreate}
        >
          {creating
            ? t("manageOrganization.create.creating", {}, {
                default: "Creating…",
              })
            : t("manageOrganization.create.submit", {}, {
                default: "Create organization",
              })}
        </DesignSystemButton>
        {onCancel ? (
          <DesignSystemButton
            variant="outline"
            type="button"
            disabled={creating}
            onClick={onCancel}
          >
            {t("manageOrganization.create.cancel", {}, { default: "Cancel" })}
          </DesignSystemButton>
        ) : null}
        {feedback ? (
          <Feedback $error={feedback.kind === "error"}>{feedback.text}</Feedback>
        ) : null}
      </Actions>
    </Card>
  );
}
