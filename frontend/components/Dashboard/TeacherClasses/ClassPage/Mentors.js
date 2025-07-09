import { useMutation } from "@apollo/client";
import uniqid from "uniqid";
import { Dropdown } from "semantic-ui-react";
import Link from "next/link";
import absoluteUrl from "next-absolute-url";
import useTranslation from "next-translate/useTranslation";

import { EDIT_CLASS } from "../../../Mutations/Classes";
import { REMOVE_MENTOR_FROM_CLASS } from "../../../Mutations/Classes";
import { GET_CLASS } from "../../../Queries/Classes";
// import { GET_TEACHER_CLASSES } from "../../../Queries/Classes";

export default function ClassMentors({ myclass, user }) {
  const { t } = useTranslation("classes");
  const { origin } = absoluteUrl();

  const [updateClass, { loading }] = useMutation(EDIT_CLASS, {
    variables: {
      id: myclass?.id,
    },
    refetchQueries: [{ query: GET_CLASS, variables: { code: myclass?.code } }],
  });

  const [removeFromClass, { loading: removeLoading }] = useMutation(
    REMOVE_MENTOR_FROM_CLASS,
    {
      variables: {
        classId: myclass?.id,
      },
      refetchQueries: [
        // { query: GET_TEACHER_CLASSES, variables: { id: user?.id } },
        { query: GET_CLASS, variables: { code: myclass?.code } },
      ],
    }
  );

  const mentors = myclass?.mentors || [];
  const mentorInvitationCode = myclass?.settings?.mentorInvitationCode;

  const copyLink = (mentorInvitationCode) => {
    const copyLink = `${origin}/signup/mentor?code=${myclass.code}&i=${mentorInvitationCode}`;
    const temp = document.createElement("input");
    document.body.append(temp);
    temp.value = copyLink;
    temp.select();
    document.execCommand("copy");
    temp.remove();
    alert(t("mentors.linkCopied"));
  };

  return (
    <div className="mentors">
      <div className="mentorsPageHeader">
        {mentorInvitationCode && (
          <div>
            <p>
              {t("mentors.shareLinkWithMentors")}
            </p>
            <div className="copyArea">
              <div className="link">
                {origin}/signup/mentor?code={myclass.code}&i=
                {mentorInvitationCode}
              </div>
              <div
                className="copyButton"
                onClick={() => copyLink(mentorInvitationCode)}
              >
                {t("mentors.copy")}
              </div>
            </div>
          </div>
        )}

        <div>
          {mentorInvitationCode ? (
            <div className="infoText">
              {t("mentors.newLinkWillInvalidate")}
            </div>
          ) : (
            <div className="infoText">
              {t("mentors.createNewInvitationLink")}
            </div>
          )}
          <button
            className="copyButton"
            onClick={async () => {
              await updateClass({
                variables: {
                  settings: {
                    ...myclass?.settings,
                    mentorInvitationCode: uniqid.time(),
                  },
                },
              });
            }}
          >
            {loading ? t("mentors.creating") : t("mentors.createLink")}
          </button>
        </div>
      </div>

      <div className="listHeader">
        <div></div>
        <div>{t("mentors.mentorUsername")}</div>
        <div>{t("mentors.emailAddress")}</div>
      </div>

      {mentors.map((mentor, i) => {
        return (
          <div key={i} className="listWrapper">
            <Dropdown className="dropdownMenu" simple>
              <Dropdown.Menu>
                <Dropdown.Item
                  className="dropdownItem"
                  name="remove"
                  onClick={() => {
                    if (
                      confirm(
                        t("mentors.removeMentorConfirm")
                      )
                    ) {
                      removeFromClass({
                        variables: { mentorId: mentor?.id },
                      }).catch((err) => {
                        alert(err.message);
                      });
                    }
                  }}
                >
                  {t("mentors.removeFromClass")}
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
            <Link
              href={{
                pathname: `/dashboard/mentors/${mentor?.publicId}`,
              }}
            >
              <div className="listRow" style={{ cursor: "pointer" }}>
                <div>{mentor?.username}</div>
                <div>{mentor?.email}</div>
              </div>
            </Link>
          </div>
        );
      })}
    </div>
  );
}
