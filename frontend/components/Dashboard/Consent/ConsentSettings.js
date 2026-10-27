import { useMutation, useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import Link from "next/link";
import useTranslation from "next-translate/useTranslation";

import useForm from "../../../lib/useForm";
import DisplayError from "../../ErrorMessage";
import Collaborators from "../../Global/Collaborators";
import Button from "../../DesignSystem/Button";
import Checkbox from "../../DesignSystem/Checkbox";
import DropdownSelect from "../../DesignSystem/DropdownSelect";
import Input from "../../DesignSystem/Input";
import Tooltip from "../../DesignSystem/Tooltip";

import { CREATE_CONSENT, EDIT_CONSENT } from "../../Mutations/Consent";
import {
  GET_CONSENT,
  GET_MY_CONSENTS,
  GET_MY_STUDENT_CLASSES,
} from "../../Queries/Consent";
import MessageCard from "../../DesignSystem/MessageCard";
import BackToProtocols from "./BackToProtocols";
import DeleteConsentSection from "./DeleteConsentSection";
import useSavedFlash from "./useSavedFlash";
import useConsentSections from "./useConsentSections";
import {
  DEFAULT_GROUPS,
  LINK_EXPIRY_DAYS,
  REMINDER_AFTER_DAYS,
  consentTypesForGroups,
  finalizeInfo,
  formReady,
  getConsentType,
  hasMinorGroup,
  isStudentUser,
  normalizeInfo,
  normalizeSettings,
  visibleGroups,
} from "./consentTypes";

// "Consent & eligibility" (Figma node 9:336). Creates the protocol when
// `consent` is empty, otherwise edits its settings.
// `template`: a public protocol being customized; prefills a new protocol
// that only gets created when the user clicks Create.
export default function ConsentSettings({ consent, template, user }) {
  const router = useRouter();
  const { t } = useTranslation("dashboard");
  const isNew = !consent?.id;
  const [justSaved, flashSaved] = useSavedFlash();
  const ownerId = consent?.author?.id || user?.id;

  const { inputs, handleChange, handleMultipleUpdate } = useForm(
    {
      title:
        consent?.title ||
        (template?.title ? `${template.title} (${user?.username}'s copy)` : ""),
      description: consent?.description || template?.description || "",
      collaborators: consent?.collaborators || [],
      classId: consent?.class?.id || "",
      settings: normalizeSettings(
        // a copy never inherits the template's review state
        consent?.settings ||
          (template?.settings
            ? { ...template.settings, review: undefined }
            : null),
        isNew ? DEFAULT_GROUPS : undefined
      ),
    },
    { freezeInitialSync: true }
  );
  const { eligibility, parentPermission } = inputs.settings;

  const refetchQueries = [
    { query: GET_MY_CONSENTS, variables: { userId: user?.id } },
  ];
  const [createConsent, { loading: creating, error: createError }] =
    useMutation(CREATE_CONSENT, { refetchQueries });
  const [editConsent, { loading: saving, error: editError }] = useMutation(
    EDIT_CONSENT,
    {
      refetchQueries: [
        ...refetchQueries,
        { query: GET_CONSENT, variables: { code: consent?.code } },
      ],
    }
  );
  const loading = creating || saving;
  // students link the protocol to a class: its teaching team reviews it
  const isStudent = isStudentUser(user);
  const { data: classData } = useQuery(GET_MY_STUDENT_CLASSES, {
    skip: !isStudent,
  });
  const studentClasses = classData?.authenticatedItem?.studentIn || [];
  const classOptions = studentClasses.map((cl) => ({
    value: cl.id,
    label: cl.title || cl.code,
  }));
  // the class picked here decides which consent sections apply
  const sectionsClassId = inputs.classId || consent?.class?.id;
  const pickedClass =
    studentClasses.find((cl) => cl.id === sectionsClassId) ||
    (consent?.class?.id === sectionsClassId ? consent?.class : null);
  const { sectionsFor } = useConsentSections({
    classId: sectionsClassId,
    classNetworkId: pickedClass?.networks?.[0]?.id,
    review: consent?.settings?.review,
  });
  // approved by the teaching team: read-only until they reopen it
  const locked = consent?.settings?.review?.status === "approved";
  const groups = visibleGroups(user);
  const selectedGroups = eligibility.groups.filter((key) =>
    groups.some((group) => group.key === key)
  );
  const needsParentPermission = hasMinorGroup(selectedGroups);
  const canSave =
    !!inputs.title.trim() &&
    selectedGroups.length > 0 &&
    (!isStudent || !!inputs.classId) &&
    !loading &&
    !locked;

  const toggleGroup = (key, checked) =>
    setSettings("eligibility", {
      groups: checked
        ? [...eligibility.groups, key]
        : eligibility.groups.filter((k) => k !== key),
    });

  const setSettings = (group, values) =>
    handleMultipleUpdate({
      settings: {
        ...inputs.settings,
        [group]: { ...inputs.settings[group], ...values },
      },
    });

  // the owner is always a collaborator: kept out of the picker, added on save
  const collaborators = (inputs.collaborators || []).filter(
    (c) => c?.id && c?.id !== ownerId
  );
  const userClasses = [
    ...(user?.teacherIn || []),
    ...(user?.teachingTeamIn || []),
    ...(user?.mentorIn || []),
    ...(user?.studentIn || []),
  ].map((cl) => cl?.id);

  async function handleSave() {
    if (!canSave) return;
    try {
      if (isNew) {
        const { data } = await createConsent({
          variables: {
            input: {
              title: inputs.title,
              description: inputs.description,
              settings: inputs.settings,
              info: finalizeInfo(
                normalizeInfo(template?.info || []),
                sectionsFor
              ),
              ...(template?.organization
                ? { organization: template.organization }
                : {}),
              class: inputs.classId
                ? { connect: { id: inputs.classId } }
                : null,
              // the creator is added as a collaborator by the server
              collaborators: collaborators.length
                ? { connect: collaborators.map((c) => ({ id: c.id })) }
                : null,
            },
          },
        });
        // back to the list, where the new protocol can be opened
        if (data?.createConsent?.id) router.push("/dashboard/irb");
      } else {
        const ids = [
          ...new Set([...collaborators.map((c) => c.id), ownerId]),
        ].filter(Boolean);
        await editConsent({
          variables: {
            id: consent.id,
            title: inputs.title,
            description: inputs.description,
            settings: inputs.settings,
            collaborators: { set: ids.map((id) => ({ id })) },
            ...(isStudent && inputs.classId
              ? { class: { connect: { id: inputs.classId } } }
              : {}),
          },
        });
        flashSaved();
      }
    } catch (err) {
      // surfaced through the mutation error
    }
  }

  const tabs = consentTypesForGroups(user, selectedGroups, consent?.info);
  const info = normalizeInfo(consent?.info);
  const expiryOptions = LINK_EXPIRY_DAYS.map((days) => ({
    value: String(days),
    label: t(
      "consentSettings.days",
      { count: days },
      {
        default: `${days} days`,
      }
    ),
  }));
  const reminderOptions = [
    {
      value: "none",
      label: t("consentSettings.noReminder", {}, { default: "No reminder" }),
    },
    ...REMINDER_AFTER_DAYS.map((days) => ({
      value: String(days),
      // a reminder only makes sense before the link expires
      disabled: days >= parentPermission.linkExpiryDays,
      label: t(
        "consentSettings.afterDays",
        { count: days },
        {
          default: days === 1 ? "After 1 day" : `After ${days} days`,
        }
      ),
    })),
  ];

  return (
    <div className="consentSettings">
      <div className="consentEditorHeader">
        <h1>
          <BackToProtocols />
          {t(
            "consentSettings.heading",
            {},
            {
              default: "Consent & eligibility",
            }
          )}
        </h1>
        <div className="consentHeaderActions">
          {justSaved && (
            <span className="consentSavedNotice" role="status">
              ✓ {t("consentAdmin.saved", {}, { default: "Saved" })}
            </span>
          )}
          <Button
            variant="filled"
            type="button"
            disabled={!canSave}
            onClick={handleSave}
          >
            {loading
              ? t("consentAdmin.saving", {}, { default: "Saving…" })
              : isNew
              ? t(
                  "consentSettings.createProtocol",
                  {},
                  {
                    default: "Create protocol",
                  }
                )
              : t("consentAdmin.save", {}, { default: "Save" })}
          </Button>
        </div>
      </div>
      <p className="consentSettingsIntro">
        {t(
          "consentSettings.intro",
          {},
          {
            default:
              "Decide who can take part and how permission is collected. Your teacher reviews these settings before the study goes live.",
          }
        )}
      </p>
      {locked && (
        <p className="consentSettingsNote">
          {t(
            "consentAdmin.review.locked",
            {},
            {
              default:
                "This protocol was approved and is locked. Ask your teacher to reopen it to make changes.",
            }
          )}
        </p>
      )}

      <DisplayError error={createError || editError} />

      <section className="consentSettingsCard">
        <h2>
          {t(
            "consentSettings.aboutProtocol",
            {},
            {
              default: "About this protocol",
            }
          )}
        </h2>
        <Input
          label={t(
            "consentSettings.protocolName",
            {},
            {
              default: "Protocol name",
            }
          )}
          value={inputs.title}
          onChange={(value) =>
            handleChange({ target: { name: "title", value } })
          }
          disabled={loading}
          required
        />
        <Input
          label={t("consentAdmin.description", {}, { default: "Description" })}
          multiline
          rows={2}
          value={inputs.description}
          onChange={(value) =>
            handleChange({ target: { name: "description", value } })
          }
          disabled={loading}
        />
        <div className="consentFormCollaborators">
          <span>
            {t(
              "consentAdmin.collaborators",
              {},
              {
                default: "Collaborators",
              }
            )}
          </span>
          <Collaborators
            userClasses={userClasses}
            isStudent={isStudent}
            excludeUserId={ownerId}
            collaborators={collaborators}
            handleChange={handleChange}
          />
          {isStudent && (
            <MessageCard
              variant="information"
              message={t(
                "consentSettings.collaboratorsInfo",
                {},
                {
                  default:
                    "Need your teacher’s approval? Connect this protocol to your class below.",
                }
              )}
            />
          )}
        </div>

        {isStudent && (
          <label className="consentFormClass">
            <span>{t("consentSettings.class", {}, { default: "Class" })}</span>
            <DropdownSelect
              value={inputs.classId || null}
              options={classOptions}
              disabled={loading}
              placeholder={t(
                "consentSettings.pickClass",
                {},
                { default: "Choose your class" }
              )}
              ariaLabel={t("consentSettings.class", {}, { default: "Class" })}
              onChange={(classId) =>
                handleChange({ target: { name: "classId", value: classId } })
              }
            />
            <span className="consentSettingsNote">
              {t(
                "consentSettings.classHint",
                {},
                {
                  default:
                    "Required. Your class’s teaching team reviews this protocol.",
                }
              )}
            </span>
          </label>
        )}
      </section>

      <section className="consentSettingsCard">
        <h2>
          {t(
            "consentSettings.whoCanTakePart",
            {},
            {
              default: "Who can take part",
            }
          )}
        </h2>
        <ul className="consentGroupList">
          {groups.map((group) => {
            const checked = eligibility.groups.includes(group.key);
            const labelId = `consentGroup-${group.key}`;
            return (
              <li key={group.key}>
                <Checkbox
                  checked={checked}
                  disabled={loading}
                  ariaLabelledBy={labelId}
                  onChange={(next) => toggleGroup(group.key, next)}
                />
                <div
                  className="consentGroupText"
                  onClick={() => !loading && toggleGroup(group.key, !checked)}
                >
                  <span id={labelId} className="consentFormStatusName">
                    {t(
                      `consentSettings.groups.${group.key}`,
                      {},
                      {
                        default: group.label,
                      }
                    )}
                  </span>
                  <span className="consentFormStatusHint">
                    {t(
                      `consentSettings.groupHints.${group.key}`,
                      {},
                      {
                        default: group.hint,
                      }
                    )}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="consentSettingsNote">
          {t(
            "consentSettings.groupsNote",
            {},
            {
              default:
                "Each group you tick adds its consent forms below. Participants are sent to the forms that match their age.",
            }
          )}
        </p>
      </section>

      <section className="consentSettingsCard">
        <div className="consentSettingsCardHeader">
          <h2>
            {t(
              "consentSettings.consentForms",
              {},
              {
                default: "Consent forms",
              }
            )}
          </h2>
          {tabs.length > 0 &&
            (isNew ? (
              <Tooltip
                content={t(
                  "consentSettings.saveToEdit",
                  {},
                  { default: "Save the protocol to edit this form." }
                )}
              >
                <Button variant="filled" type="button" disabled>
                  {t("consentAdmin.editForms", {}, { default: "Edit forms" })}
                </Button>
              </Tooltip>
            ) : (
              <Link
                href={{
                  pathname: `/dashboard/irb/${consent.code}`,
                  query: { action: "edit", form: tabs[0] },
                }}
              >
                <Button variant="filled" type="button">
                  {t("consentAdmin.editForms", {}, { default: "Edit forms" })}
                </Button>
              </Link>
            ))}
        </div>
        {tabs.length === 0 && (
          <p className="consentSettingsNote">
            {t(
              "consentSettings.pickGroup",
              {},
              {
                default:
                  "Tick at least one group above to add its consent forms.",
              }
            )}
          </p>
        )}
        {tabs.length > 0 && (
          <ul className="consentFormStatus">
            {tabs.map((name) => {
              const type = getConsentType(name);
              const block = info.find((b) => b?.name === name);
              const ready = formReady(block, sectionsFor(name));
              return (
                <li key={name}>
                  <div>
                    <span className="consentFormStatusName">
                      {t(
                        `consentAdmin.types.${name}`,
                        {},
                        {
                          default: type?.label || block?.description || name,
                        }
                      )}
                    </span>
                    {type?.hint && (
                      <span className="consentFormStatusHint">
                        {t(
                          `consentSettings.hints.${name}`,
                          {},
                          {
                            default: type.hint,
                          }
                        )}
                      </span>
                    )}
                  </div>
                  <Tooltip
                    disabled={!isNew}
                    content={t(
                      "consentSettings.saveToEdit",
                      {},
                      { default: "Save the protocol to edit this form." }
                    )}
                  >
                    <span
                      className={ready ? "statusBadge ready" : "statusBadge"}
                      tabIndex={isNew ? 0 : undefined}
                    >
                      {ready
                        ? t("consentSettings.ready", {}, { default: "Ready" })
                        : t(
                            "consentSettings.needsContent",
                            {},
                            {
                              default: "Needs content",
                            }
                          )}
                    </span>
                  </Tooltip>
                  {!isNew && (
                    <Link
                      className="consentFormStatusEdit"
                      href={{
                        pathname: `/dashboard/irb/${consent.code}`,
                        query: { action: "edit", form: name },
                      }}
                    >
                      {t("consentAdmin.edit", {}, { default: "Edit" })}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {needsParentPermission && (
        <section className="consentSettingsCard">
          <div className="consentSettingRow">
            <div>
              <div className="consentSettingTitle">
                <h2 id="parentPermissionLabel">
                  {t(
                    "consentSettings.parentPermission",
                    {},
                    {
                      default: "Require parent / guardian permission by email",
                    }
                  )}
                </h2>
              </div>
              <p>
                {t(
                  "consentSettings.parentPermissionInfo",
                  {},
                  {
                    default:
                      "Under-18 participants enter a parent’s email. The study stays locked until the parent approves.",
                  }
                )}
              </p>
            </div>
          </div>

          <div className="consentSettingSelects">
            <label>
              <span>
                {t(
                  "consentSettings.linkExpires",
                  {},
                  {
                    default: "Link expires after",
                  }
                )}
              </span>
              <DropdownSelect
                value={String(parentPermission.linkExpiryDays)}
                options={expiryOptions}
                disabled={loading}
                ariaLabel={t(
                  "consentSettings.linkExpires",
                  {},
                  {
                    default: "Link expires after",
                  }
                )}
                onChange={(value) => {
                  const linkExpiryDays = Number(value);
                  const reminder = parentPermission.reminderAfterDays;
                  setSettings("parentPermission", {
                    linkExpiryDays,
                    // drop a reminder that would come after the expiry
                    reminderAfterDays:
                      reminder && reminder >= linkExpiryDays ? null : reminder,
                  });
                }}
              />
            </label>
            <label>
              <span>
                {t(
                  "consentSettings.sendReminder",
                  {},
                  {
                    default: "Send a reminder",
                  }
                )}
              </span>
              <DropdownSelect
                value={
                  parentPermission.reminderAfterDays
                    ? String(parentPermission.reminderAfterDays)
                    : "none"
                }
                options={reminderOptions}
                disabled={loading}
                ariaLabel={t(
                  "consentSettings.sendReminder",
                  {},
                  {
                    default: "Send a reminder",
                  }
                )}
                onChange={(value) =>
                  setSettings("parentPermission", {
                    reminderAfterDays: value === "none" ? null : Number(value),
                  })
                }
              />
            </label>
          </div>
        </section>
      )}

      {/* only the author may delete a protocol */}
      {!isNew && consent?.author?.id === user?.id && (
        <DeleteConsentSection consent={consent} user={user} />
      )}
    </div>
  );
}
