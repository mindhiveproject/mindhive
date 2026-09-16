import { useState } from "react";
import { useLazyQuery, useMutation } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import DesignSystemButton from "../../../DesignSystem/Button";
import { FIND_PROFILE_BY_EMAIL } from "../../../Queries/Organization";
import { GET_CLASS } from "../../../Queries/Classes";
import { CURRENT_USER_QUERY } from "../../../Queries/User";
import { UPDATE_CLASS_TEACHING_TEAM } from "../../../Mutations/Classes";
import { canManageTeachingTeam } from "../../../../lib/classTeacherUtils";

function memberDisplayName(profile, fallback) {
  const name = [profile?.firstName, profile?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return name || profile?.username || profile?.email || fallback;
}

export default function TeachingTeamSettings({ myclass, user }) {
  const { t } = useTranslation("classes");
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState(null);

  const canManage = canManageTeachingTeam(myclass, user?.id);
  const teachingTeam = myclass?.teachingTeam || [];
  const creatorId = myclass?.creator?.id;

  const refetchQueries = [
    { query: GET_CLASS, variables: { code: myclass?.code } },
    { query: CURRENT_USER_QUERY },
  ];

  const [findProfile, { loading: lookingUp }] = useLazyQuery(
    FIND_PROFILE_BY_EMAIL,
    { fetchPolicy: "network-only" }
  );

  const [updateTeachingTeam, { loading: updating }] = useMutation(
    UPDATE_CLASS_TEACHING_TEAM,
    { refetchQueries, awaitRefetchQueries: true }
  );

  const busy = lookingUp || updating;

  const handleAdd = async () => {
    const normalized = email.trim().toLowerCase();
    if (!myclass?.id || !normalized) {
      setFeedback({
        kind: "error",
        text: t("teachingTeam.emailRequired", {}, {
          default: "Enter an email address first.",
        }),
      });
      return;
    }

    if (teachingTeam.some((member) => member?.email?.toLowerCase() === normalized)) {
      setFeedback({
        kind: "error",
        text: t("teachingTeam.alreadyOnTeam", {}, {
          default: "That person is already on this teaching team.",
        }),
      });
      return;
    }

    try {
      const result = await findProfile({ variables: { email: normalized } });
      const profile = result?.data?.profiles?.[0];
      if (!profile?.id) {
        setFeedback({
          kind: "error",
          text: t("teachingTeam.noAccount", {}, {
            default: "No profile was found for that email address.",
          }),
        });
        return;
      }

      if (profile.id === creatorId) {
        setFeedback({
          kind: "error",
          text: t("teachingTeam.alreadyCreator", {}, {
            default: "That person is already the class teacher of record.",
          }),
        });
        return;
      }

      if (teachingTeam.some((member) => member?.id === profile.id)) {
        setFeedback({
          kind: "error",
          text: t("teachingTeam.alreadyOnTeam", {}, {
            default: "That person is already on this teaching team.",
          }),
        });
        return;
      }

      await updateTeachingTeam({
        variables: {
          id: myclass.id,
          teachingTeam: { connect: [{ id: profile.id }] },
        },
      });
      setEmail("");
      setFeedback({
        kind: "ok",
        text: t("teachingTeam.added", {}, {
          default: "Teacher added to the teaching team.",
        }),
      });
    } catch (err) {
      setFeedback({
        kind: "error",
        text:
          err?.message ||
          t("teachingTeam.addError", {}, {
            default: "Could not add that teacher.",
          }),
      });
    }
  };

  const handleRemove = async (profileId) => {
    if (!myclass?.id || !profileId || profileId === creatorId) return;
    try {
      await updateTeachingTeam({
        variables: {
          id: myclass.id,
          teachingTeam: { disconnect: [{ id: profileId }] },
        },
      });
      setFeedback({
        kind: "ok",
        text: t("teachingTeam.removed", {}, {
          default: "Teacher removed from the teaching team.",
        }),
      });
    } catch (err) {
      setFeedback({
        kind: "error",
        text:
          err?.message ||
          t("teachingTeam.removeError", {}, {
            default: "Could not remove that teacher.",
          }),
      });
    }
  };

  return (
    <section className="settingsSection">
      <div className="settingsSectionHeader">
        <h3>
          {t("teachingTeam.title", {}, { default: "Teaching team" })}
        </h3>
        <p>
          {t("teachingTeam.description", {}, {
            default:
              "Add other teachers to this class by email. They can manage the class with you. Only the teacher who created the class can delete it.",
          })}
        </p>
      </div>

      {teachingTeam.length === 0 ? (
        <p className="classDescriptionSettingsHint">
          {t("teachingTeam.empty", {}, {
            default: "No additional teachers have been added yet.",
          })}
        </p>
      ) : (
        <ul className="teachingTeamRoster">
          {teachingTeam.map((member) => (
            <li key={member.id} className="teachingTeamRosterItem">
              <div>
                <strong>
                  {memberDisplayName(
                    member,
                    t("teachingTeam.unknownMember", {}, { default: "Teacher" })
                  )}
                </strong>
                {member.email ? <span>{member.email}</span> : null}
              </div>
              {canManage ? (
                <DesignSystemButton
                  variant="text"
                  type="button"
                  disabled={busy}
                  onClick={() => handleRemove(member.id)}
                >
                  {t("teachingTeam.remove", {}, { default: "Remove" })}
                </DesignSystemButton>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {canManage ? (
        <div className="teachingTeamAddRow">
          <input
            type="email"
            value={email}
            autoComplete="email"
            placeholder={t("teachingTeam.emailPlaceholder", {}, {
              default: "teacher@example.com",
            })}
            aria-label={t("emailAddress", {}, { default: "Email address" })}
            onChange={(event) => setEmail(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleAdd();
              }
            }}
          />
          <DesignSystemButton
            variant="filled"
            type="button"
            disabled={busy}
            onClick={handleAdd}
          >
            {busy
              ? t("teachingTeam.adding", {}, { default: "Adding…" })
              : t("teachingTeam.add", {}, { default: "Add teacher" })}
          </DesignSystemButton>
        </div>
      ) : null}

      {feedback ? (
        <p
          role={feedback.kind === "error" ? "alert" : "status"}
          className={
            feedback.kind === "error"
              ? "teachingTeamFeedbackError"
              : "teachingTeamFeedbackOk"
          }
        >
          {feedback.text}
        </p>
      ) : null}
    </section>
  );
}
