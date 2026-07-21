import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";

import DesignSystemButton from "../../../DesignSystem/Button";
import DropdownSelect from "../../../DesignSystem/DropdownSelect";
import { UPDATE_ORGANIZATION } from "../../../Mutations/Organization";
import { EXPLORE_ORGANIZATION_DETAIL } from "../../../Queries/Organization";
import { GET_TAGS } from "../../../Queries/Tag";

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
  padding: 24px;
  border-radius: 16px;
  background: var(--MH-Theme-Neutrals-White, #ffffff);
  box-shadow: 0px 4px 24px rgba(0, 0, 0, 0.05);

  h2 {
    margin: 0;
    font-family: "Lato", sans-serif;
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
    min-height: 120px;
    resize: vertical;
  }
`;

const LogoRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;

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
      font-size: 24px;
    }
  }

  .controls {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }

  .hint {
    margin: 0;
    color: var(--MH-Theme-Neutrals-Dark, #5f6871);
    font-family: "Inter", sans-serif;
    font-size: 12px;
    line-height: 18px;
  }

  input[type="file"] {
    font-family: "Inter", sans-serif;
    font-size: 13px;
  }
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding-top: 4px;
`;

const Feedback = styled.p`
  margin: 0;
  color: ${(props) => (props.$error ? "#871b16" : "#1d6b3a")};
  font-family: "Inter", sans-serif;
  font-size: 13px;
  line-height: 20px;
`;

function buildDraft(org) {
  return {
    name: org?.name || "",
    tagline: org?.tagline || "",
    department: org?.department || "",
    location: org?.location || "",
    website: org?.website || "",
    primaryDomain: org?.primaryDomain || "",
    mission: org?.mission || "",
    interestIds: (org?.interests || []).map((tag) => tag.id).filter(Boolean),
  };
}

export default function OrganizationProfileEditor({
  organization,
  organizationId,
  onCancel,
  onSaved,
}) {
  const { t } = useTranslation("connect");
  const [draft, setDraft] = useState(() => buildDraft(organization));
  const [logoUpload, setLogoUpload] = useState(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [dirty, setDirty] = useState(false);

  const { data: tagsData } = useQuery(GET_TAGS);
  const tags = tagsData?.tags || [];

  const [updateOrganization, { loading: saving }] = useMutation(
    UPDATE_ORGANIZATION,
    {
      refetchQueries: [
        {
          query: EXPLORE_ORGANIZATION_DETAIL,
          variables: { id: organizationId },
        },
      ],
      awaitRefetchQueries: true,
    }
  );

  useEffect(() => {
    if (dirty) return;
    setDraft(buildDraft(organization));
  }, [organization, dirty]);

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
    [t]
  );

  const interestOptions = useMemo(
    () =>
      tags.map((tag) => ({
        value: tag.id,
        label: tag.title,
      })),
    [tags]
  );

  const previewSrc = logoPreviewUrl || organization?.logo?.url || null;
  const previewLetter = (draft.name || organization?.name || "?").charAt(0).toUpperCase();

  const setField = (key, value) => {
    setDirty(true);
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
    setDirty(true);
    setFeedback(null);
  };

  const handleSave = async () => {
    const name = draft.name.trim();
    if (!organizationId || !name) {
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
      interests: {
        set: (draft.interestIds || []).map((id) => ({ id })),
      },
    };
    if (logoUpload) {
      input.logo = { upload: logoUpload };
    }

    try {
      await updateOrganization({
        variables: { id: organizationId, input },
      });
      setLogoUpload(null);
      if (logoPreviewUrl) {
        URL.revokeObjectURL(logoPreviewUrl);
        setLogoPreviewUrl(null);
      }
      setDirty(false);
      setFeedback({
        kind: "ok",
        text: t("organizationsDetail.editProfile.saved", {}, {
          default: "Public profile saved.",
        }),
      });
      onSaved?.();
    } catch (err) {
      setFeedback({
        kind: "error",
        text:
          err?.message ||
          t("organizationsDetail.editProfile.saveError", {}, {
            default: "Failed to save public profile.",
          }),
      });
    }
  };

  return (
    <Card>
      <div>
        <h2>
          {t("organizationsDetail.editProfile.title", {}, {
            default: "Public profile",
          })}
        </h2>
        <p className="helper">
          {t("organizationsDetail.editProfile.helper", {}, {
            default:
              "Update the information visitors see on this organization page. Verification status cannot be changed here.",
          })}
        </p>
      </div>

      <Field className="full">
        <span className="label">
          {t("organizationsDetail.editProfile.logoLabel", {}, {
            default: "Logo",
          })}
        </span>
        <LogoRow>
          <div className="preview">
            {previewSrc ? (
              <img src={previewSrc} alt="" />
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
              disabled={saving}
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
            disabled={saving}
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
            disabled={saving}
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
            disabled={saving}
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
            disabled={saving}
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
            disabled={saving}
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
              { default: "Select a domain" }
            )}
            ariaLabel={t("organizationsDetail.editProfile.domainLabel", {}, {
              default: "Primary domain",
            })}
            disabled={saving}
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
            disabled={saving}
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
              { default: "Select interests" }
            )}
            ariaLabel={t(
              "organizationsDetail.editProfile.interestsLabel",
              {},
              { default: "Interests" }
            )}
            disabled={saving}
          />
          <p className="hint" style={{ margin: 0, color: "#5f6871", fontSize: 12 }}>
            {t("organizationsDetail.editProfile.interestsHint", {}, {
              default: "Shown as areas where your organization can help.",
            })}
          </p>
        </Field>
      </FormGrid>

      <Actions>
        <DesignSystemButton
          variant="filled"
          type="button"
          disabled={saving || !dirty}
          onClick={handleSave}
        >
          {saving
            ? t("organizationsDetail.editProfile.saving", {}, {
                default: "Saving…",
              })
            : t("organizationsDetail.editProfile.save", {}, {
                default: "Save public profile",
              })}
        </DesignSystemButton>
        {onCancel ? (
          <DesignSystemButton
            variant="outline"
            type="button"
            disabled={saving}
            onClick={onCancel}
          >
            {t("organizationsDetail.editProfile.cancel", {}, {
              default: "Cancel",
            })}
          </DesignSystemButton>
        ) : null}
        {feedback ? (
          <Feedback $error={feedback.kind === "error"}>{feedback.text}</Feedback>
        ) : null}
      </Actions>
    </Card>
  );
}
